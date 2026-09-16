from typing import List
from backend.rules.base import ComplianceRule, CheckResult
from backend.schemas.neutral_config import NormalizedConfig

class RuleFortiAdminTimeout(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-FORTI-1.1.1",
            framework="CIS",
            title="Set idle admin timeout to 10 minutes or less",
            severity="medium",
            remediation="config system global\n set admintimeout 10\nend",
            explanation="Administrators who leave their workstations unattended risk unauthorized configuration changes if sessions stay alive."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        t = config.management.console_exec_timeout_minutes
        if t is not None and 1 <= t <= 10:
            return CheckResult(passed=True, explanation=f"FortiOS admin timeout is set to {t} minutes.")
        return CheckResult(passed=False, explanation=f"FortiOS admin timeout is {t} (must be 1-10 minutes).")

class RuleFortiTelnetDisabled(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-FORTI-1.1.2",
            framework="CIS",
            title="Disable Telnet administrative access on all interfaces",
            severity="critical",
            remediation="config system interface\n edit <interface-name>\n  unset allowaccess telnet\n next\nend",
            explanation="Cleartext Telnet exposes firewall administrator credentials to packet sniffing on local network segments."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.crypto.telnet_enabled:
            return CheckResult(passed=False, explanation="Telnet access is allowed in interface or global settings.")
        return CheckResult(passed=True, explanation="Telnet administrative access is completely disabled.")

class RuleFortiHTTPDisabled(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-FORTI-1.1.3",
            framework="CIS",
            title="Disable unencrypted HTTP web management",
            severity="high",
            remediation="config system interface\n edit <interface-name>\n  unset allowaccess http\n next\nend",
            explanation="Administrative web traffic should always be protected by HTTPS/TLS to prevent credential eavesdropping."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.crypto.http_server_enabled:
            return CheckResult(passed=False, explanation="Unencrypted HTTP management is permitted on interfaces.")
        return CheckResult(passed=True, explanation="Unencrypted HTTP management is disabled.")

class RuleFortiSyslog(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-FORTI-1.2.1",
            framework="CIS",
            title="Configure remote syslog logging server",
            severity="high",
            remediation="config log syslogd setting\n set status enable\n set server <syslog-ip>\nend",
            explanation="Offloading firewall traffic and security event logs to a SIEM ensures audit durability and non-repudiation."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.logging.enabled and config.logging.syslog_servers:
            return CheckResult(passed=True, evidence=config.logging.ref, explanation=f"Remote syslog server configured: {config.logging.syslog_servers}")
        return CheckResult(passed=False, explanation="Remote syslog logging is not configured or enabled.")

class RuleFortiSNMPDefaultCommunity(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-FORTI-1.3.1",
            framework="CIS",
            title="Remove default SNMP community strings ('public', 'private')",
            severity="critical",
            remediation="config system snmp community\n delete 1\nend",
            explanation="Default community strings allow unauthorized clients to poll firewall interface and topology metrics."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        for comm in config.snmp.communities:
            if comm.is_default_string:
                return CheckResult(passed=False, evidence=comm.ref, explanation=f"Default SNMP community '{comm.name}' found.")
        return CheckResult(passed=True, explanation="No default SNMP communities exist.")

def get_cis_fortios_rules() -> List[ComplianceRule]:
    return [
        RuleFortiAdminTimeout(),
        RuleFortiTelnetDisabled(),
        RuleFortiHTTPDisabled(),
        RuleFortiSyslog(),
        RuleFortiSNMPDefaultCommunity(),
    ]
