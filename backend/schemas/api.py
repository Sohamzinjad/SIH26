from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from backend.schemas.finding import FindingDTO, AttackPathDTO, SingleFixRecommendation, AuditSummaryDTO
from backend.schemas.neutral_config import NormalizedConfig

class AuditUploadResponse(BaseModel):
    audit_id: int
    device_id: int
    hostname: str
    vendor_detected: str
    detection_method: str  # "heuristic", "ai_mapping", "fingerprint_cache"
    status: str
    compliance_score: float
    total_findings: int
    failed_findings: int
    attack_paths_count: int
    ai_mapping_pending: bool = False
    ai_mapping_id: Optional[int] = None
    mapping_latency_ms: Optional[float] = None  # time for AI/structural mapping proposal
    total_latency_ms: Optional[float] = None    # end-to-end request time
    mapping_source: Optional[str] = None        # "ollama" | "structural_fallback" | "fingerprint_cache"

class AuditDetailResponse(BaseModel):
    audit: AuditSummaryDTO
    findings: List[FindingDTO]
    attack_paths: List[AttackPathDTO]
    single_fix_recommendation: Optional[SingleFixRecommendation] = None
    normalized_config: Optional[NormalizedConfig] = None
    # Effective compliance AFTER genuine governance waivers (waived findings
    # removed from the fail count). None when the audit has no findings.
    effective_score: Optional[float] = None
    effective_fail_count: Optional[int] = None
    effective_total_count: Optional[int] = None

class AIMappingApprovalRequest(BaseModel):
    approved_by: str = "analyst"
    vendor_name: Optional[str] = None
    edited_schema: Optional[Dict[str, Any]] = None

class AIMappingResponse(BaseModel):
    id: int
    audit_id: Optional[int]
    fingerprint_hash: str
    vendor_guessed: str
    confidence: float
    status: str
    proposed_schema: Dict[str, Any]
    config_sample: Optional[str]

class HealthResponse(BaseModel):
    status: str
    app_name: str
    database_connected: bool
    database_backend: str
    ollama_connected: bool
    ollama_model: str




class FleetDeviceResult(BaseModel):
    """Per-file batch outcome — additive, unused by any pre-existing endpoint."""
    audit_id: int
    device_id: int
    hostname: str
    vendor: str
    filename: str
    status: str                        # COMPLETED | PENDING_AI_MAPPING
    compliance_score: float
    total_findings: int
    failed_findings: int
    attack_paths_count: int
    ai_mapping_pending: bool
    detection_method: str
    mapping_source: str
    latency_ms: float
    error: Optional[str] = None


class FleetBatchResponse(BaseModel):
    """Batch run: one FleetDeviceResult per uploaded file."""
    total_files: int
    completed_count: int
    pending_count: int
    failed_count: int
    results: List[FleetDeviceResult]


class FleetRuleAggregate(BaseModel):
    """N of M devices currently FAILING a specific rule, computed from real
    per-device audit records (never a hardcoded number)."""
    rule_id: str
    title: str
    severity: str
    framework: str
    devices_present: int   # devices whose audit ran and covered this rule
    devices_failing: int   # devices where this rule's finding status == "fail"
    compliance_pct: float  # 100.0 * (1 - devices_failing / devices_present)


class FleetAttackChainAggregate(BaseModel):
    """N of M devices with a specific correlated attack chain currently active."""
    chain_id: str
    name: str
    severity: str
    devices_present: int   # devices whose audit produced this chain
    devices_active: int    # devices where is_active == 1 (real attack path firing)
    firing_pct: float


class FleetSummaryResponse(BaseModel):
    """Fleet-wide N-of-M aggregates (rules + attack chains) + REAL governance
    signal (human-approved ÷ total audits) computed from persisted rows."""
    total_devices: int
    total_audits: int = 0
    human_approved_audits: int = 0
    by_rule: List[FleetRuleAggregate]
    by_chain: List[FleetAttackChainAggregate]
