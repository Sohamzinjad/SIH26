from typing import List, Tuple
from backend.rules.base import ComplianceRule
from backend.rules.cis_cisco import get_cis_cisco_rules
from backend.rules.cis_fortios import get_cis_fortios_rules
from backend.rules.nist_800_53 import get_nist_rules
from backend.rules.disa_stig import get_disa_stig_rules
from backend.schemas.neutral_config import NormalizedConfig
from backend.schemas.finding import FindingDTO, EvidenceModel

class ComplianceRuleEngine:
    def __init__(self):
        self.cis_cisco_rules = get_cis_cisco_rules()
        self.cis_fortios_rules = get_cis_fortios_rules()
        self.nist_rules = get_nist_rules()
        self.disa_stig_rules = get_disa_stig_rules()

    def get_rules_for_config(self, config: NormalizedConfig) -> List[ComplianceRule]:
        rules: List[ComplianceRule] = []
        if config.vendor == "cisco_ios":
            rules.extend(self.cis_cisco_rules)
            rules.extend(self.nist_rules)
            rules.extend(self.disa_stig_rules)
        elif config.vendor == "fortios":
            rules.extend(self.cis_fortios_rules)
            rules.extend(self.nist_rules)
            rules.extend(self.disa_stig_rules)
        else:
            # Unknown vendor or general evaluation
            rules.extend(self.nist_rules)
            rules.extend(self.disa_stig_rules)
        return rules

    def audit(self, config: NormalizedConfig) -> Tuple[float, List[FindingDTO], int, int, int]:
        """
        Evaluates the normalized configuration.
        Returns: (compliance_score, findings, pass_count, fail_count, total_count)
        """
        rules = self.get_rules_for_config(config)
        findings: List[FindingDTO] = []

        total_weight = 0
        passing_weight = 0
        pass_count = 0
        fail_count = 0

        for rule in rules:
            result = rule.evaluate(config)
            total_weight += rule.weight

            ev_model = None
            if result.evidence:
                ev_model = EvidenceModel(
                    line_start=result.evidence.line_start,
                    line_end=result.evidence.line_end,
                    snippet=result.evidence.snippet
                )

            status = "pass" if result.passed else "fail"
            if result.passed:
                passing_weight += rule.weight
                pass_count += 1
            else:
                fail_count += 1

            findings.append(
                FindingDTO(
                    rule_id=rule.rule_id,
                    framework=rule.framework,
                    title=rule.title,
                    severity=rule.severity,
                    weight=rule.weight,
                    status=status,
                    evidence=ev_model,
                    remediation=rule.remediation,
                    explanation=result.explanation or rule.explanation
                )
            )

        score = 100.0
        if total_weight > 0:
            score = round((passing_weight / total_weight) * 100.0, 1)

        return score, findings, pass_count, fail_count, len(rules)

engine = ComplianceRuleEngine()
