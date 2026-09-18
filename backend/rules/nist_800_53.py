from typing import List
from backend.rules.base import ComplianceRule, CheckResult
from backend.schemas.neutral_config import NormalizedConfig

class RuleNISTAC2(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="NIST-AC-2",
            framework="NIST-800-53",
            title="Account Management - Prevent default unmanaged accounts",
            severity="high",
            remediation="Enforce named individual accounts and decommission shared or default admin credentials.",
            explanation="NIST AC-2 requires individual account management and prohibits unmonitored default accounts."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.weak_or_default_users:
            return CheckResult(
                passed=False,
                explanation=f"Default or generic accounts detected: {config.auth.weak_or_default_users}"
            )
        return CheckResult(passed=True, explanation="No default or weak user accounts detected.")

class RuleNISTAC3(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="NIST-AC-3",
            framework="NIST-800-53",
            title="Access Enforcement - Enforce network access control to management plane",
            severity="high",
            remediation="Apply access control lists to management lines and interfaces.",
            explanation="NIST AC-3 mandates that access enforcement mechanisms limit connectivity to authorized network management segments."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.management.vty_lines:
            unrestricted = [v.range for v in config.management.vty_lines if not v.access_class]
            if unrestricted:
                return CheckResult(
                    passed=False,
                    explanation=f"Lines {unrestricted} lack access-list restrictions."
                )
        return CheckResult(passed=True, explanation="Management lines are gated by access lists.")

class RuleNISTAC12(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="NIST-AC-12",
            framework="NIST-800-53",
            title="Session Termination - Automatic session lock after inactivity",
            severity="medium",
            remediation="Set inactivity timeout to 10 minutes or less on all administrative interfaces.",
            explanation="NIST AC-12 requires devices to automatically terminate administrative sessions after 10-15 minutes of inactivity."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        for vty in config.management.vty_lines:
            if not vty.exec_timeout_minutes or vty.exec_timeout_minutes > 15:
                return CheckResult(passed=False, explanation="Management session inactivity timeout is not enforced within 15 minutes.")
        return CheckResult(passed=True, explanation="Session inactivity timeout enforced.")

class RuleNISTAC17(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="NIST-AC-17",
            framework="NIST-800-53",
            title="Remote Access - Enforce encrypted remote management sessions",
            severity="critical",
            remediation="Disable cleartext management (Telnet/HTTP) and mandate SSHv2 / HTTPS.",
            explanation="NIST AC-17 mandates encrypted remote access to prevent credential interception across network boundaries."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.crypto.telnet_enabled:
            return CheckResult(passed=False, explanation="Cleartext Telnet remote access is enabled.")
        for vty in config.management.vty_lines:
            # Empty transport_input means the platform default (telnet+ssh) is in
            # effect on Cisco IOS, so cleartext remote access is still permitted.
            if not vty.transport_input or "telnet" in vty.transport_input or "all" in vty.transport_input:
                return CheckResult(passed=False, evidence=vty.ref, explanation=f"Line {vty.range} permits unencrypted remote access.")
        return CheckResult(passed=True, explanation="All remote access paths require encrypted protocols.")

class RuleNISTAU2(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="NIST-AU-2",
            framework="NIST-800-53",
            title="Audit Events - Centralized audit and event log generation",
            severity="high",
            remediation="Enable logging and configure destination remote syslog servers.",
            explanation="NIST AU-2 mandates the capture and off-system persistence of auditable security events."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.logging.enabled and config.logging.syslog_servers:
            return CheckResult(passed=True, evidence=config.logging.ref, explanation="Remote audit logging is active.")
        return CheckResult(passed=False, explanation="Audit logging is missing or not forwarded to centralized storage.")

class RuleNISTIA2(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="NIST-IA-2",
            framework="NIST-800-53",
            title="Identification and Authentication - Enforce AAA access framework",
            severity="high",
            remediation="Enable centralized AAA authentication framework.",
            explanation="NIST IA-2 requires unique identification and centralized authentication for all device administrators."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.aaa_new_model:
            return CheckResult(passed=True, explanation="AAA centralized authentication framework is operational.")
        return CheckResult(passed=False, explanation="AAA is not enabled; individual user authentication is compromised.")

class RuleNISTIA5(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="NIST-IA-5",
            framework="NIST-800-53",
            title="Authenticator Management - Cryptographic storage of system authenticators",
            severity="high",
            remediation="Enforce reversible-resistant cryptographic password hashing (enable secret / service password-encryption).",
            explanation="NIST IA-5 requires that stored authenticators be cryptographically protected from disclosure."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.password_encryption_enabled or config.auth.enable_secret_configured:
            return CheckResult(passed=True, explanation="Authenticators are cryptographically protected.")
        return CheckResult(passed=False, explanation="Passwords stored without cryptographic encryption.")

def get_nist_rules() -> List[ComplianceRule]:
    return [
        RuleNISTAC2(),
        RuleNISTAC3(),
        RuleNISTAC12(),
        RuleNISTAC17(),
        RuleNISTAU2(),
        RuleNISTIA2(),
        RuleNISTIA5(),
    ]
