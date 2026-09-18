from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from backend.enrichment.schemas import CVEReferenceDTO

__all__ = ["FindingDTO", "FindingDTOBuilder", "EvidenceModel"]

class EvidenceModel(BaseModel):
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    snippet: Optional[str] = None

class FindingDTO(BaseModel):
    id: Optional[int] = None
    rule_id: str
    framework: str
    title: str
    severity: str  # critical, high, medium, low
    weight: int
    status: str  # pass, fail
    evidence: Optional[EvidenceModel] = None
    remediation: Optional[str] = None
    explanation: Optional[str] = None
    cves: Optional[List["CVEReferenceDTO"]] = None  # additive-only enrichment

class AttackPathDTO(BaseModel):
    id: Optional[int] = None
    chain_id: str
    name: str
    severity: str
    narrative: str
    finding_rule_ids: List[str]
    break_rule_id: str
    break_why: str
    is_active: bool = True

class SingleFixRecommendation(BaseModel):
    rule_id: str
    rule_title: str
    remediation: str
    paths_broken_count: int
    paths_broken_names: List[str]
    remaining_paths_count: int
    impact_score: float
    why: str

class AuditSummaryDTO(BaseModel):
    id: int
    device_id: Optional[int]
    hostname: str
    vendor: str
    score: float
    pass_count: int
    fail_count: int
    total_count: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    attack_paths_count: int
