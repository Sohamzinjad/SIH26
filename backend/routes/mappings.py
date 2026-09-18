from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.mapping import AIMapping
from backend.models.device import Audit, Device, Finding, AttackPath
from backend.models.audit_trail import AuditTrailEntry
from backend.models.audit_trail_chain import get_latest_hash, compute_entry_hash
from backend.schemas.api import AIMappingResponse, AIMappingApprovalRequest, AuditUploadResponse
from backend.ai.fingerprint_cache import save_approved_mapping, build_normalized_config_from_mapping
from backend.rules.engine import engine as rule_engine
from backend.correlation.attack_paths import correlate_attack_paths
from backend.auth import require_api_key

router = APIRouter(prefix="/api/mappings", tags=["AI Mappings"])

@router.get("/pending", response_model=List[AIMappingResponse])
def get_pending_mappings(db: Session = Depends(get_db)):
    mappings = db.query(AIMapping).filter(AIMapping.status == "PENDING").all()
    return [
        AIMappingResponse(
            id=m.id,
            audit_id=m.audit_id,
            fingerprint_hash=m.fingerprint_hash,
            vendor_guessed=m.vendor_guessed,
            confidence=m.confidence,
            status=m.status,
            proposed_schema=m.proposed_schema or {},
            config_sample=m.config_sample
        )
        for m in mappings
    ]

@router.post("/{mapping_id}/approve")
def approve_mapping(
    mapping_id: int,
    req: AIMappingApprovalRequest,
    db: Session = Depends(get_db),
    _auth: None = Depends(require_api_key),
):
    """Approve an AI mapping proposal and deterministically re-audit.

    identity: requires API key (401 if disabled-key mismatch)"""
    ai_map = db.query(AIMapping).filter(AIMapping.id == mapping_id).first()
    if not ai_map:
        raise HTTPException(status_code=404, detail="Mapping proposal not found")

    final_schema = req.edited_schema or ai_map.proposed_schema
    vendor_name = req.vendor_name or ai_map.vendor_guessed

    # Update mapping record
    ai_map.status = "APPROVED"
    ai_map.approved_by = req.approved_by
    ai_map.approved_at = datetime.utcnow()
    ai_map.proposed_schema = final_schema

    # Save to persistent dialect cache
    save_approved_mapping(
        db=db,
        fingerprint_hash=ai_map.fingerprint_hash,
        vendor_name=vendor_name,
        mapping_data=final_schema,
        approved_by=req.approved_by
    )

    # Now evaluate the pending audit deterministically!
    if ai_map.audit_id:
        audit = db.query(Audit).filter(Audit.id == ai_map.audit_id).first()
        if audit:
            normalized = build_normalized_config_from_mapping(
                final_schema,
                audit.config_text,
                audit.filename
            )
            score, findings, pass_cnt, fail_cnt, total_cnt = rule_engine.audit(normalized)
            attack_paths = correlate_attack_paths(findings)

            audit.score = score
            audit.pass_count = pass_cnt
            audit.fail_count = fail_cnt
            audit.total_count = total_cnt
            audit.status = "COMPLETED"
            audit.completed_at = datetime.utcnow()

            # Save findings
            for f in findings:
                db_finding = Finding(
                    audit_id=audit.id,
                    rule_id=f.rule_id,
                    framework=f.framework,
                    title=f.title,
                    severity=f.severity,
                    weight=f.weight,
                    status=f.status,
                    evidence_snippet=f.evidence.snippet if f.evidence else None,
                    line_start=f.evidence.line_start if f.evidence else None,
                    line_end=f.evidence.line_end if f.evidence else None,
                    remediation=f.remediation,
                    explanation=f.explanation
                )
                db.add(db_finding)

            # Save attack paths
            for p in attack_paths:
                db_path = AttackPath(
                    audit_id=audit.id,
                    chain_id=p.chain_id,
                    name=p.name,
                    severity=p.severity,
                    narrative=p.narrative,
                    finding_rule_ids=p.finding_rule_ids,
                    break_rule_id=p.break_rule_id,
                    break_why=p.break_why,
                    is_active=1
                )
                db.add(db_path)

            db.commit()

            return {
                "message": "Mapping approved and audit completed successfully",
                "audit_id": audit.id,
                "score": score,
                "status": "COMPLETED",
                "vendor": vendor_name
            }

    db.commit()
    return {"message": "Mapping approved successfully", "mapping_id": ai_map.id}

@router.post("/{mapping_id}/reject")
def reject_mapping(
    mapping_id: int,
    rejected_by: str = "analyst",
    db: Session = Depends(get_db),
    _auth: None = Depends(require_api_key),
):
    """Reject an AI mapping proposal, recording an attributable audit trail.

    identity: requires API key (401 if disabled-key mismatch)"""
    ai_map = db.query(AIMapping).filter(AIMapping.id == mapping_id).first()
    if not ai_map:
        raise HTTPException(status_code=404, detail="Mapping proposal not found")

    ai_map.status = "REJECTED"
    if ai_map.audit_id:
        audit = db.query(Audit).filter(Audit.id == ai_map.audit_id).first()
        if audit:
            audit.status = "REJECTED_MAPPING"

    prev_hash = get_latest_hash(db)
    now = datetime.utcnow()
    trail = AuditTrailEntry(
        action="MAPPING_REJECTED",
        actor=rejected_by,
        target_type="ai_mapping",
        target_id=ai_map.id
    )
    trail.created_at = now
    trail.entry_hash = compute_entry_hash(
        prev_hash,
        trail.action,
        trail.actor,
        trail.target_type,
        trail.target_id,
        trail.details_json,
        trail.created_at,
    )
    trail.prev_hash = prev_hash
    db.add(trail)
    db.commit()

    return {"message": "Mapping proposal rejected", "mapping_id": mapping_id}
