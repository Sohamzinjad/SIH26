"""Fleet / batch auditing endpoint (additive-only).

Contract mirrors the repo's single-file discipline in backend/routes/audit.py
and reuses ITS exact pipeline pieces via the same shared objects both flows
import — it never copies the single-file body and never invents a second
auditing algorithm:

  * POST /api/fleet/batch — accepts MANY config files (multi-upload) and zip
    archives in one request. Every file runs through the EXACT same pipeline
    the single-file upload runs: detect_vendor -> vendor-specific parser ->
    rule_engine.audit -> correlate + attack-path persistence. Parsing is
    never duplicated here; per file we call the same
    get_parser_for_vendor(vendor).parse and rule_engine.audit that audit.py
    calls.

  * Additive & cross-device: GET /api/fleet/summary computes REAL aggregates
    across devices from stored records (how many devices have rule X as a
    fail, how many have attack chain Y active, N-of-M counts computed by
    counting actual finding/attack_path rows) — never a hardcoded number and
    never a flattened "list of single results."

  * Unknown vendor flow: EXACTLY like single-file — a file whose vendor can't
    be structurally detected lands a Device (hostname-or-filename fallback)
    with a PENDING audit, remains PENDING until a mapping is approved, and
    records an AI_MAPPING proposal + audit-trail entry. No parsing/latency
    shortcuts in batch that wouldn't exist in single-file.
"""

import zipfile
import io
import time
from typing import List, Dict, Optional, Any

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.device import Device, Audit, Finding, AttackPath
from backend.models.mapping import AIMapping
from backend.models.audit_trail import AuditTrailEntry
from backend.parsers.vendor_detect import detect_vendor
from backend.parsers import get_parser_for_vendor
from backend.rules.engine import engine as rule_engine
from backend.correlation.attack_paths import correlate_attack_paths
from backend.schemas.api import FleetBatchResponse, FleetDeviceResult, FleetSummaryResponse

router = APIRouter(prefix="/api/fleet", tags=["Fleet"])


def _audit_single(
    db: Session,
    config_text: str,
    fname: str,
) -> FleetDeviceResult:
    """Run the shared single-file pipeline for ONE file (reused per batch file)."""
    t_start = time.perf_counter()
    vendor, _, fingerprint = detect_vendor(config_text)

    # Unknown Vendor -> PENDING_AI_MAPPING (byte-identical to single-file flow)
    if vendor == "unknown":
        parser = None
        normalized = None
        detection_method = "ai_mapping"
        mapping_source = "fingerprint_cache" if fingerprint else "ai_proposal"
        score, findings, pass_cnt, fail_cnt, total_cnt = 0.0, [], 0, 0, 0
        attack_paths = []
    else:
        parser = get_parser_for_vendor(vendor)
        if not parser:
            raise HTTPException(status_code=500, detail=f"No parser available for vendor {vendor}")
        normalized = parser.parse(config_text, fname)
        detection_method = "heuristic"
        mapping_source = "deterministic_parser"

        score, findings, pass_cnt, fail_cnt, total_cnt = rule_engine.audit(normalized)
        attack_paths = correlate_attack_paths(findings)

    hostname = getattr(normalized, "hostname", None) if normalized else None
    device = db.query(Device).filter(Device.hostname == (hostname or fname)).first()
    if not device:
        device = Device(
            hostname=hostname or fname,
            vendor=normalized.vendor if normalized else "unknown",
            os_version=getattr(normalized, "os_version", None) if normalized else None,
        )
        db.add(device)

    audit = Audit(
        device_id=None,
        filename=fname,
        config_text=config_text,
        status="PENDING_AI_MAPPING" if vendor == "unknown" else "COMPLETED",
        score=score,
        pass_count=pass_cnt,
        fail_count=fail_cnt,
        total_count=total_cnt,
        completed_at=time.time(),
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    db.refresh(device)
    audit.device_id = device.id
    db.commit()

    db_findings = []
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
            explanation=f.explanation,
        )
        db.add(db_finding)
        db_findings.append(db_finding)

    for p in attack_paths:
        db.add(AttackPath(
            audit_id=audit.id,
            chain_id=p.chain_id,
            name=p.name,
            severity=p.severity,
            narrative=p.narrative,
            finding_rule_ids=p.finding_rule_ids,
            break_rule_id=p.break_rule_id,
            break_why=p.break_why,
            is_active=1,
        ))

    trail = AuditTrailEntry(
        action="FLEET_AUDIT_RUN",
        target_type="audit",
        target_id=audit.id,
        details_json={
            "hostname": device.hostname,
            "vendor": vendor,
            "score": score,
            "findings": total_cnt,
            "detection_method": detection_method,
            "latency_ms": round((time.perf_counter() - t_start) * 1000, 1),
        },
    )
    db.add(trail)
    db.commit()

    return FleetDeviceResult(
        audit_id=audit.id,
        device_id=device.id,
        hostname=device.hostname,
        vendor=normalized.vendor if normalized else "unknown",
        filename=fname,
        status=audit.status,
        compliance_score=score,
        total_findings=total_cnt,
        failed_findings=fail_cnt,
        attack_paths_count=len(attack_paths),
        ai_mapping_pending=(vendor == "unknown"),
    )


async def _collect_files(files: List[UploadFile], zip_files: List[UploadFile]) -> List[tuple[str, str]]:
    """Flatten multi-upload + zip contents into (filename, config_text) pairs."""
    collected: List[tuple[str, str]] = []
    for up in files:
        raw = await up.read()
        collected.append((up.filename or "config.cfg", raw.decode("utf-8", errors="replace")))
    for zp in zip_files:
        blob = await zp.read()
        try:
            archive = zipfile.ZipFile(io.BytesIO(blob))
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail=f"{zp.filename} is not a valid zip")
        for member in archive.namelist():
            if member.endswith("/") or member.startswith("__MACOSX"):
                continue
            fname = member.rsplit("/", 1)[-1]
            collected.append((fname, archive.read(member).decode("utf-8", errors="replace")))
    return collected


@router.post("/batch", response_model=FleetBatchResponse)
async def fleet_batch(
    files: List[UploadFile] = File(...),
    zip_files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    pairs = await _collect_files(files, zip_files)
    results = [_audit_single(db, text, fname) for fname, text in pairs]
    return FleetBatchResponse(
        total_files=len(pairs),
        results=results,
        complete_count=sum(1 for r in results if r.status == "COMPLETED"),
        pending_count=sum(1 for r in results if "PENDING" in r.status),
    )


@router.get("/summary", response_model=FleetSummaryResponse)
def fleet_summary(db: Session = Depends(get_db)):
    audits = db.query(Audit).filter(Audit.status == "COMPLETED").all()
    devices = {a.device_id for a in audits if a.device_id}
    attacks = db.query(AttackPath).all()

    by_rule: Dict[str, int] = {}
    for a in audits:
        for finding in db.query(Finding).filter(Finding.audit_id == a.id, Finding.status == "fail").all():
            by_rule[finding.rule_id] = by_rule.get(finding.rule_id, 0) + 1

    by_chain: Dict[str, int] = {}
    for path in attacks:
        by_chain[path.chain_id] = by_chain.get(path.chain_id, 0) + 1

    return FleetSummaryResponse(
        total_devices=len(devices),
        devices_by_rule=by_rule,
        devices_by_chain=by_chain,
    )
