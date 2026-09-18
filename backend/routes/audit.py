from datetime import datetime
import time
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.device import Device, Audit, Finding, AttackPath
from backend.models.mapping import AIMapping
from backend.models.audit_trail import AuditTrailEntry
from backend.schemas.api import AuditUploadResponse, AuditDetailResponse
from backend.schemas.finding import FindingDTO, AttackPathDTO, AuditSummaryDTO, EvidenceModel
from backend.parsers.vendor_detect import detect_vendor
from backend.parsers import get_parser_for_vendor
from backend.rules.engine import engine as rule_engine
from backend.correlation.attack_paths import correlate_attack_paths
from backend.correlation.remediation import compute_single_key_fix
from backend.ai.ollama_client import ollama_client
from backend.ai.fingerprint_cache import lookup_cached_mapping, build_normalized_config_from_mapping

router = APIRouter(prefix="/api/audit", tags=["Audit"])

@router.post("/upload", response_model=AuditUploadResponse)
async def upload_config_and_audit(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    filename: Optional[str] = Form("config.cfg"),
    db: Session = Depends(get_db)
):
    if file:
        content = await file.read()
        config_text = content.decode("utf-8", errors="replace")
        fname = file.filename or filename or "config.cfg"
    elif raw_text:
        config_text = raw_text
        fname = filename or "config.cfg"
    else:
        raise HTTPException(status_code=400, detail="Either config file or raw_text must be provided.")

    vendor, confidence, fingerprint = detect_vendor(config_text)

    # 1. Unknown Vendor Flow
    if vendor == "unknown":
        # Check if we already have an approved mapping for this dialect
        cached_mapping = lookup_cached_mapping(db, fingerprint)
        if cached_mapping:
            detection_method = "fingerprint_cache"
            normalized = build_normalized_config_from_mapping(cached_mapping, config_text, fname)
        else:
            # AI-assisted Proposal Path (Human-in-the-loop)
            proposed = ollama_client.propose_mapping(config_text)
            
            # Create device entry
            device = Device(
                hostname=proposed.get("hostname", "whitebox-device"),
                vendor=proposed.get("vendor_guessed", "unknown"),
            )
            db.add(device)
            db.commit()
            db.refresh(device)

            # Create pending audit
            audit = Audit(
                device_id=device.id,
                filename=fname,
                config_text=config_text,
                status="PENDING_AI_MAPPING"
            )
            db.add(audit)
            db.commit()
            db.refresh(audit)

            # Store AI mapping for human approval
            ai_map = AIMapping(
                audit_id=audit.id,
                fingerprint_hash=fingerprint,
                vendor_guessed=proposed.get("vendor_guessed", "WhiteBox-OpenNOS"),
                confidence=proposed.get("confidence", 0.75),
                proposed_schema=proposed,
                status="PENDING",
                config_sample=config_text[:500]
            )
            db.add(ai_map)

            # Audit Trail
            trail = AuditTrailEntry(
                action="MAPPING_PROPOSED",
                actor="ollama_ai_agent",
                target_type="ai_mapping",
                target_id=ai_map.id,
                details_json={"fingerprint": fingerprint, "vendor": ai_map.vendor_guessed}
            )
            db.add(trail)
            db.commit()
            db.refresh(ai_map)

            return AuditUploadResponse(
                audit_id=audit.id,
                device_id=device.id,
                hostname=device.hostname,
                vendor_detected="unknown",
                detection_method="ai_mapping",
                status="PENDING_AI_MAPPING",
                compliance_score=0.0,
                total_findings=0,
                failed_findings=0,
                attack_paths_count=0,
                ai_mapping_pending=True,
                ai_mapping_id=ai_map.id
            )

    # 2. Known Vendor or Cached Mapping Flow
    else:
        detection_method = "heuristic"
        parser = get_parser_for_vendor(vendor)
        if not parser:
            raise HTTPException(status_code=500, detail=f"No parser available for detected vendor {vendor}")
        normalized = parser.parse(config_text, fname)

    # Deterministic Compliance Audit
    score, findings, pass_cnt, fail_cnt, total_cnt = rule_engine.audit(normalized)
    attack_paths = correlate_attack_paths(findings)

    # Save Device
    device = db.query(Device).filter(Device.hostname == normalized.hostname).first()
    if not device:
        device = Device(
            hostname=normalized.hostname,
            vendor=normalized.vendor,
            os_version=normalized.os_version
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    else:
        device.vendor = normalized.vendor
        device.os_version = normalized.os_version
        db.commit()

    # Save Audit Record
    audit = Audit(
        device_id=device.id,
        filename=fname,
        config_text=config_text,
        score=score,
        pass_count=pass_cnt,
        fail_count=fail_cnt,
        total_count=total_cnt,
        status="COMPLETED",
        completed_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)

    # Save Findings
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

    # Save Attack Paths
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

    # Save Audit Trail
    trail = AuditTrailEntry(
        action="AUDIT_RUN",
        actor="system",
        target_type="audit",
        target_id=audit.id,
        details_json={"hostname": device.hostname, "score": score, "findings": total_cnt}
    )
    db.add(trail)
    db.commit()

    return AuditUploadResponse(
        audit_id=audit.id,
        device_id=device.id,
        hostname=device.hostname,
        vendor_detected=vendor,
        detection_method=detection_method,
        status="COMPLETED",
        compliance_score=score,
        total_findings=total_cnt,
        failed_findings=fail_cnt,
        attack_paths_count=len(attack_paths),
        ai_mapping_pending=False
    )

@router.get("/{audit_id}", response_model=AuditDetailResponse)
def get_audit_detail(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit record not found")

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

    summary_dto = AuditSummaryDTO(
        id=audit.id,
        device_id=audit.device_id,
        hostname=device.hostname if device else "unknown",
        vendor=device.vendor if device else "unknown",
        score=audit.score,
        pass_count=audit.pass_count,
        fail_count=audit.fail_count,
        total_count=audit.total_count,
        status=audit.status,
        started_at=audit.started_at,
        completed_at=audit.completed_at,
        attack_paths_count=len(paths_dto)
    )

    return AuditDetailResponse(
        audit=summary_dto,
        findings=findings_dto,
        attack_paths=paths_dto,
        single_fix_recommendation=single_fix
    )
