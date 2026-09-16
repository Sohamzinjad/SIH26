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

class AuditDetailResponse(BaseModel):
    audit: AuditSummaryDTO
    findings: List[FindingDTO]
    attack_paths: List[AttackPathDTO]
    single_fix_recommendation: Optional[SingleFixRecommendation] = None
    normalized_config: Optional[NormalizedConfig] = None

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
