"""
Tamper-evident hash-chain primitives for the audit trail (additive).

This module provides the two primitives every AuditTrailEntry write site
uses to turn the persisted audit trail into a cryptographic hash chain:

  * compute_entry_hash(...)  -> SHA-256 over a *canonical* serialization of
    the entry's own fields, chained onto `prev_hash` (empty string when the
    row is the table's very first, so even a prev-less first row hashes a
    deterministic value).
  * get_latest_hash(db)      -> the entry_hash of the most recent row (by
    `id`, never by `created_at`, to avoid clock-skew reordering), or None if
    the table is empty.

CANONICALIZATION CONTRACT (byte-for-byte; the verify endpoint depends on
reproducing this EXACTLY):

  payload = {
      "action":      action,
      "actor":       actor,
      "target_type": target_type,          # JSON null if None
      "target_id":   target_id,            # JSON null if None
      "details":     details_json,         # must be already-resolved dict
  }
  canonical = json.dumps(payload, sort_keys=False, separators=(",", ":"),
                         ensure_ascii=False, default=str)
              + "\n"
              + (prev_hash if prev_hash is not None else "")

  entry_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

Fields are emitted in the FIXED order shown above (action, actor,
target_type, target_id, details) — never sorted, never reordered, because
each write site and the verifier must agree byte-for-byte and a sorted-key
dump would make that contract silently dependent on key ordering.

`details_json` MUST already be a fully-resolved in-memory dict (resolved
from the DB row's stored JSON before calling) so both the write site and
the verifier serialize the identical bytes; `default=str` is a safety net
only and should never be exercised by real findings rows.

The `created_at` is intentionally NOT part of the hash payload: it is set
by the ORM at insert time and is not attributable at the moment the caller
constructs the row, so including it would make the two sides (write-time vs
verify-time reproduction) diverge. Attribution runs on action+actor+target
+details, which ARE known at construction time.
"""

import hashlib
import json
from typing import Any, Optional

from sqlalchemy.orm import Session


def compute_entry_hash(
    prev_hash: Optional[str],
    action: str,
    actor: str,
    target_type: Optional[str],
    target_id: Optional[int],
    details_json: dict,
) -> str:
    """Return the SHA-256 hash for ONE audit-trail row given its own fields
    and the previous row's entry_hash (or None for the table's first row).

    See module docstring for the byte-for-byte canonicalization contract;
    the verifier calls this with the SAME argument order so the two sides
    are reproducible from persisted values alone.
    """
    payload = {
        "action": action,
        "actor": actor,
        "target_type": target_type,
        "target_id": target_id,
        "details": details_json,
    }
    canonical = (
        json.dumps(payload, sort_keys=False, separators=(",", ":"),
                   ensure_ascii=False, default=str)
        + "\n"
        + (prev_hash if prev_hash is not None else "")
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def get_latest_hash(db: Session) -> Optional[str]:
    """Return the entry_hash of the most recently-created audit-trail row,
    or None if the table is empty.

    Ordering is by `id` (the append-only sequence), never by `created_at`,
    so a clock-skewed created_at can never reorder the chain when a new row
    is being chained onto "the latest" existing row.
    """
    row = (
        db.query(
            type(db.query(BackendAuditTrailModelStub).model)
        )
        ...
    )
