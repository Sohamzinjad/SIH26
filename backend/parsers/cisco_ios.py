import re
from typing import List, Optional, Dict, Any
from backend.parsers.base import BaseConfigParser
from backend.schemas.neutral_config import (
    NormalizedConfig, InterfaceConfig, ACLRule, AuthConfig, SNMPConfig,
    SNMPCommunity, LoggingConfig, CryptoConfig, ManagementAccess, VTYLine,
    ServiceConfig, LineRef
)

class CiscoIOSParser(BaseConfigParser):
    @property
    def vendor_name(self) -> str:
        return "cisco_ios"

    def parse(self, raw_config: str, filename: str = "cisco_config.cfg") -> NormalizedConfig:
        lines = raw_config.splitlines()
        normalized = NormalizedConfig(
            vendor="cisco_ios",
            source_file=filename,
            raw_config=raw_config
        )

        i = 0
        total_lines = len(lines)
        vty_blocks: List[VTYLine] = []

        while i < total_lines:
            raw_line = lines[i]
            line = raw_line.strip()
            line_num = i + 1  # 1-indexed

            if not line or line.startswith("!"):
                i += 1
                continue

            # Hostname
            if line.startswith("hostname "):
                parts = line.split()
                if len(parts) > 1:
                    normalized.hostname = parts[1]

            # Version
            elif line.startswith("version "):
                normalized.os_version = line.replace("version", "").strip()

            # AAA New Model
            elif line == "aaa new-model":
                normalized.auth.aaa_new_model = True
                normalized.auth.ref = LineRef(line_start=line_num, line_end=line_num, snippet=raw_line)

            # Service password-encryption
            elif line == "service password-encryption":
                normalized.auth.password_encryption_enabled = True

            # Enable secret / password
            elif line.startswith("enable secret"):
                normalized.auth.enable_secret_configured = True
                if not normalized.auth.ref:
                    normalized.auth.ref = LineRef(line_start=line_num, line_end=line_num, snippet=raw_line)
            elif line.startswith("enable password"):
                normalized.auth.enable_password_configured = True

            # Local Users
            elif line.startswith("username "):
                normalized.auth.local_users_count += 1
                match = re.search(r"username\s+(\S+)", line)
                if match:
                    u = match.group(1).lower()
                    if u in ["cisco", "admin", "root", "user", "guest"]:
                        normalized.auth.weak_or_default_users.append(u)

            # Login block (brute force protection)
            elif "login block-for" in line:
                normalized.auth.login_block_configured = True

            # SNMP Community
            elif line.startswith("snmp-server community "):
                normalized.snmp.enabled = True
                # e.g.: snmp-server community public RO [ACL_NAME]
                parts = line.split()
                comm_name = parts[2] if len(parts) > 2 else "public"
                perm = "ro"
                acl_name = None

                if len(parts) > 3:
                    if parts[3].lower() in ["ro", "rw"]:
                        perm = parts[3].lower()
                    if len(parts) > 4:
                        acl_name = parts[4]
                
                is_default = comm_name.lower() in ["public", "private"]
                comm = SNMPCommunity(
                    name=comm_name,
                    permission=perm,
                    acl_name=acl_name,
                    is_default_string=is_default,
                    ref=LineRef(line_start=line_num, line_end=line_num, snippet=raw_line)
                )
                normalized.snmp.communities.append(comm)

            # SNMPv3 User / Group
            elif line.startswith("snmp-server user ") or line.startswith("snmp-server group "):
                normalized.snmp.enabled = True
                normalized.snmp.snmpv3_configured = True
                if line.startswith("snmp-server user "):
                    parts = line.split()
                    if len(parts) > 2:
                        normalized.snmp.v3_users.append(parts[2])

            # SNMP Contact / Location
            elif line.startswith("snmp-server contact "):
                normalized.snmp.contact = line.replace("snmp-server contact", "").strip()
            elif line.startswith("snmp-server location "):
                normalized.snmp.location = line.replace("snmp-server location", "").strip()

            # Logging
            elif line.startswith("logging host ") or line.startswith("logging server "):
                normalized.logging.enabled = True
                parts = line.split()
                if len(parts) > 2:
                    normalized.logging.syslog_servers.append(parts[2])
                normalized.logging.ref = LineRef(line_start=line_num, line_end=line_num, snippet=raw_line)
            elif line.startswith("logging trap "):
                normalized.logging.trap_level = line.split()[-1]
            elif line.startswith("logging buffered"):
                normalized.logging.buffered_enabled = True
            elif line.startswith("service timestamps log"):
                normalized.logging.timestamps_enabled = True

            # SSH / Crypto
            elif line.startswith("ip ssh version "):
                normalized.crypto.ssh_enabled = True
                try:
                    normalized.crypto.ssh_version = int(line.split()[-1])
                except ValueError:
                    pass
                normalized.crypto.ref = LineRef(line_start=line_num, line_end=line_num, snippet=raw_line)
            elif line.startswith("crypto key generate rsa"):
                normalized.crypto.ssh_enabled = True
                match = re.search(r"modulus\s+(\d+)", line)
                if match:
                    normalized.crypto.rsa_key_size = int(match.group(1))

            # HTTP Management
            elif line == "ip http server":
                normalized.crypto.http_server_enabled = True
            elif line == "no ip http server":
                normalized.crypto.http_server_enabled = False
            elif line == "ip http secure-server":
                normalized.crypto.https_server_enabled = True

            # Services
            elif line == "no ip source-route":
                normalized.services.ip_source_routing = False
            elif line == "no service finger":
                normalized.services.finger_disabled = True
            elif line == "no service tcp-small-servers":
                normalized.services.small_servers_disabled = True
            elif line == "no cdp run":
                normalized.services.cdp_enabled = False

            # ACL Rules (standard/extended)
            elif line.startswith("access-list ") or line.startswith("ip access-list "):
                # Parse single-line or named ACL
                acl_rule = self._parse_acl_line(line, line_num, raw_line)
                if acl_rule:
                    normalized.acls.append(acl_rule)

            # Interface Sub-block
            elif line.startswith("interface "):
                intf, new_i = self._parse_interface_block(lines, i)
                normalized.interfaces.append(intf)
                i = new_i
                continue

            # VTY Line Sub-block
            elif line.startswith("line vty "):
                vty, new_i = self._parse_vty_block(lines, i)
                vty_blocks.append(vty)
                i = new_i
                continue

            # Console Line Sub-block
            elif line.startswith("line con "):
                new_i = self._parse_console_block(lines, i, normalized)
                i = new_i
                continue

            i += 1

        normalized.management.vty_lines = vty_blocks
        return normalized

    def _parse_acl_line(self, line: str, line_num: int, raw_line: str) -> Optional[ACLRule]:
        parts = line.split()
        if len(parts) < 3:
            return None
        # access-list 10 permit 192.168.1.0 0.0.0.255
        acl_name = parts[1]
        action = "permit" if "permit" in parts else ("deny" if "deny" in parts else "permit")
        return ACLRule(
            acl_name=acl_name,
            action=action,
            protocol=parts[3] if len(parts) > 3 else "ip",
            ref=LineRef(line_start=line_num, line_end=line_num, snippet=raw_line)
        )

    def _parse_interface_block(self, lines: List[str], start_idx: int) -> tuple[InterfaceConfig, int]:
        header = lines[start_idx].strip()
        intf_name = header.replace("interface", "").strip()
        start_line = start_idx + 1
        end_line = start_line

        ip_addr = None
        mask = None
        is_shut = False
        desc = None
        cdp = True

        idx = start_idx + 1
        while idx < len(lines):
            sub = lines[idx].strip()
            # If sub-line does not start with space or starts with top-level keyword, block ends
            if lines[idx] and not lines[idx].startswith(" ") and not lines[idx].startswith("\t"):
                break
            if sub.startswith("!"):
                break
            end_line = idx + 1

            if sub.startswith("ip address "):
                parts = sub.split()
                if len(parts) >= 3 and parts[2].lower() != "dhcp":
                    ip_addr = parts[2]
                if len(parts) >= 4:
                    mask = parts[3]
            elif sub == "shutdown":
                is_shut = True
            elif sub.startswith("description "):
                desc = sub.replace("description", "").strip()
            elif sub == "no cdp enable":
                cdp = False

            idx += 1

        snippet = "\n".join(lines[start_idx:idx])
        intf = InterfaceConfig(
            name=intf_name,
            ip_address=ip_addr,
            subnet_mask=mask,
            is_shutdown=is_shut,
            description=desc,
            cdp_enabled=cdp,
            ref=LineRef(line_start=start_line, line_end=end_line, snippet=snippet)
        )
        return intf, idx - 1

    def _parse_vty_block(self, lines: List[str], start_idx: int) -> tuple[VTYLine, int]:
        header = lines[start_idx].strip()
        vty_range = header.replace("line vty", "").strip()
        start_line = start_idx + 1
        end_line = start_line

        transport = []
        acl = None
        exec_timeout = None

        idx = start_idx + 1
        while idx < len(lines):
            sub = lines[idx].strip()
            if lines[idx] and not lines[idx].startswith(" ") and not lines[idx].startswith("\t"):
                break
            if sub.startswith("!"):
                break
            end_line = idx + 1

            if sub.startswith("transport input "):
                # e.g., transport input ssh, transport input telnet ssh, transport input all, transport input none
                transport = sub.replace("transport input", "").strip().split()
            elif sub.startswith("access-class "):
                parts = sub.split()
                if len(parts) > 1:
                    acl = parts[1]
            elif sub.startswith("exec-timeout "):
                parts = sub.split()
                if len(parts) > 1:
                    try:
                        exec_timeout = int(parts[1])
                    except ValueError:
                        pass

            idx += 1

        snippet = "\n".join(lines[start_idx:idx])
        vty = VTYLine(
            range=vty_range,
            transport_input=transport,
            access_class=acl,
            exec_timeout_minutes=exec_timeout,
            ref=LineRef(line_start=start_line, line_end=end_line, snippet=snippet)
        )
        return vty, idx - 1

    def _parse_console_block(self, lines: List[str], start_idx: int, config: NormalizedConfig) -> int:
        idx = start_idx + 1
        while idx < len(lines):
            sub = lines[idx].strip()
            if lines[idx] and not lines[idx].startswith(" ") and not lines[idx].startswith("\t"):
                break
            if sub.startswith("!"):
                break
            if sub.startswith("exec-timeout "):
                parts = sub.split()
                if len(parts) > 1:
                    try:
                        config.management.console_exec_timeout_minutes = int(parts[1])
                    except ValueError:
                        pass
            idx += 1
        return idx - 1
