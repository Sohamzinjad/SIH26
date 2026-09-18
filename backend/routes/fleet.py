"""Fleet / batch auditing — additive-only, byte-deterministic.

Additive-only contract (mirrors the repo's single-file audit discipline):
  * The single-file endpoint (backend/routes/audit.py) is NOT touched.
  * This module REUSES the exact same shared pipeline objects the single-file
    endpoint calls (detect_vendor, get_parser_for_vendor(...).parse,
    rule_engine.audit, correlate_attack_paths, compute_single_key_fix), so
    every file in a batch runs the byte-identical pipeline as a single upload.
    No parsing logic is duplicated here — only the loop that fans work out.
  * PENDING stays PENDING: a file whose vendor is unresolved is persisted
    EXACTLY like today (device created w/ hostname-or-filename fallback,
    audit status PENDING, FINDINGS not written, wait for AI mapping).
  * Score/verdicts/counts always come from rule_engine.audit — never computed
    in this module, never mutated, never hardcoded.
  * The fleet summary computes REAL cross-device aggregates from persisted
    rows ("N of M devices have X failing"), grouped by rule_id and by
    attack-path chain_id. It is data-driven, never a flat list of results.
"""

import time
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.device import Device, Audit, Finding, AttackPath
from backend.models.audit_trail import AuditTrailEntry as DeterministicAuditTrailEntry
from backend.parsers.vendor_detect import detect_vendor
from backend.parsers import get_parser_for_vendor
from backend.rules.engine import engine as rule_engine
from backend.correlation.attack_paths import correlate_attack_paths
from backend.correlation.remediation import compute_single_key_fix

router = APIRouter(prefix="/api/audit", tags=["Audit"])

from pydantic import BaseModel
from typing import List, Optional


class PerFileResultDTO(BaseModel):
    fname: str
    hostname: str
    vendor_detected: str
    detection_method: str
    status: str
    compliance_score: float
    total_findings: int
    failed_findings: int
    audit_id: int
    device_id: int
    error: Optional[str] = None


class FleetBatchResponseDTO(BaseModel):
    batch_id: str
    total_files: int
    completed_count: int
    pending_count: int
    failed_count: int
    results: List[PerFileResultDTO]


class FleetRuleAggregateDTO(BaseModel):
    rule_id: str
    title: str
    severity: str
    devices_present: int
    devices_failing: int


class FleetChainAggregateDTO(BaseModel):
    chain_id: str
    name: str
    severity: str
    devices_present: int
    devices_firing: int


class FleetSummaryDTO(BaseModel):
    total_devices: int
    by_rule: List[FleetRuleAggregateDTO]
    by_chain: List[FleetChainAggregateDTO]
