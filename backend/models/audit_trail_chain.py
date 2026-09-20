"""Deterministic tamper-evident hashing for the audit trail (additive).

Every AuditTrailEntry is chained onto the previous entry's hash:

    entry_hash = sha256( canonical_json + prev_hash ).hexdigest()

CANONICALIZATION CONTRACT (verifiers MUST reproduce byte-for-byte):

    fields = {
        "action":        action,                   # str
        "actor":         actor,                    # str
        "target_type":   target_type,              # str | None
        "target_id":     target_id,                # int | None
        "details_json":  details_json,             # dict | None (JSON native values)
        "created_at":    created_at.isoformat(),   # str — exact persisted value
    }
    canonical_json = json.dumps(
        fields,
        sort_keys=True,        # fixed key order, recursively (details_json too)
        separators=(",", ":"), # no whitespace
        default=str,           # defensive; JSON-native values never trigger it
    )
    digest_input = (canonical_json + (prev_hash or "")).encode("utf-8")
    entry_hash   = hashlib.sha256(digest_input).hexdigest()

NOTE: prev_hash is appended AFTER the canonical JSON, never inside it, and a
None prev_hash contributes the empty string (so the very first row hashes the
same as a row written with an explicit empty prev_hash).
"""

import hashlib
import json
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from backend.models.audit_trail import AuditTrailEntry


def compute_entry_hash(
    prev_hash: Optional[str],
    action: str,
    actor: str,
    target_type: Optional[str],
    target_id: Optional[int],
    details_json: Optional[Dict[str, Any]],
    created_at: datetime,
) -> str:
    """SHA-256 of the canonical serialization of this entry's fields chained onto
    the previous entry's hash. See the module docstring for the byte-for-byte
    canonicalization contract."""
    fields = {
        "action": action,
        "actor": actor,
        "target_type": target_type,
        "target_id": target_id,
        "details_json": details_json,
        "created_at": created_at.isoformat(),
    }
    canonical_json = json.dumps(
        fields,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    digest_input = (canonical_json + (prev_hash or "")).encode("utf-8")
    return hashlib.sha256(digest_input).hexdigest()


def get_latest_hash(db: Session) -> Optional[str]:
    """entry_hash of the most recent audit trail row (ordered by id, NOT
    created_at), or None when the table is empty (or the newest row predates
    hashing and has no entry_hash yet)."""
    row = db.query(AuditTrailEntry).order_by(AuditTrailEntry.id.desc()).first()
    return row.entry_hash if row else None


def verify_chain(db: Session) -> Dict[str, Any]:
    """Walk the ENTIRE audit trail in id order, verifying the hash chain.

    Stops at the first mismatch and reports it. Returns:
        {verified, total_entries, first_broken_entry_id, first_broken_reason}

    For each row the stored entry_hash is compared against a recomputation
    using the PREVIOUS row's entry_hash as prev_hash; then prev_hash must equal
    the previous row's entry_hash (None for the very first row).
    """
    rows = db.query(AuditTrailEntry).order_by(AuditTrailEntry.id.asc()).all()
    total_entries = len(rows)
    prev_entry_hash: Optional[str] = None
    for row in rows:
        recomputed = compute_entry_hash(
            prev_entry_hash,
            row.action,
            row.actor,
            row.target_type,
            row.target_id,
            row.details_json,
            row.created_at,
        )
        if recomputed != row.entry_hash:
            return {
                "verified": False,
                "total_entries": total_entries,
                "first_broken_entry_id": row.id,
                "first_broken_reason": "entry_hash_mismatch",
            }
        if row.prev_hash != prev_entry_hash:
            reason = "first_row_prev_hash_not_null" if prev_entry_hash is None else "prev_hash_mismatch"
            return {
                "verified": False,
                "total_entries": total_entries,
                "first_broken_entry_id": row.id,
                "first_broken_reason": reason,
            }
        prev_entry_hash = row.entry_hash
    return {
        "verified": True,
        "total_entries": total_entries,
        "first_broken_entry_id": None,
        "first_broken_reason": None,
    }