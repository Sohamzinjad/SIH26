from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.device import Audit, Device, Finding, AttackPath
from backend.schemas.finding import FindingDTO, AttackPathDTO, EvidenceModel
from backend.correlation.remediation import compute_single_key_fix
from backend.reporting.generator import generate_html_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{audit_id}/html")
def export_audit_html_report(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    device = db.query(Device).filter(Device.id == audit.device_id).first()
    db_findings = db.query(Finding).filter(Finding.audit_id == audit.id).all()
    db_paths = db.query(AttackPath).filter(AttackPath.audit_id == audit.id).all()

    findings_dto = [
        FindingDTO(
            id=f.id,
            rule_id=f.rule_id,
            framework=f.framework,
            title=f.title,
            severity=f.severity,
            weight=f.weight,
            status=f.status,
            evidence=EvidenceModel(line_start=f.line_start, line_end=f.line_end, snippet=f.evidence_snippet) if f.line_start else None,
            remediation=f.remediation,
            explanation=f.explanation
        )
        for f in db_findings
    ]

    paths_dto = [
        AttackPathDTO(
            id=p.id,
            chain_id=p.chain_id,
            name=p.name,
            severity=p.severity,
            narrative=p.narrative,
            finding_rule_ids=p.finding_rule_ids or [],
            break_rule_id=p.break_rule_id,
            break_why=p.break_why,
            is_active=bool(p.is_active)
        )
        for p in db_paths
    ]

    single_fix = compute_single_key_fix(findings_dto, paths_dto)
    html_content = generate_html_report(audit, device, findings_dto, paths_dto, single_fix)

    return Response(content=html_content, media_type="text/html")
