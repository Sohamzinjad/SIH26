from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.device import Finding
from backend.models.audit_trail import AuditTrailEntry
from backend.schemas.finding import FindingDTO, EvidenceModel, WaiveFindingRequest

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
    return [
        FindingDTO(
            id=r.id,
            rule_id=r.rule_id,
            framework=r.framework,
            title=r.title,
            severity=r.severity,
            weight=r.weight,
            status=r.status,
            evidence=EvidenceModel(line_start=r.line_start, line_end=r.line_end, snippet=r.evidence_snippet) if r.line_start else None,
            remediation=r.remediation,
            explanation=r.explanation
        )
        for r in records
    ]
