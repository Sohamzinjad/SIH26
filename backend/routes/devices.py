"""Per-device audit history + drift endpoints (additive-only).

Exposes REAL persisted Audit/Finding rows for a single Device:

  * GET /api/devices/{device_id}/history — every COMPLETED audit for the
    device, newest first, with per-rule pass/fail read from the persisted
    Finding rows of each audit.
  * GET /api/devices/{device_id}/drift — compares the two most recent
    COMPLETED audits of the device and classifies every rule_id present in
    either audit as same / improved / worsened / new / disappeared, plus an
    overall drift score. Devices with fewer than two audits report
    comparable=false with an empty rules list (graceful placeholder) — never
    a fabricated value.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.device import Device, Audit, Finding
from backend.schemas.device import (
    DeviceAuditRecord,
    DeviceDriftRule,
    DeviceDriftResponse,
    DeviceHistoryResponse,
    DeviceRuleRun,
)

router = APIRouter(prefix="/api/devices", tags=["Devices"])

_TRANSITION_NAMES = ("same", "improved", "worsened", "new", "disappeared")


def _get_device(db: Session, device_id: int) -> Device:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return device


def _completed_audits(db: Session, device_id: int):
    return (
        db.query(Audit)
        .filter(Audit.device_id == device_id, Audit.status == "COMPLETED")
        .order_by(Audit.started_at.desc())
        .all()
    )


def _findings(db: Session, audit_id: int):
    return db.query(Finding).filter(Finding.audit_id == audit_id).all()


def _status_map(db: Session, audit_id: int) -> dict:
    return {f.rule_id: f.status for f in _findings(db, audit_id)}


@router.get("/{device_id}/history", response_model=DeviceHistoryResponse)
def device_history(device_id: int, db: Session = Depends(get_db)):
    """Every COMPLETED audit for the device, newest first (real persisted rows)."""
    device = _get_device(db, device_id)

    records = []
    for audit in _completed_audits(db, device_id):
        per_rule = [
            DeviceRuleRun(rule_id=f.rule_id, status=f.status, severity=f.severity)
            for f in _findings(db, audit.id)
        ]
        records.append(
            DeviceAuditRecord(
                audit_id=audit.id,
                started_at=audit.started_at,
                completed_at=audit.completed_at,
                vendor=device.vendor,
                compliance_score=audit.score,
                status=audit.status,
                fail_count=audit.fail_count,
                total_count=audit.total_count,
                per_rule=per_rule,
            )
        )

    return DeviceHistoryResponse(
        device_id=device.id,
        hostname=device.hostname,
        audits=records,
    )


@router.get("/{device_id}/drift", response_model=DeviceDriftResponse)
def device_drift(device_id: int, db: Session = Depends(get_db)):
    """Per-rule drift between the device's two most recent audits (real rows)."""
    device = _get_device(db, device_id)
    audits = _completed_audits(db, device_id)

    if len(audits) < 2:
        return DeviceDriftResponse(
            device_id=device.id,
            hostname=device.hostname,
            comparable=False,
            detail="Only one audit recorded for this device — no drift comparison available yet.",
            drift_score=0.0,
            same_count=0,
            improved_count=0,
            worsened_count=0,
            new_count=0,
            disappeared_count=0,
            rules=[],
        )

    # audits are ordered newest-first, so [0] is the latest audit and [1] is
    # the previous one (the two most recent real audits of this device).
    earlier, latest = audits[1], audits[0]
    prev_map = _status_map(db, earlier.id)
    curr_map = _status_map(db, latest.id)
    latest_findings = {f.rule_id: f for f in _findings(db, latest.id)}

    rules = []
    for rule_id in sorted(set(prev_map) | set(curr_map)):
        previous_status = prev_map.get(rule_id)
        current_status = curr_map.get(rule_id)

        if previous_status is not None and current_status is not None:
            if previous_status == current_status:
                transition = "same"
            elif previous_status == "fail" and current_status == "pass":
                transition = "improved"
            elif previous_status == "pass" and current_status == "fail":
                transition = "worsened"
            else:
                transition = "same"
        elif current_status is not None:
            transition = "new"
        else:
            transition = "disappeared"

        finding = latest_findings.get(rule_id)
        rules.append(
            DeviceDriftRule(
                rule_id=rule_id,
                title=finding.title if finding else None,
                framework=finding.framework if finding else None,
                previous_status=previous_status,
                current_status=current_status,
                transition=transition,
            )
        )

    counts = {name: 0 for name in _TRANSITION_NAMES}
    for r in rules:
        counts[r.transition] += 1

    drift_score = 0.0
    if rules:
        drift_score = round(
            100.0 * (counts["improved"] - counts["worsened"]) / len(rules), 1
        )

    return DeviceDriftResponse(
        device_id=device.id,
        hostname=device.hostname,
        comparable=True,
        detail=f"Comparing audit {earlier.id} (earlier) with audit {latest.id} (latest).",
        previous_audit_id=earlier.id,
        current_audit_id=latest.id,
        drift_score=drift_score,
        same_count=counts["same"],
        improved_count=counts["improved"],
        worsened_count=counts["worsened"],
        new_count=counts["new"],
        disappeared_count=counts["disappeared"],
        rules=rules,
    )