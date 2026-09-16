from abc import ABC, abstractmethod
from typing import Optional, NamedTuple
from backend.schemas.neutral_config import NormalizedConfig, LineRef

class CheckResult(NamedTuple):
    passed: bool
    evidence: Optional[LineRef] = None
    explanation: Optional[str] = None

SEVERITY_WEIGHTS = {
    "critical": 20,
    "high": 10,
    "medium": 5,
    "low": 2
}

class ComplianceRule(ABC):
    def __init__(
        self,
        rule_id: str,
        framework: str,
        title: str,
        severity: str,
        remediation: str,
        explanation: str
    ):
        self.rule_id = rule_id
        self.framework = framework
        self.title = title
        self.severity = severity.lower()
        self.weight = SEVERITY_WEIGHTS.get(self.severity, 5)
        self.remediation = remediation
        self.explanation = explanation

    @abstractmethod
    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        """Evaluates normalized configuration against this compliance rule."""
        pass
