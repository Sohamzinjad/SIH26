from typing import List, Dict, Any, Set
from backend.schemas.finding import FindingDTO, AttackPathDTO

ATTACK_CHAIN_TEMPLATES = [
    {
        "chain_id": "CHAIN-NET-MGMT-TAKEOVER",
        "name": "Cleartext Management Plane to Full Device Compromise",
        "severity": "critical",
        "requires": ["CIS-CISCO-1.1.6", "CIS-CISCO-1.1.8", "CIS-CISCO-1.1.1", "CIS-CISCO-1.3.1"],
        "min_matches": 3,
        "break_rule_id": "CIS-CISCO-1.1.8",
        "break_why": "Applying an access-class to VTY lines cuts off network reachability for all administrative protocols at once, rendering credential sniffing and Telnet brute-force impossible from untrusted segments.",
        "narrative": "The management plane is exposed to untrusted subnets because no VTY access-class is applied, while cleartext Telnet is permitted. An adversary on the path intercepts administrative credentials, authenticates without centralized AAA auditing, and gains privileged EXEC mode with zero remote syslog trace."
    },
    {
        "chain_id": "CHAIN-NET-SNMP-RECON-WRITE",
        "name": "Default SNMP Community to Unauthenticated Device Reconfiguration",
        "severity": "critical",
        "requires": ["CIS-CISCO-1.4.1", "CIS-CISCO-1.4.2", "CIS-CISCO-1.3.1"],
        "min_matches": 2,
        "break_rule_id": "CIS-CISCO-1.4.1",
        "break_why": "Removing default 'public' and 'private' strings prevents automated network scanners and botnets from querying device MIBs or modifying configuration registers over UDP.",
        "narrative": "Well-known SNMP community strings are active without ACL restrictions. An attacker queries SNMP to discover network topology, ARP tables, and interface layouts, and utilizes write permissions to alter configuration parameters undetected."
    },
    {
        "chain_id": "CHAIN-NET-CRED-EXPOSURE",
        "name": "Cleartext Credential Harvest to Indefinite Session Hijacking",
        "severity": "high",
        "requires": ["CIS-CISCO-1.1.2", "CIS-CISCO-1.1.3", "CIS-CISCO-1.1.4"],
        "min_matches": 2,
        "break_rule_id": "CIS-CISCO-1.1.3",
        "break_why": "Replacing legacy 'enable password' with 'enable secret' employs SHA-256/scrypt cryptographic hashing, so viewing or exfiltrating config backups does not yield usable privileged credentials.",
        "narrative": "Administrative passwords are stored unencrypted or with weak hashes in the configuration. Combined with disabled or high session inactivity timeouts, an attacker who obtains backup files or physical console access can reuse credentials or resume abandoned sessions indefinitely."
    },
    {
        "chain_id": "CHAIN-NET-WEB-EXPLOITATION",
        "name": "Unencrypted HTTP Management Interface Exploitation",
        "severity": "high",
        "requires": ["CIS-CISCO-1.2.1", "CIS-CISCO-1.1.8", "CIS-CISCO-1.1.1"],
        "min_matches": 2,
        "break_rule_id": "CIS-CISCO-1.2.1",
        "break_why": "Disabling the legacy unencrypted HTTP server eliminates web-based credential transmission and shuts down the legacy HTTP daemon attack surface entirely.",
        "narrative": "The unencrypted HTTP management daemon is enabled on all interfaces. Adversaries can capture plaintext web administration cookies and passwords across local LAN segments to take over the device."
    },
    {
        "chain_id": "CHAIN-NET-SPOOFING-BYPASS",
        "name": "IP Source Routing Perimeter Firewall Bypass",
        "severity": "medium",
        "requires": ["CIS-CISCO-1.5.1", "CIS-CISCO-1.1.8"],
        "min_matches": 2,
        "break_rule_id": "CIS-CISCO-1.5.1",
        "break_why": "Executing 'no ip source-route' forces all packet routing to follow strictly verified routing tables, preventing attackers from forcing packets past ingress inspection filters.",
        "narrative": "IP source routing permits external senders to dictate the hop path through internal interfaces, enabling route injection and perimeter ACL evasion."
    },
    {
        "chain_id": "CHAIN-WB-MGMT-TAKEOVER",
        "name": "Unrestricted Cleartext Management to Whitebox Device Takeover",
        "severity": "critical",
        "requires": ["NIST-AC-17", "NIST-AC-3", "NIST-IA-2", "NIST-AU-2"],
        "min_matches": 3,
        "break_rule_id": "NIST-AC-17",
        "break_why": "Enforcing encrypted remote sessions (SSH/HTTPS) and disabling Telnet/HTTP removes the sniffable credential channel that is the root of this whole chain.",
        "narrative": "The whitebox box exposes cleartext management (Telnet/HTTP) on an unsegmented network with no access-control gating and no centralized AAA. An on-path adversary captures administrator credentials in cleartext, bypasses per-user accountability, and takes over the device without any log evidence arriving at a syslog collector."
    },
    {
        "chain_id": "CHAIN-WB-ACCOUNT-COMPROMISE",
        "name": "Default Credentials to Unauthenticated Whitebox Admin Access",
        "severity": "critical",
        "requires": ["NIST-IA-5", "NIST-AC-2", "NIST-AC-12"],
        "min_matches": 2,
        "break_rule_id": "NIST-IA-5",
        "break_why": "Moving to cryptographically hashed account secrets (and removing shared default admin/root logins) prevents credential reuse and offline cracking of exposed device stores.",
        "narrative": "The device ships with default or shared admin accounts whose secrets are stored unencrypted, and administrative sessions are never auto-terminated. Any attacker who retrieves a backup, touches the console, or watches a slow session can recover high-privilege credentials and walk into an active admin session."
    },
    {
        "chain_id": "CHAIN-WB-SNMP-RECON-WRITE",
        "name": "Default SNMP Community to Whitebox Reconfiguration",
        "severity": "high",
        "requires": ["NIST-AC-3", "NIST-AC-17", "SNMP-DEFAULT"],
        "min_matches": 2,
        "break_rule_id": "NIST-AC-3",
        "break_why": "Applying network access restrictions to the management plane (including SNMP) stops remote scanners from reaching a default-community SNMP agent in the first place.",
        "narrative": "Well-known SNMP community strings are active on the whitebox with unrestricted reachability. Attackers enumerate interface tables and topology to pivot into management protocols, then use write-capable strings to alter the configuration undetected."
    },
]

def correlate_attack_paths(findings: List[FindingDTO]) -> List[AttackPathDTO]:
    """Correlates failed compliance findings into plausible multi-stage attack paths."""
    failed_rule_ids: Set[str] = {f.rule_id for f in findings if f.status == "fail"}
    active_paths: List[AttackPathDTO] = []

    for template in ATTACK_CHAIN_TEMPLATES:
        reqs = template["requires"]
        matches = [r for r in reqs if r in failed_rule_ids]
        min_needed = template.get("min_matches", len(reqs))

        if len(matches) >= min_needed:
            active_paths.append(
                AttackPathDTO(
                    chain_id=template["chain_id"],
                    name=template["name"],
                    severity=template["severity"],
                    narrative=template["narrative"],
                    finding_rule_ids=matches,
                    break_rule_id=template["break_rule_id"],
                    break_why=template["break_why"],
                    is_active=True
                )
            )

    return active_paths
