from typing import List
from backend.rules.base import ComplianceRule, CheckResult
from backend.schemas.neutral_config import NormalizedConfig

class RuleSTIGSessionLock(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="STIG-V-202007",
            framework="DISA-STIG",
            title="Enforce administrative session termination after inactivity",
            severity="medium",
            remediation="Set exec-timeout 10 0 or less on all interactive terminal lines.",
            explanation="DISA STIG requires network infrastructure devices to initiate a session lock after 10 minutes or less of inactivity."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.management.vty_lines:
            for vty in config.management.vty_lines:
                if not vty.exec_timeout_minutes or vty.exec_timeout_minutes > 10:
                    return CheckResult(passed=False, explanation=f"Line {vty.range} idle timeout exceeds 10 minutes.")
        return CheckResult(passed=True, explanation="Session lock complies with STIG requirements.")

class RuleSTIGEncryptedPasswords(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="STIG-V-202065",
            framework="DISA-STIG",
            title="Transmit and store only encrypted representations of passwords",
            severity="high",
            remediation="Configure 'service password-encryption' and 'enable secret'.",
            explanation="DISA STIG requires that all passwords stored within network device configuration files be strongly encrypted."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.password_encryption_enabled and config.auth.enable_secret_configured:
            return CheckResult(passed=True, explanation="Passwords stored with encryption.")
        return CheckResult(passed=False, explanation="Device permits unencrypted or weakly hashed passwords.")

class RuleSTIGUnnecessaryServices(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="STIG-V-202049",
            framework="DISA-STIG",
            title="Prohibit unnecessary and non-secure protocols and services",
            severity="medium",
            remediation="Disable small-servers, finger, and cleartext HTTP services.",
            explanation="DISA STIG mandates disabling all unnecessary network services that expand the attack surface."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        issues = []
        if config.crypto.http_server_enabled:
            issues.append("HTTP web service enabled")
        if not config.services.finger_disabled:
            issues.append("Finger service not explicitly disabled")
        if issues:
            return CheckResult(passed=False, explanation=", ".join(issues))
        return CheckResult(passed=True, explanation="Non-secure and unnecessary services disabled.")

def get_disa_stig_rules() -> List[ComplianceRule]:
    return [
        RuleSTIGSessionLock(),
        RuleSTIGEncryptedPasswords(),
        RuleSTIGUnnecessaryServices(),
    ]
