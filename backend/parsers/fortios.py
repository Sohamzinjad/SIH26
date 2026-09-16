import re
from typing import List, Optional, Dict, Any
from backend.parsers.base import BaseConfigParser
from backend.schemas.neutral_config import (
    NormalizedConfig, InterfaceConfig, ACLRule, AuthConfig, SNMPConfig,
    SNMPCommunity, LoggingConfig, CryptoConfig, ManagementAccess, VTYLine,
    ServiceConfig, LineRef
)

class FortiOSParser(BaseConfigParser):
    @property
    def vendor_name(self) -> str:
        return "fortios"

    def parse(self, raw_config: str, filename: str = "fortigate.cfg") -> NormalizedConfig:
        lines = raw_config.splitlines()
        normalized = NormalizedConfig(
            vendor="fortios",
            source_file=filename,
            raw_config=raw_config
        )

        i = 0
        total_lines = len(lines)

        while i < total_lines:
            raw_line = lines[i]
            line = raw_line.strip()
            line_num = i + 1

            if not line or line.startswith("#"):
                i += 1
                continue

            # config system global
            if line == "config system global":
                i = self._parse_system_global(lines, i, normalized)
                continue

            # config system interface
            elif line == "config system interface":
                i = self._parse_interfaces(lines, i, normalized)
                continue

            # config firewall policy
            elif line == "config firewall policy":
                i = self._parse_firewall_policies(lines, i, normalized)
                continue

            # config system snmp community
            elif line == "config system snmp community":
                i = self._parse_snmp_communities(lines, i, normalized)
                continue

            # config log syslogd setting / config log setting
            elif "config log syslogd" in line or line == "config log setting":
                i = self._parse_logging(lines, i, normalized)
                continue

            # config system admin
            elif line == "config system admin":
                i = self._parse_system_admin(lines, i, normalized)
                continue

            i += 1

        return normalized

    def _parse_system_global(self, lines: List[str], start_idx: int, config: NormalizedConfig) -> int:
        idx = start_idx + 1
        start_line = start_idx + 1
        while idx < len(lines):
            line = lines[idx].strip()
            if line == "end":
                break
            if line.startswith("set hostname "):
                config.hostname = line.replace("set hostname", "").strip().replace('"', '')
            elif line.startswith("set admintimeout "):
                parts = line.split()
                if len(parts) > 2:
                    try:
                        timeout = int(parts[2])
                        config.management.console_exec_timeout_minutes = timeout
                        # also simulate VTY timeout
                        config.management.vty_lines.append(
                            VTYLine(
                                range="admin",
                                transport_input=["ssh", "https"],
                                exec_timeout_minutes=timeout,
                                ref=LineRef(line_start=idx+1, line_end=idx+1, snippet=lines[idx])
                            )
                        )
                    except ValueError:
                        pass
            elif "set admin-ssh" in line:
                if "disable" not in line:
                    config.crypto.ssh_enabled = True
            elif "set admin-telnet enable" in line:
                config.crypto.telnet_enabled = True
            idx += 1
        return idx

    def _parse_interfaces(self, lines: List[str], start_idx: int, config: NormalizedConfig) -> int:
        idx = start_idx + 1
        current_intf: Optional[InterfaceConfig] = None
        intf_start = idx

        while idx < len(lines):
            line = lines[idx].strip()
            line_num = idx + 1
            if line == "end":
                if current_intf:
                    config.interfaces.append(current_intf)
                break

            if line.startswith("edit "):
                if current_intf:
                    config.interfaces.append(current_intf)
                intf_name = line.replace("edit", "").strip().replace('"', '')
                intf_start = line_num
                current_intf = InterfaceConfig(
                    name=intf_name,
                    ref=LineRef(line_start=intf_start, line_end=intf_start, snippet=line)
                )

            elif current_intf and line.startswith("set ip "):
                parts = line.split()
                if len(parts) >= 3:
                    current_intf.ip_address = parts[2]
                if len(parts) >= 4:
                    current_intf.subnet_mask = parts[3]

            elif current_intf and line.startswith("set status down"):
                current_intf.is_shutdown = True

            elif current_intf and line.startswith("set allowaccess "):
                access_methods = line.replace("set allowaccess", "").strip().split()
                if "ssh" in access_methods:
                    config.crypto.ssh_enabled = True
                if "telnet" in access_methods:
                    config.crypto.telnet_enabled = True
                if "http" in access_methods:
                    config.crypto.http_server_enabled = True
                if "https" in access_methods:
                    config.crypto.https_server_enabled = True

            elif line == "next":
                if current_intf:
                    current_intf.ref.line_end = line_num
                    config.interfaces.append(current_intf)
                    current_intf = None

            idx += 1
        return idx

    def _parse_firewall_policies(self, lines: List[str], start_idx: int, config: NormalizedConfig) -> int:
        idx = start_idx + 1
        current_policy_id = None
        action = "permit"
        src = None
        dst = None
        pol_start = idx

        while idx < len(lines):
            line = lines[idx].strip()
            line_num = idx + 1
            if line == "end":
                break

            if line.startswith("edit "):
                current_policy_id = line.replace("edit", "").strip()
                pol_start = line_num

            elif line.startswith("set action "):
                act = line.replace("set action", "").strip().lower()
                action = "permit" if act == "accept" else "deny"

            elif line.startswith("set srcaddr "):
                src = line.replace("set srcaddr", "").strip().replace('"', '')

            elif line.startswith("set dstaddr "):
                dst = line.replace("set dstaddr", "").strip().replace('"', '')

            elif line == "next":
                if current_policy_id is not None:
                    snippet = f"edit {current_policy_id} ... action {action}"
                    config.acls.append(
                        ACLRule(
                            acl_name=f"policy_{current_policy_id}",
                            action=action,
                            source=src,
                            destination=dst,
                            ref=LineRef(line_start=pol_start, line_end=line_num, snippet=snippet)
                        )
                    )
                    current_policy_id = None

            idx += 1
        return idx

    def _parse_snmp_communities(self, lines: List[str], start_idx: int, config: NormalizedConfig) -> int:
        idx = start_idx + 1
        config.snmp.enabled = True
        comm_name = "community"
        comm_start = idx

        while idx < len(lines):
            line = lines[idx].strip()
            line_num = idx + 1
            if line == "end":
                break

            if line.startswith("set name "):
                comm_name = line.replace("set name", "").strip().replace('"', '')
                comm_start = line_num

            elif line == "next":
                is_default = comm_name.lower() in ["public", "private"]
                config.snmp.communities.append(
                    SNMPCommunity(
                        name=comm_name,
                        permission="ro",
                        is_default_string=is_default,
                        ref=LineRef(line_start=comm_start, line_end=line_num, snippet=f"community {comm_name}")
                    )
                )

            idx += 1
        return idx

    def _parse_logging(self, lines: List[str], start_idx: int, config: NormalizedConfig) -> int:
        idx = start_idx + 1
        config.logging.enabled = True
        while idx < len(lines):
            line = lines[idx].strip()
            line_num = idx + 1
            if line == "end":
                break
            if line.startswith("set server "):
                server = line.replace("set server", "").strip().replace('"', '')
                config.logging.syslog_servers.append(server)
                config.logging.ref = LineRef(line_start=line_num, line_end=line_num, snippet=line)
            elif line.startswith("set status enable"):
                config.logging.enabled = True
            idx += 1
        return idx

    def _parse_system_admin(self, lines: List[str], start_idx: int, config: NormalizedConfig) -> int:
        idx = start_idx + 1
        while idx < len(lines):
            line = lines[idx].strip()
            if line == "end":
                break
            if line.startswith("edit "):
                config.auth.local_users_count += 1
                user = line.replace("edit", "").strip().replace('"', '').lower()
                if user in ["admin", "root"]:
                    config.auth.weak_or_default_users.append(user)
            elif "password" in line:
                config.auth.password_encryption_enabled = True
            idx += 1
        return idx
