"""Deterministic structural fallback for unknown-vendor configurations.

When Ollama is unreachable (air-gapped demo), this module extracts the
normalized mapping schema directly from the *actual* config text using generic
key-value, section, and brace-block parsing. Every value fed into the schema is
derived from the real file (not sample data), and interfaces/communities carry
real line references used later for evidence.
"""
import re
import ipaddress
from typing import Dict, Any, List, Optional

DEFAULT_WEAK_USERS = {"admin", "root", "cisco", "guest", "user", "operator"}


def _cidr_or_pair(value: str) -> Optional[tuple[Optional[str], Optional[str]]]:
    value = value.strip().strip('"\'').rstrip(",").rstrip(";")
    if not value or value.lower() in {"dhcp", "none", "auto", "null"}:
        return None
    if ":" in value:
        parts = value.split("/")
        return parts[0], (f"/{parts[1]}" if len(parts) == 2 else None)
    m = re.match(r"^([\d.]+)\s*/\s*(\d{1,2})$", value)
    if m:
        try:
            bits = int(m.group(2))
            ip_obj = ipaddress.ip_address(m.group(1))
            mask = str(ipaddress.ip_network(f"{ip_obj}/{bits}", strict=False).netmask)
            return str(ip_obj), mask
        except ValueError:
            return m.group(1), None
    parts = value.split("/")
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return value, None


def _netmask_to_cidr_bits(mask: str) -> Optional[int]:
    try:
        return int(str(ipaddress.IPv4Network(f"0.0.0.0/{mask}").prefixlen))
    except Exception:
        return None


class _LineBlock:
    __slots__ = ("name", "lines", "line_nums")

    def __init__(self, name: str, line_num: int, raw: str):
        self.name = name
        self.lines: List[str] = [raw]
        self.line_nums: List[int] = [line_num]


def _split_blocks(config_text: str) -> List[_LineBlock]:
    """Splits config into plausible blocks: INI sections, brace blocks,
    FortiOS config/edit blocks, and standalone interface lines."""
    blocks: List[_LineBlock] = []
    stack: List[_LineBlock] = []
    current: Optional[_LineBlock] = None

    for idx, raw in enumerate(config_text.splitlines()):
        line_num = idx + 1
        stripped = raw.strip()
        if not stripped or stripped.startswith(("#", "//", ";")):
            continue

        ini = re.match(r"^\[([^\]]+)\]", stripped)
        if ini:
            current = _LineBlock(ini.group(1).strip().lower(), line_num, stripped)
            blocks.append(current)
            continue

        if stripped.startswith("}"):
            if stack:
                stack.pop()
            current = stack[-1] if stack else None
            continue

        if stack:
            stack[-1].lines.append(stripped)
            stack[-1].line_nums.append(line_num)
            current = stack[-1]
            continue

        if stripped.endswith("{"):
            name = stripped[:-1].strip().lower()
            blk = _LineBlock(name or "block", line_num, stripped)
            blocks.append(blk)
            stack.append(blk)
            current = blk
            continue

        if stripped.startswith("edit "):
            name = stripped.split(None, 1)[1].strip().strip('"')
            blk = _LineBlock(name, line_num, stripped)
            blocks.append(blk)
            current = blk
            continue

        if re.match(r"^interface\s+", stripped, re.IGNORECASE):
            blk = _LineBlock(stripped, line_num, stripped)
            blocks.append(blk)
            current = blk
            continue

        if current is None:
            current = _LineBlock(stripped, line_num, stripped)
            blocks.append(current)
        else:
            current.lines.append(stripped)
            current.line_nums.append(line_num)

    return blocks


def _looks_like_interface(name: str) -> bool:
    low = name.lower()
    return any(
        token in low
        for token in ("interface", "network.port", "radio", "mesh.radio", "wlan", "wireless",
                      "port-", "eth", "ge-", "gigabitethernet",
                      "fastethernet", "tengig", "xe-", "ae", "vlan", "lo0", "loopback",
                      "intf", "port")
    )


def _block_text(block: _LineBlock) -> str:
    return "\n".join(block.lines)


def _extract_hostname(config_text: str, blocks: List[_LineBlock]) -> Optional[str]:
    patterns = [
        r"^(?:set\s+)?hostname(?:\s+setting)?\s+[\"\']?([\w.\-]+)",
        r"(?:device_identifier|identity|device-name|host-name|sysName|node_name)\s*[:=]?\s*[\"\']?([\w.\-]+)",
        r"^set\s+([\w.\-]+)\s*$",
    ]
    for pat in patterns[:2]:
        m = re.search(pat, config_text, re.IGNORECASE | re.MULTILINE)
        if m and m.group(1).lower() not in {"router", "switch", "firewall", "unknown", "mesh"}:
            return m.group(1)
    for block in blocks:
        if not block.name:
            continue
        combined = _block_text(block)
        if combined.upper().startswith("HOSTNAME "):
            m = re.match(r"^hostname\s+[\"\']?([\w.\-]+)", combined, re.IGNORECASE)
            if m:
                return m.group(1)
    return None


def _extract_interfaces(blocks: List[_LineBlock]) -> List[Dict[str, Any]]:
    interfaces: List[Dict[str, Any]] = []
    seen = set()

    for block in blocks:
        name_guess = None
        if _looks_like_interface(block.name):
            name_guess = block.name
        joined = _block_text(block)

        addr = None
        shutdown = False
        intf_lines: List[int] = block.line_nums[:]

        if name_guess and "address" in joined.lower():
            m = re.search(
                r"(?:address|ip\s*address|ip_address|ip-address|ip\s*=)\s*[:=]?\s*[\"\']?"
                r"([\d./]+)[\"\']?", joined, re.IGNORECASE
            )
            if m:
                addr = _cidr_or_pair(m.group(1))

        if name_guess and addr is None:
            m = re.search(r"ip\s*\n\s*([\d.]+)", joined, re.IGNORECASE)
            m = re.search(r"(?:^|\n)\s*ip\s+([\d.]+)\s+([\d.]+)", joined)
            if m:
                addr = (m.group(1), m.group(2))

        if "shutdown" in joined.lower() or "status down" in joined.lower() or "enabled = false" in joined.lower() or "admin_status.*down" in joined.lower():
            shutdown = True

        if addr is not None:
            ip, mask = addr
            key = (name_guess or block.name, ip)
            if key in seen:
                continue
            seen.add(key)
            interfaces.append({
                "name": name_guess or block.name,
                "ip_address": ip,
                "subnet_mask": mask,
                "is_shutdown": shutdown,
                "line_start": intf_lines[0] if intf_lines else None,
                "line_end": intf_lines[-1] if intf_lines else None,
                "snippet": "\n".join(block.lines[:8]),
            })
        elif name_guess and not block.name.isdigit():
            ip_only = None
            m = re.search(r"[\"\']?\s*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s*/[0-9]{1,2}", joined)
            if m:
                ip_only = m.group(1)
            if ip_only and (name_guess, ip_only) not in seen:
                seen.add((name_guess, ip_only))
                interfaces.append({
                    "name": name_guess,
                    "ip_address": ip_only,
                    "subnet_mask": None,
                    "is_shutdown": shutdown,
                    "line_start": intf_lines[0] if intf_lines else None,
                    "line_end": intf_lines[-1] if intf_lines else None,
                    "snippet": "\n".join(block.lines[:8]),
                })

    return interfaces


def _extract_auth(config_text: str) -> Dict[str, Any]:
    low = config_text.lower()
    aaa = bool(re.search(r"\baaa\b|aaa[- ]new-model|set aaa|authentication.*(radius|tacacs)", low))
    weak: List[str] = []
    for m in re.finditer(
        r"(?:username|local_operator|operator|set\s+contact|user\s*=\s*)[=:\s\"\']*([\w.\-]+)",
        config_text, re.IGNORECASE | re.MULTILINE
    ):
        user = m.group(1).lower()
        if user in DEFAULT_WEAK_USERS and user not in weak:
            weak.append(user)
    encryption = bool(
        re.search(r"password-encryption|password_encryption|service password-encryption|\benable secret|\bsecret\s+[0-9a-f]{9,}|\bpassword .*? encrypted", low)
    )
    if "unencrypted" in low or "plaintext" in low or "in clear" in low or "password123" in low:
        encryption = False
    return {
        "aaa_enabled": aaa,
        "weak_or_default_users": weak,
        "password_encryption": encryption,
    }


def _extract_snmp(config_text: str, blocks: List[_LineBlock]) -> Dict[str, Any]:
    low = config_text.lower()
    enabled = bool(re.search(r"snmp|query_identifier|telemetry\.snmp", low)) and not bool(
        re.search(r"no\s+snmp-server|snmp\s+off|snmp disabled|status disabled", low)
    )
    communities: List[Dict[str, Any]] = []

    for block in blocks:
        combined = _block_text(block)
        clow = combined.lower()
        if "snmp" not in clow:
            continue
        if block.name and block.name.isdigit():
            continue
        perm = "ro"
        if "rw" in clow or "read-write" in clow or "read_write" in clow or "write" in clow:
            perm = "rw"
        for m in re.finditer(
            r"(?:community(?:_string|_name|_id)?|query_identifier|query_id|\bname)\s*=\s*[\"\']?([\w.\-]+)[\"\']?",
            combined, re.IGNORECASE
        ):
            name = m.group(1)
            is_default = name.lower() in {"public", "private"}
            if not any(c["name"] == name for c in communities):
                communities.append({
                    "name": name,
                    "permission": perm,
                    "is_default": is_default,
                    "line_start": block.line_nums[0],
                    "line_end": block.line_nums[-1],
                    "snippet": "\n".join(block.lines[:6]),
                })

    for m in re.finditer(r"snmp-server community\s+([\w.\-]+)\s+(\S+)", config_text, re.IGNORECASE):
        name, perm_raw = m.group(1), m.group(2)
        perm = "ro" if perm_raw.lower() == "ro" else "rw"
        if not any(c["name"] == name for c in communities):
            communities.append({
                "name": name,
                "permission": perm,
                "is_default": name.lower() in {"public", "private"},
            })

    return {"enabled": enabled, "communities": communities}


def _kv_enabled(config_text: str, keys: List[str]) -> Optional[bool]:
    """Returns True/False when a `key = "enabled"/"disabled"` style setting is found."""
    for m in re.finditer(r"([a-zA-Z_\-\.]+)\s*=\s*[\"\'](enabled|disabled|enable|disable)[\"\']", config_text):
        for key in keys:
            if re.search(rf"(^|[_\-\s]){re.escape(key)}($|[_\-\s])", m.group(1)):
                return m.group(2).startswith("en")
    return None


def _extract_crypto(config_text: str) -> Dict[str, Any]:
    low = config_text.lower()

    ssh_kv = _kv_enabled(config_text, ["ssh", "admin_ssh"])
    telnet_kv = _kv_enabled(config_text, ["telnet", "admin_telnet", "console_telnet"])
    http_kv = _kv_enabled(config_text, ["http", "http_admin", "http_server"])
    https_kv = _kv_enabled(config_text, ["https", "https_admin", "https_server"])

    ssh = bool(re.search(r"\bssh\b|ssh2|sshv2|secure[-_ ]?shell|set\s+admin-ssh\s+enable|ip\s+ssh\s+version", low))
    telnet = bool(re.search(r"telnet|set\s+admin-telnet\s+enable", low))
    http = bool(re.search(r"ip\s+http\s+server|http_server|http[-_ ]?admin|http\s+server|set\s+http\s+enable|set\s+webadmin\s+http", low))
    https = bool(re.search(r"https|ip\s+http\s+secure-server|http[-_ ]?secure-server|set\s+https\s+enable|webadmin\s+https", low))

    if ssh_kv is not None:
        ssh = ssh_kv
    if telnet_kv is not None:
        telnet = telnet_kv
    if http_kv is not None:
        http = http_kv
    if https_kv is not None:
        https = https_kv

    if re.search(r"no\s+ip\s+http\s+server|set\s+http\s+disable|http\s+disabled", low):
        http = False
    if re.search(r"no\s+ssh|set\s+ssh\s+disable|ssh\s+disabled", low):
        ssh = False

    return {
        "ssh_enabled": ssh,
        "telnet_enabled": telnet,
        "http_enabled": http,
        "https_enabled": https,
    }


def _extract_management(config_text: str) -> Dict[str, Any]:
    low = config_text.lower()
    acl_applied = bool(re.search(r"access-?list|access[-_ ]class|restrict[-_ ]access|mgmt[-_ ]acl|set\s+acl\s+enable", low))
    timeout: Optional[int] = None
    m = re.search(r"(?:session[-_ ]?timeout|exec[-_ ]timeout|idle[-_ ]?limit|admintimeout|set\s+timeout)\s*[:=]?\s*(\d+)", low)
    if m:
        timeout = int(m.group(1))
    return {"session_timeout_minutes": timeout, "access_list_applied": acl_applied}


def extract_structural_mapping(config_text: str) -> Dict[str, Any]:
    """Builds a normalized mapping schema genuinely derived from the config text."""
    blocks = _split_blocks(config_text)
    interfaces = _extract_interfaces(blocks)
    auth = _extract_auth(config_text)
    snmp = _extract_snmp(config_text, blocks)
    crypto = _extract_crypto(config_text)
    management = _extract_management(config_text)
    hostname = _extract_hostname(config_text, blocks)

    signals = 0
    if hostname:
        signals += 1
    if interfaces:
        signals += 1
    if snmp["communities"]:
        signals += 1
    if any(auth.values()):
        signals += 1
    if crypto["ssh_enabled"] or crypto["telnet_enabled"] or crypto["http_enabled"]:
        signals += 1
    confidence = round(min(0.92, 0.42 + 0.09 * signals), 2)

    style_hint = "custom_whitebox"
    if re.search(r"[a-z]+\s*{", config_text[:500]):
        style_hint = "brace_structured_whitebox"
    elif re.search(r"^\[[^\]]+\]", config_text, re.MULTILINE):
        style_hint = "key_value_section_whitebox"
    elif re.search(r"^\s*set\s+", config_text, re.MULTILINE):
        style_hint = "set_command_whitebox"

    return {
        "vendor_guessed": style_hint,
        "confidence": confidence,
        "hostname": hostname or "whitebox-device",
        "interfaces": interfaces,
        "auth": auth,
        "snmp": snmp,
        "crypto": crypto,
        "management": management,
        "_derived_from": "structural_fallback",
    }