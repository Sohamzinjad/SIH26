from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models.device import Device, Audit, Finding, AttackPath
from backend.models.mapping import AIMapping

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    audits = db.query(Audit).order_by(Audit.started_at.desc()).limit(15).all()

    total_devices = len(devices)
    total_audits = db.query(Audit).count()

    completed_audits = db.query(Audit).filter(Audit.status == "COMPLETED").all()
    avg_score = 0.0
    if completed_audits:
        avg_score = round(sum(a.score for a in completed_audits) / len(completed_audits), 1)

    critical_count = db.query(Finding).filter(Finding.severity == "critical", Finding.status == "fail").count()
    high_count = db.query(Finding).filter(Finding.severity == "high", Finding.status == "fail").count()
    active_chains_count = db.query(AttackPath).filter(AttackPath.is_active == 1).count()
    pending_ai_proposals = db.query(AIMapping).filter(AIMapping.status == "PENDING").count()

    # Build device summary list
    device_items = []
    for d in devices:
        latest_audit = db.query(Audit).filter(Audit.device_id == d.id).order_by(Audit.started_at.desc()).first()
        device_items.append({
            "id": d.id,
            "hostname": d.hostname,
            "vendor": d.vendor,
            "latest_audit_id": latest_audit.id if latest_audit else None,
            "score": latest_audit.score if latest_audit else None,
            "status": latest_audit.status if latest_audit else "UNAUDITED",
            "last_audited": latest_audit.started_at if latest_audit else None,
        })

    recent_audits_list = [
        {
            "id": a.id,
            "hostname": a.device.hostname if a.device else "Unknown",
            "vendor": a.device.vendor if a.device else "Unknown",
            "score": a.score,
            "fail_count": a.fail_count,
            "status": a.status,
            "started_at": a.started_at
        }
        for a in audits
    ]

    return {
        "total_devices": total_devices,
        "total_audits": total_audits,
        "average_score": avg_score,
        "critical_failures": critical_count,
        "high_failures": high_count,
        "active_attack_chains": active_chains_count,
        "pending_ai_proposals": pending_ai_proposals,
        "devices": device_items,
        "recent_audits": recent_audits_list
    }
