from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.device import Finding
from backend.models.audit_trail import AuditTrailEntry
from backend.models.audit_trail_chain import get_latest_hash, compute_entry_hash
from backend.schemas.finding import FindingDTO, EvidenceModel, WaiveFindingRequest
from backend.enrichment.cve import enrich_findings
from backend.auth import require_api_key

router = APIRouter(prefix="/api/findings", tags=["Findings"])

def _finding_to_dto(f: Finding) -> FindingDTO:
    return FindingDTO(
        id=f.id,
        rule_id=f.rule_id,
        framework=f.framework,
        title=f.title,
        severity=f.severity,
        weight=f.weight,
        status=f.status,
        evidence=EvidenceModel(line_start=f.line_start, line_end=f.line_end, snippet=f.evidence_snippet) if f.line_start else None,
        remediation=f.remediation,
        explanation=f.explanation,
        waived=f.waived_at is not None,
        waived_at=f.waived_at,
        waived_by=f.waived_by,
        waiver_justification=f.waiver_justification,
    )

@router.get("/{audit_id}", response_model=List[FindingDTO])
def list_findings_for_audit(
    audit_id: int,
    framework: Optional[str] = Query(None, description="Filter by framework (CIS, NIST-800-53, DISA-STIG)"),
    severity: Optional[str] = Query(None, description="Filter by severity (critical, high, medium, low)"),
    status: Optional[str] = Query(None, description="Filter by status (pass, fail)"),
    db: Session = Depends(get_db)
):
    query = db.query(Finding).filter(Finding.audit_id == audit_id)
    if framework:
        query = query.filter(Finding.framework == framework)
    if severity:
        query = query.filter(Finding.severity == severity.lower())
    if status:
        query = query.filter(Finding.status == status.lower())

    records = query.all()
    dtos = [_finding_to_dto(r) for r in records]
    return enrich_findings(dtos)


@router.post("/{finding_id}/waive", response_model=FindingDTO)
def waive_finding(
    finding_id: int,
    request: WaiveFindingRequest,
    db: Session = Depends(get_db),
    _auth: None = Depends(require_api_key),
):
    """Mark a finding as waived with justification, reviewer, and timestamp.

    The waiver is REAL persisted state (waived_at / waived_by /
    waiver_justification on the Finding row) — a finding only counts as
    waived when genuinely waived through this endpoint, never by default.

    identity: requires API key (401 if disabled-key mismatch)"""
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail=f"Finding {finding_id} not found")

    now = datetime.utcnow()
    f.waived_at = now
    f.waived_by = request.waived_by
    f.waiver_justification = request.justification
    prev_hash = get_latest_hash(db)
    db.add(AuditTrailEntry(
        action="FINDING_WAIVED",
        actor=request.waived_by,
        target_type="finding",
        target_id=f.id,
        details_json={
            "rule_id": f.rule_id,
            "posed_at": now.isoformat(),
            "justification": request.justification,
        },
        created_at=now,
        entry_hash=compute_entry_hash(
            prev_hash,
            "FINDING_WAIVED",
            request.waived_by,
            "finding",
            f.id,
            {"rule_id": f.rule_id, "posed_at": now.isoformat(), "justification": request.justification},
            now,
        ),
        prev_hash=prev_hash,
    ))
    db.commit()
    db.refresh(f)
    return _finding_to_dto(f)


@router.post("/{finding_id}/unwaive", response_model=FindingDTO)
def unwaive_finding(
    finding_id: int,
    db: Session = Depends(get_db),
    _auth: None = Depends(require_api_key),
):
    """Revoke a previous waiver by clearing the real waiver columns.

    identity: requires API key (401 if disabled-key mismatch)"""
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail=f"Finding {finding_id} not found")

    now = datetime.utcnow()
    prev_hash = get_latest_hash(db)
    db.add(AuditTrailEntry(
        action="FINDING_UNWAIVED",
        actor="analyst",
        target_type="finding",
        target_id=f.id,
        details_json={
            "rule_id": f.rule_id,
            "revoked_at": datetime.utcnow().isoformat(),
            "previously_waived_by": f.waived_by,
        },
        created_at=now,
        entry_hash=compute_entry_hash(
            prev_hash,
            "FINDING_UNWAIVED",
            "analyst",
            "finding",
            f.id,
            {"rule_id": f.rule_id, "revoked_at": datetime.utcnow().isoformat(), "previously_waived_by": f.waived_by},
            now,
        ),
        prev_hash=prev_hash,
    ))
    f.waived_at = None
    f.waived_by = None
    f.waiver_justification = None
    db.commit()
    db.refresh(f)
    return _finding_to_dto(f)
