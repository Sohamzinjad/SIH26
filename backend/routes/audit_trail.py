"""Tamper-evident audit trail verification endpoints (additive).

  * GET  /api/audit-trail/verify — recompute the hash chain over the ENTIRE
    audit trail in id order and report the first broken link, if any.
  * POST /api/audit-trail/demo-tamper — DEMO ONLY, disabled unless
    AUDIT_TRAIL_DEMO_ENABLED=true. Mutates the newest entry's details_json
    WITHOUT recomputing its hash, so the next verify call demonstrably
    reports a chain break (used to exercise the tamper response in a demo).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.config import settings
from backend.auth import require_api_key
from backend.models.audit_trail import AuditTrailEntry
from backend.models.audit_trail_chain import verify_chain

router = APIRouter(prefix="/api/audit-trail", tags=["Audit Trail"])


@router.get("/verify")
def verify_audit_trail(db: Session = Depends(get_db)):
    """Walk the ENTIRE audit trail in id order and report chain integrity.

    Returns {verified, total_entries, first_broken_entry_id, first_broken_reason}.
    Stops at the first mismatch."""
    return verify_chain(db)


@router.post("/demo-tamper")
def demo_tamper_audit_trail(
    db: Session = Depends(get_db),
    _auth: None = Depends(require_api_key),
):
    """DEMO-gated: tamper with the newest entry WITHOUT recomputing its hash.

    Returns 404 unless AUDIT_TRAIL_DEMO_ENABLED=true (default OFF, no attack
    surface in production)."""
    if not settings.AUDIT_TRAIL_DEMO_ENABLED:
        raise HTTPException(
            status_code=404,
            detail="AUDIT_TRAIL_DEMO_ENABLED is false; demo-tamper endpoint disabled",
        )
    row = db.query(AuditTrailEntry).order_by(AuditTrailEntry.id.desc()).first()
    if not row:
        raise HTTPException(status_code=404, detail="No audit trail entries present to tamper")
    mutated = dict(row.details_json or {})
    mutated["tampered_by_demo"] = True
    row.details_json = mutated
    db.commit()
    return {"tampered_entry_id": row.id, "details_json": row.details_json}