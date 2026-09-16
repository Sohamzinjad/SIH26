from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.device import Finding
from backend.schemas.finding import FindingDTO, EvidenceModel

router = APIRouter(prefix="/api/findings", tags=["Findings"])

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
