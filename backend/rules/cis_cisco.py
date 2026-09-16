from typing import List
from backend.rules.base import ComplianceRule, CheckResult
from backend.schemas.neutral_config import NormalizedConfig, LineRef

class RuleAAANewModel(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.1",
            framework="CIS",
            title="Enable 'aaa new-model' for centralized access control",
            severity="critical",
            remediation="configure terminal\n aaa new-model\nend",
            explanation="Without AAA enabled, the router relies on line passwords without user accountability or centralized policy enforcement."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.aaa_new_model:
            return CheckResult(passed=True, evidence=config.auth.ref, explanation="aaa new-model is enabled.")
        return CheckResult(passed=False, explanation="aaa new-model is missing from configuration.")

class RulePasswordEncryption(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.2",
            framework="CIS",
            title="Enable 'service password-encryption'",
            severity="medium",
            remediation="configure terminal\n service password-encryption\nend",
            explanation="Plaintext passwords in the configuration file can be easily viewed by unauthorized personnel or during shoulder-surfing."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.password_encryption_enabled:
            return CheckResult(passed=True, explanation="service password-encryption is enabled.")
        return CheckResult(passed=False, explanation="service password-encryption is not enabled; passwords may be exposed in cleartext.")

class RuleEnableSecret(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.3",
            framework="CIS",
            title="Set 'enable secret' instead of 'enable password'",
            severity="high",
            remediation="configure terminal\n no enable password\n enable secret <strong-secret>\nend",
            explanation="'enable password' uses weak or plaintext hashing. 'enable secret' uses cryptographic hashing (SHA-256/scrypt)."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.enable_secret_configured and not config.auth.enable_password_configured:
            return CheckResult(passed=True, evidence=config.auth.ref, explanation="enable secret is used without legacy enable password.")
        if config.auth.enable_password_configured:
            return CheckResult(passed=False, explanation="Legacy 'enable password' is used, exposing privileged credentials to brute-forcing.")
        if not config.auth.enable_secret_configured:
            return CheckResult(passed=False, explanation="No 'enable secret' is configured.")
        return CheckResult(passed=True)

class RuleVTYTimeout(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.4",
            framework="CIS",
            title="Set exec-timeout to 10 minutes or less on VTY lines",
            severity="medium",
            remediation="configure terminal\n line vty 0 4\n  exec-timeout 10 0\nend",
            explanation="Unattended management sessions remain open indefinitely if exec-timeout is disabled or set too high."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if not config.management.vty_lines:
            return CheckResult(passed=False, explanation="No VTY lines configured.")
        for vty in config.management.vty_lines:
            if vty.exec_timeout_minutes is None or vty.exec_timeout_minutes == 0 or vty.exec_timeout_minutes > 10:
                return CheckResult(
                    passed=False,
                    evidence=vty.ref,
                    explanation=f"VTY line {vty.range} exec-timeout is {vty.exec_timeout_minutes} min (must be 1-10 min)."
                )
        return CheckResult(passed=True, explanation="All VTY lines have exec-timeout <= 10 minutes.")

class RuleConsoleTimeout(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.5",
            framework="CIS",
            title="Set exec-timeout on console port",
            severity="medium",
            remediation="configure terminal\n line con 0\n  exec-timeout 10 0\nend",
            explanation="Unattended serial console sessions must be locked automatically after inactivity."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        t = config.management.console_exec_timeout_minutes
        if t is not None and 1 <= t <= 10:
            return CheckResult(passed=True, explanation=f"Console exec-timeout is set to {t} minutes.")
        return CheckResult(passed=False, explanation=f"Console exec-timeout is {t} (must be 1-10 minutes).")

class RuleVTYTransportSSH(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.6",
            framework="CIS",
            title="Enforce 'transport input ssh' only on VTY lines",
            severity="critical",
            remediation="configure terminal\n line vty 0 4\n  transport input ssh\nend",
            explanation="Telnet transmits usernames, passwords, and commands in cleartext, allowing interception and lateral movement."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if not config.management.vty_lines:
            return CheckResult(passed=False, explanation="No VTY line configurations found.")
        for vty in config.management.vty_lines:
            if not vty.transport_input or "telnet" in vty.transport_input or "all" in vty.transport_input:
                return CheckResult(
                    passed=False,
                    evidence=vty.ref,
                    explanation=f"VTY line {vty.range} permits insecure cleartext protocol: {vty.transport_input}"
                )
        return CheckResult(passed=True, explanation="All VTY lines enforce SSH-only transport.")

class RuleSSHVersion2(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.7",
            framework="CIS",
            title="Configure 'ip ssh version 2'",
            severity="high",
            remediation="configure terminal\n ip ssh version 2\nend",
            explanation="SSHv1 is vulnerable to man-in-the-middle attacks, CRC32 compensation attacks, and insertion exploits."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.crypto.ssh_version == 2:
            return CheckResult(passed=True, evidence=config.crypto.ref, explanation="ip ssh version 2 is configured.")
        return CheckResult(passed=False, explanation="SSH version 2 is not enforced.")

class RuleVTYAccessClass(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.1.8",
            framework="CIS",
            title="Apply an 'access-class' ACL to VTY lines",
            severity="high",
            remediation="configure terminal\n ip access-list standard MGMT-HOSTS\n  permit 10.0.0.0 0.0.0.255\n line vty 0 4\n  access-class MGMT-HOSTS in\nend",
            explanation="Without an access-class, management ports can be probed or attacked from any IP address capable of routing to the router."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if not config.management.vty_lines:
            return CheckResult(passed=False, explanation="No VTY lines configured.")
        for vty in config.management.vty_lines:
            if not vty.access_class:
                return CheckResult(
                    passed=False,
                    evidence=vty.ref,
                    explanation=f"VTY line {vty.range} has no access-class restricting management IPs."
                )
        return CheckResult(passed=True, explanation="All VTY lines have access-class filtering applied.")

class RuleDisableHTTPServer(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.2.1",
            framework="CIS",
            title="Disable unencrypted HTTP server ('no ip http server')",
            severity="high",
            remediation="configure terminal\n no ip http server\nend",
            explanation="The unencrypted web interface transmits credentials in cleartext and is a frequent target for web exploits."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.crypto.http_server_enabled:
            return CheckResult(passed=False, explanation="Cleartext 'ip http server' is enabled.")
        return CheckResult(passed=True, explanation="Unencrypted HTTP server is disabled.")

class RuleLoggingHost(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.3.1",
            framework="CIS",
            title="Configure remote syslog logging host",
            severity="high",
            remediation="configure terminal\n logging host <syslog-server-ip>\n logging trap informational\nend",
            explanation="Without off-device syslog shipping, an attacker can erase local device logs to completely hide their intrusions."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.logging.enabled and len(config.logging.syslog_servers) > 0:
            return CheckResult(passed=True, evidence=config.logging.ref, explanation=f"Remote syslog host(s) configured: {config.logging.syslog_servers}")
        return CheckResult(passed=False, explanation="No remote syslog host configured. Log tampering cannot be audited.")

class RuleLoggingBuffered(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.3.2",
            framework="CIS",
            title="Enable 'logging buffered'",
            severity="medium",
            remediation="configure terminal\n logging buffered 64000\nend",
            explanation="Buffered logging preserves critical log entries in memory even if remote logging temporarily disconnects."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.logging.buffered_enabled:
            return CheckResult(passed=True, explanation="logging buffered is enabled.")
        return CheckResult(passed=False, explanation="logging buffered is not enabled.")

class RuleLoggingTimestamps(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.3.3",
            framework="CIS",
            title="Configure service timestamps for logging",
            severity="low",
            remediation="configure terminal\n service timestamps log datetime msec\nend",
            explanation="Accurate millisecond timestamps are required for incident forensic correlation and compliance accountability."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.logging.timestamps_enabled:
            return CheckResult(passed=True, explanation="service timestamps log is enabled.")
        return CheckResult(passed=False, explanation="service timestamps log datetime is missing.")

class RuleNoDefaultSNMPCommunity(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.4.1",
            framework="CIS",
            title="Remove default SNMP community strings ('public', 'private')",
            severity="critical",
            remediation="configure terminal\n no snmp-server community public\n no snmp-server community private\nend",
            explanation="Well-known community strings like 'public' and 'private' allow trivial reconnaissance or device reconfiguration by anyone on the network."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        for comm in config.snmp.communities:
            if comm.is_default_string:
                return CheckResult(
                    passed=False,
                    evidence=comm.ref,
                    explanation=f"Default SNMP community string '{comm.name}' ({comm.permission.upper()}) is configured!"
                )
        return CheckResult(passed=True, explanation="No default SNMP community strings detected.")

class RuleSNMPCommunityACL(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.4.2",
            framework="CIS",
            title="Restrict SNMP community strings with an ACL",
            severity="high",
            remediation="configure terminal\n ip access-list standard SNMP-NMS\n  permit 10.0.0.50\n snmp-server community <secret> ro SNMP-NMS\nend",
            explanation="SNMP community strings without ACLs allow any host on any reachable subnet to poll or modify device MIBs."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if not config.snmp.communities:
            return CheckResult(passed=True, explanation="No SNMP communities configured.")
        for comm in config.snmp.communities:
            if not comm.acl_name:
                return CheckResult(
                    passed=False,
                    evidence=comm.ref,
                    explanation=f"SNMP community '{comm.name}' has no ACL restriction applied."
                )
        return CheckResult(passed=True, explanation="All SNMP communities are protected by ACLs.")

class RuleSNMPv3(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.4.3",
            framework="CIS",
            title="Migrate to SNMPv3 with authentication and privacy",
            severity="high",
            remediation="configure terminal\n snmp-server group SECGROUP v3 priv\n snmp-server user admin SECGROUP v3 auth sha <authpass> priv aes 128 <privpass>\nend",
            explanation="SNMPv1 and SNMPv2c transmit community strings in cleartext UDP datagrams that can be easily sniffed."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.snmp.snmpv3_configured:
            return CheckResult(passed=True, explanation="SNMPv3 is configured.")
        if config.snmp.enabled and not config.snmp.snmpv3_configured:
            return CheckResult(passed=False, explanation="Legacy SNMPv1/v2c is in use without SNMPv3 encryption.")
        return CheckResult(passed=True, explanation="SNMP is disabled.")

class RuleDisableIPSourceRouting(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.5.1",
            framework="CIS",
            title="Disable IP source routing ('no ip source-route')",
            severity="medium",
            remediation="configure terminal\n no ip source-route\nend",
            explanation="IP source routing permits packet senders to specify network paths, enabling spoofing and perimeter firewall bypass."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if not config.services.ip_source_routing:
            return CheckResult(passed=True, explanation="no ip source-route is configured.")
        return CheckResult(passed=False, explanation="IP source routing is enabled (default); packet route hijacking is possible.")

class RuleDisableFinger(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.5.2",
            framework="CIS",
            title="Disable finger service ('no service finger')",
            severity="low",
            remediation="configure terminal\n no service finger\nend",
            explanation="Finger service leaks logged-in user details and active sessions to unauthenticated network interrogators."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.services.finger_disabled:
            return CheckResult(passed=True, explanation="Finger service is disabled.")
        return CheckResult(passed=False, explanation="service finger is not disabled.")

class RuleLoginBlock(ComplianceRule):
    def __init__(self):
        super().__init__(
            rule_id="CIS-CISCO-1.5.4",
            framework="CIS",
            title="Configure login block-for brute-force mitigation",
            severity="high",
            remediation="configure terminal\n login block-for 180 attempts 3 within 60\nend",
            explanation="Without login rate limiting, automated dictionary and brute-force attacks against management lines can succeed."
        )

    def evaluate(self, config: NormalizedConfig) -> CheckResult:
        if config.auth.login_block_configured:
            return CheckResult(passed=True, explanation="login block-for brute force protection is enabled.")
        return CheckResult(passed=False, explanation="No login block-for rate limiting configured against brute-force attacks.")

def get_cis_cisco_rules() -> List[ComplianceRule]:
    return [
        RuleAAANewModel(),
        RulePasswordEncryption(),
        RuleEnableSecret(),
        RuleVTYTimeout(),
        RuleConsoleTimeout(),
        RuleVTYTransportSSH(),
        RuleSSHVersion2(),
        RuleVTYAccessClass(),
        RuleDisableHTTPServer(),
        RuleLoggingHost(),
        RuleLoggingBuffered(),
        RuleLoggingTimestamps(),
        RuleNoDefaultSNMPCommunity(),
        RuleSNMPCommunityACL(),
        RuleSNMPv3(),
        RuleDisableIPSourceRouting(),
        RuleDisableFinger(),
        RuleLoginBlock(),
    ]
