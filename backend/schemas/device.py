"""Per-device history / drift response models (additive-only).

All fields are derived from REAL persisted Audit/Finding rows — the backend
routes never invent a value and never default a governance number here.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DeviceRuleRun(BaseModel):
    """Single rule's verdict inside one audit (persisted Finding row)."""
    rule_id: str
    status: str          # pass | fail
    severity: str        # critical | high | medium | low


class DeviceAuditRecord(BaseModel):
    """One persisted audit execution for a device, newest-first."""
    audit_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    vendor: str
    compliance_score: float
    status: str
    fail_count: int
    total_count: int
    per_rule: List[DeviceRuleRun] = []


class DeviceHistoryResponse(BaseModel):
    """Full per-device audit history (real Audit rows)."""
    device_id: int
    hostname: str
    audits: List[DeviceAuditRecord] = []


class DeviceDriftRule(BaseModel):
    """Per-rule transition between the two most recent audits of a device.

    transition is one of: same | improved | worsened | new | disappeared.
    """
    rule_id: str
    title: Optional[str] = None
    framework: Optional[str] = None
    previous_status: Optional[str] = None
    current_status: Optional[str] = None
    transition: str


class DeviceDriftResponse(BaseModel):
    """Drift comparison between the two most recent audits of a device.

    computed strictly from the persisted Finding rows of those two real
    Audit records. Devices with fewer than two audits return comparable=False
    and empty rules — a graceful empty placeholder, never fabricated data.
    """
    device_id: int
    hostname: str
    comparable: bool
    detail: str
    previous_audit_id: Optional[int] = None
    current_audit_id: Optional[int] = None
    drift_score: float
    same_count: int
    improved_count: int
    worsened_count: int
    new_count: int
    disappeared_count: int
    rules: List[DeviceDriftRule] = []