import hashlib
import json
from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models.audit_trail import AuditTrailEntry
from backend.models.audit_trail_chain import (
    compute_entry_hash,
    get_latest_hash,
    verify_chain,
)
import backend.models  # noqa: F401  (register models on Base.metadata)


DETAILS = {"hostname": "r1", "score": 88.5}
CREATED = datetime(2025, 6, 1, 12, 0, 0, 123456)


def _expected(prev_hash, action="AUDIT_RUN", actor="system", target_type="audit",
              target_id=7, details=None, created=CREATED):
    fields = {
        "action": action,
        "actor": actor,
        "target_type": target_type,
        "target_id": target_id,
        "details_json": details,
        "created_at": created.isoformat(),
    }
    canonical = json.dumps(fields, sort_keys=True, separators=(",", ":"), default=str)
    digest_input = (canonical + (prev_hash or "")).encode("utf-8")
    return hashlib.sha256(digest_input).hexdigest()


def test_compute_entry_hash_byte_for_byte_canonicalization():
    got = compute_entry_hash(None, "AUDIT_RUN", "system", "audit", 7, DETAILS, CREATED)
    assert got == _expected(None, details=DETAILS, created=CREATED)

    prev = "deadbeef"
    got_chained = compute_entry_hash(prev, "AUDIT_RUN", "system", "audit", 7, DETAILS, CREATED)
    assert got_chained == _expected(prev, details=DETAILS, created=CREATED)
    assert got_chained != got


def test_compute_entry_hash_details_key_order_is_irrelevant():
    a = compute_entry_hash(None, "X", "sys", "t", 1, {"a": 1, "b": 2, "c": {"d": 3}}, CREATED)
    b = compute_entry_hash(None, "X", "sys", "t", 1, {"c": {"d": 3}, "b": 2, "a": 1}, CREATED)
    assert a == b


def test_compute_entry_hash_none_predhash_equals_empty_prev():
    assert compute_entry_hash(None, "A", "a", None, None, None, CREATED) == compute_entry_hash(
        "", "A", "a", None, None, None, CREATED
    )


def test_compute_entry_hash_created_at_enters_hash():
    a = compute_entry_hash("p", "A", "a", None, None, None, datetime(2025, 1, 1))
    b = compute_entry_hash("p", "A", "a", None, None, None, datetime(2025, 1, 2))
    assert a != b


@pytest.fixture()
def db_and_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    session.expire_all()
    yield engine, Session, session
    session.close()


def _append(db, action="AUDIT_RUN", actor="system", target_type="audit", target_id=7,
            details=None, created=CREATED):
    prev = get_latest_hash(db)
    entry = AuditTrailEntry(
        action=action,
        actor=actor,
        target_type=target_type,
        target_id=target_id,
        details_json=details,
        created_at=created,
    )
    entry.entry_hash = compute_entry_hash(
        prev, action, actor, target_type, target_id, entry.details_json, entry.created_at
    )
    entry.prev_hash = prev
    db.add(entry)
    db.commit()
    return entry


def _verify_from_fresh_session(engine, Session, *args):
    fresh = Session()
    result = verify_chain(fresh)
    fresh.close()
    return result


def test_get_latest_hash_orders_by_id_not_created_at(db_and_session):
    engine, Session, db = db_and_session
    older = _append(db, action="OLD", created=datetime(2000, 1, 1))
    newer = _append(db, action="NEW", created=datetime(2030, 1, 1))
    assert get_latest_hash(db) == newer.entry_hash
    assert get_latest_hash(db) != older.entry_hash


def test_verify_chain_pure_chain_is_verified(db_and_session):
    engine, Session, db = db_and_session
    _append(db, action="AUDIT_RUN", details={"score": 95.0})
    _append(db, action="MAPPING_APPROVED", target_type="mapping_cache")
    _append(db, action="FINDING_WAIVED", target_type="finding", details={"rule_id": "r1"})
    result = _verify_from_fresh_session(engine, Session)
    assert result == {
        "verified": True,
        "total_entries": 3,
        "first_broken_entry_id": None,
        "first_broken_reason": None,
    }


def test_verify_chain_empty_table_is_verified(db_and_session):
    engine, Session, _ = db_and_session
    result = _verify_from_fresh_session(engine, Session)
    assert result["verified"] is True
    assert result["total_entries"] == 0


def test_verify_chain_detects_modified_details(db_and_session):
    engine, Session, db = db_and_session
    _append(db, action="AUDIT_RUN", details={"score": 95.0})
    middle = _append(db, action="MAPPING_APPROVED", target_type="mapping_cache", details={"vendor": "cisco"})
    _append(db, action="FINDING_WAIVED", target_type="finding", details={"rule_id": "r1"})
    mutated = dict(middle.details_json or {})
    mutated["tampered_by_demo"] = True
    middle.details_json = mutated
    db.commit()
    result = _verify_from_fresh_session(engine, Session)
    assert result["verified"] is False
    assert result["first_broken_entry_id"] == middle.id
    assert result["first_broken_reason"] == "entry_hash_mismatch"


def test_verify_chain_detects_broken_prev_link(db_and_session):
    engine, Session, db = db_and_session
    _append(db, action="AUDIT_RUN", details={"score": 95.0})
    middle = _append(db, action="MAPPING_APPROVED", target_type="mapping_cache")
    _append(db, action="FINDING_WAIVED", target_type="finding", details={"rule_id": "r1"})
    middle.prev_hash = "tampered"
    db.commit()
    result = _verify_from_fresh_session(engine, Session)
    assert result["verified"] is False
    assert result["first_broken_entry_id"] == middle.id
    assert result["first_broken_reason"] == "prev_hash_mismatch"


def test_verify_chain_first_row_prev_hash_must_be_none(db_and_session):
    engine, Session, db = db_and_session
    first = _append(db, action="AUDIT_RUN")
    _append(db, action="FINDING_WAIVED", target_type="finding")
    first.prev_hash = "tampered"
    db.commit()
    result = _verify_from_fresh_session(engine, Session)
    assert result["verified"] is False
    assert result["first_broken_entry_id"] == first.id
    assert result["first_broken_reason"] == "first_row_prev_hash_not_null"