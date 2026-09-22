"""Deterministic tamper-evident hashing for the audit trail (additive).

This module provides the three primitives every AuditTrailEntry write site
and the verify endpoint use:

  * compute_entry_hash(...)  -> SHA-256 over a *canonical* serialization of
    the entry's own fields, chained onto `prev_hash` (empty string when the
    row is the table's very first, so even a prev-less first row hashes a
    deterministic value).
  * get_latest_hash(db)      -> the entry_hash of the most recent row (by
    `id`, never by `created_at`, to avoid clock-skew reordering), or None if
    the table is empty.
  * verify_chain(db)         -> walks every row in id order, recomputes
    each entry_hash, and returns a structured report of the first broken link
    if any.

CANONICALIZATION CONTRACT (verifiers MUST reproduce byte-for-byte):

  payload = {
      "action":      action,
      "actor":       actor,
      "target_type": target_type,          # JSON null if None
      "target_id":   target_id,            # JSON null if None
      "details_json": details_json,        # must be already-resolved dict/None
      "created_at":  created_at.isoformat(),
  }
  canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=True, default=str)
  digest_input = (canonical + (prev_hash or "")).encode("utf-8")
  entry_hash = hashlib.sha256(digest_input).hexdigest()

Keys are serialized in SORTED order (sort_keys=True) so the output is
stable regardless of the insertion order of the payload dict. The verifier
calls compute_entry_hash with the SAME arguments read from the persisted
row, so the two sides are reproducible from stored values alone.

`created_at` IS included in the hash payload. Every write site computes
`now = datetime.utcnow()` once, sets `created_at=now` on the row, and
passes that exact same `now` into compute_entry_hash — the value is fully
known and identical at both write and verify time. Including the timestamp
closes a real tamper gap: without it, an attacker with direct DB access
could quietly backdate or reorder when an approval or waiver occurred
without the chain detecting it.

`prev_hash` is appended raw (not inside the JSON) so that the chaining
relationship is always visible and its absence (first row) and presence
(subsequent rows) both produce distinct, deterministic hashes. None and ""
are treated identically (both produce an empty-string suffix) so the first-
row hash is stable regardless of how the caller spells "no previous hash".
"""

import hashlib
import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session


def compute_entry_hash(
    prev_hash: Optional[str],
    action: str,
    actor: str,
    target_type: Optional[str],
    target_id: Optional[int],
    details_json: Any,
    created_at: datetime,
) -> str:
    """Return the SHA-256 hash for ONE audit-trail row given its own fields
    and the previous row's entry_hash (or None / "" for the table's first row).

    See module docstring for the byte-for-byte canonicalization contract;
    the verifier calls this with the SAME argument order so the two sides
    are reproducible from persisted values alone.
    """
    payload = {
        "action": action,
        "actor": actor,
        "target_type": target_type,
        "target_id": target_id,
        "details_json": details_json,
        "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"),
                           ensure_ascii=True, default=str)
    digest_input = (canonical + (prev_hash or "")).encode("utf-8")
    return hashlib.sha256(digest_input).hexdigest()


def get_latest_hash(db: Session) -> Optional[str]:
    """Return the entry_hash of the most recently-inserted audit-trail row,
    or None if the table is empty.

    Ordering is by `id` (the append-only primary-key sequence), never by
    `created_at`, so a clock-skewed created_at on a new row can never
    reorder the chain when this is called to find the "latest" existing row.
    """
    # Lazy import to avoid circular dependency:
    # audit_trail.py → database.py (Base); this module → audit_trail.py
    # Only needed at call time, not at module load time.
    from backend.models.audit_trail import AuditTrailEntry  # noqa: PLC0415

    row = (
        db.query(AuditTrailEntry)
        .order_by(AuditTrailEntry.id.desc())
        .first()
    )
    return row.entry_hash if row is not None else None


def verify_chain(db: Session) -> dict:
    """Walk the entire audit trail in id order and verify the hash chain.

    Returns:
        {
            "verified": bool,
            "total_entries": int,
            "first_broken_entry_id": int | None,
            "first_broken_reason": str | None,
                # one of:
                #   "first_row_prev_hash_not_null"  — first row has a non-None prev_hash
                #   "prev_hash_mismatch"            — row.prev_hash != previous row's entry_hash
                #   "entry_hash_mismatch"           — recomputed hash != stored entry_hash
        }

    Stops at the first broken link (worst-case linear in the number of rows,
    but stops early on corruption so it doesn't walk the entire table
    unnecessarily when only the first row is tampered).
    """
    from backend.models.audit_trail import AuditTrailEntry  # noqa: PLC0415

    rows = (
        db.query(AuditTrailEntry)
        .order_by(AuditTrailEntry.id.asc())
        .all()
    )

    if not rows:
        return {
            "verified": True,
            "total_entries": 0,
            "first_broken_entry_id": None,
            "first_broken_reason": None,
        }

    prev_entry_hash: Optional[str] = None

    for i, row in enumerate(rows):
        # ── Rule 1: first row must have prev_hash = None ─────────────────────
        if i == 0 and row.prev_hash is not None:
            return {
                "verified": False,
                "total_entries": len(rows),
                "first_broken_entry_id": row.id,
                "first_broken_reason": "first_row_prev_hash_not_null",
            }

        # ── Rule 2: subsequent rows — stored prev_hash must equal the previous
        #            row's entry_hash ─────────────────────────────────────────
        if i > 0 and row.prev_hash != prev_entry_hash:
            return {
                "verified": False,
                "total_entries": len(rows),
                "first_broken_entry_id": row.id,
                "first_broken_reason": "prev_hash_mismatch",
            }

        # ── Rule 3: recompute entry_hash from stored fields and compare ───────
        expected = compute_entry_hash(
            row.prev_hash,
            row.action,
            row.actor,
            row.target_type,
            row.target_id,
            row.details_json,
            row.created_at,
        )

        if row.entry_hash != expected:
            return {
                "verified": False,
                "total_entries": len(rows),
                "first_broken_entry_id": row.id,
                "first_broken_reason": "entry_hash_mismatch",
            }

        prev_entry_hash = row.entry_hash

    return {
        "verified": True,
        "total_entries": len(rows),
        "first_broken_entry_id": None,
        "first_broken_reason": None,
    }
