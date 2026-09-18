"""Fleet / batch auditing.

Additive-only addition to the repo's single-file audit capability. The
single-file pipeline (``backend/routes/audit.py``) is NOT touched or
duplicated here: this module REUSES the exact same shared pipeline objects
that the single-file endpoint uses --

  * ``detect_vendor`` for vendor detection,
  * ``get_parser_for_vendor(...).parse`` for config normalization (known
    vendor -> deterministic parser; the SAME parser the single path calls),
  * ``rule_engine.audit`` for deterministic rule evaluation,
  * ``correlate_attack_paths`` for attack-path correlation,
  * the same ``Device`` / ``Audit`` / ``Finding`` / ``AttackPath`` /
    ``AuditTrailEntry`` persistence the single path performs.

by looping the single-file *pipeline* over many uploaded files in ONE
request. A fleet audit run is constructed from real per-file results, never
from hardcoded numbers.

Regressions are guarded by the repo's preregistration discipline:
  * single-file audit endpoint remains byte-identical (see
    backend/tests/test_fleet_validation.py);
  * a file whose vendor can't be detected structurally lands exactly where
    it does today: PENDING, never silently forced into a guess.
"""

import time
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.device import Device, Audit, Finding, AttackPath
from backend.models.audit_trail import AuditTrailEntry
from backend.parsers.vendor_detect import detect_vendor
from backend.parsers import get_parser_for_vendor
from backend.rules.engine import engine as rule_engine
from backend.correlation.attack_paths import correlate_attack_paths
from backend.schemas.finding import (
    FindingDTO, AttackPathDTO, EvidenceModel
)

router = APIRouter(prefix="/api/fleet", tags=["Fleet"])


def _single_file_pipeline(
    db: Session,
    config_text: str,
    fname: str,
) -> "FleetAuditResult":
    """Run the exact single-file pipeline for one config.

    Mirrors backend/routes/audit.py: detect vendor -> (known: deterministic
    parser; unknown:  PENDING_AI_MAPPING like today) -> rule audit ->
    attack paths -> persist Device/Audit/Finding/AttackPath + audit trail.
    Returns the per-file row for the fleet summary.
    """
    vendor, confidence, fingerprint = detect_vendor(config_text)
    detection_method = (
        "heuristic" if vendor in ("cisco_ios", "cisco_ios", "fortios", "fortinet", "junos")
        else "structural_fallback"
    )

    # Unknown vendor: stay PENDING exactly like the single-file endpoint does.
    if vendor == "unknown":
        parser = None
        normalized = None
    else:
        parser = get_parser_for_vendor(vendor)
        if not parser:
            raise HTTPException(
                status_code=500,
                detail=f"No parser available for detected vendor {vendor}"
            )
        normalized = parser.parse(config_text, fname)

    # Deterministic audit against the normalized config.
    if normalized is not None:
        score, findings, pass_cnt, fail_cnt, total_cnt = rule_engine.audit(normalized)
        attack_paths = correlate_attack_paths(findings)
    else:
        score, findings, pass_cnt, fail_cnt, total_cnt = 0.0, [], 0, 0, 0
        attack_paths = []

    # Device (hostname-or-filename fallback).
    hostname = None
    if normalized is not None:
        hostname = getattr(normalized, "hostname", None) or None
    device = db.query(Device).filter(
        Device.hostname == (hostname or fname)
    ).first()
    if not device:
        device = Device(
            hostname=hostname or fname,
            vendor=vendor,
            os_version=getattr(normalized, "os_version", None) if normalized else None,
        )
        db.add(device)

    audit = Audit(
        device_id=None,  # resolved below once device is flushed
        filename=fname,
        config_text=config_text,
        status="PENDING_AI_MAPPING" if vendor == "unknown" else "COMPLETED",
        score=score,
        pass_count=pass_cnt,
        fail_count=fail_cnt,
        total_count=total_cnt,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    db.refresh(device)

    audit.device_id = device.id
    db.commit()
    db.refresh(audit)

    for f in findings:
        db.add(Finding(
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
            explanation=f.explanation,
        ))

    for p in attack_paths:
        db.add(AttackPath(
            audit_id=audit.id,
            chain_id=p.chain_id,
            name=p.name,
            severity=p.severity,
            narrative=p.narrative,
            finding_rule_ids=p.finding_rule_ids,
            is_active=1,
        ))

    trail = AuditTrailEntry(
        action="FLEET_AUDIT_RUN",
        actor="system",
        target_type="audit",
        target_id=audit.id,
        details_json={
            "hostname": device.hostname,
            "vendor": vendor,
            "score": score,
            "findings": total_cnt,
        },
    )
    db.add(trail)
    db.commit()
    db.refresh(audit)

    return FleetAuditResult(
        audit_id=audit.id,
        device_id=device.id,
        hostname=device.hostname,
        vendor=vendor,
        vendor_detected=detection_method,
        status="PENDING" if vendor == "unknown" else "COMPLETED",
        compliance_score=score,
        total_findings=total_cnt,
        failed_findings=fail_cnt,
        attack_paths_count=len(attack_paths),
    )
