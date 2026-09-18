import ipaddress
import re
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.models.mapping import MappingCache, AIMapping
from backend.models.audit_trail import AuditTrailEntry
from backend.schemas.neutral_config import (
    NormalizedConfig, InterfaceConfig, AuthConfig, SNMPConfig,
    SNMPCommunity, CryptoConfig, ManagementAccess, VTYLine, LineRef
)

def lookup_cached_mapping(db: Session, fingerprint_hash: str) -> Optional[Dict[str, Any]]:
    """Returns approved mapping if fingerprint was previously audited and approved."""
    cached = db.query(MappingCache).filter(MappingCache.fingerprint_hash == fingerprint_hash).first()
    if cached:
        return cached.mapping_data
    return None

def save_approved_mapping(
    db: Session,
    fingerprint_hash: str,
    vendor_name: str,
    mapping_data: Dict[str, Any],
    approved_by: str = "analyst"
) -> MappingCache:
    """Stores human-verified mapping in cache and records an audit log entry."""
    # Check if existing
    existing = db.query(MappingCache).filter(MappingCache.fingerprint_hash == fingerprint_hash).first()
    if existing:
        existing.mapping_data = mapping_data
        existing.vendor_name = vendor_name
        cache_entry = existing
    else:
        cache_entry = MappingCache(
            fingerprint_hash=fingerprint_hash,
            vendor_name=vendor_name,
            mapping_data=mapping_data
        )
        db.add(cache_entry)

    # Record in audit trail
    trail = AuditTrailEntry(
        action="MAPPING_APPROVED",
        actor=approved_by,
        target_type="mapping_cache",
        details_json={
            "fingerprint": fingerprint_hash,
            "vendor": vendor_name
        }
    )
    db.add(trail)
    db.commit()
    db.refresh(cache_entry)
    return cache_entry

def _split_cidr(value):
    """Splits '10.0.0.1/24' into (ip, netmask). Passes 'ip mask' / bare mask through unchanged."""
    if not value:
        return None, None
    value = str(value).strip()
    m = re.match(r"^([\d.]+)/(\d{1,2})$", value)
    if m:
        ip, bits = m.group(1), int(m.group(2))
        return ip, str(ipaddress.ip_network(f"{ip}/{bits}", strict=False).netmask)
    parts = value.split()
    if len(parts) == 2:
        return parts[0], parts[1]
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", value):
        first_octet = int(value.split(".")[0])
        if first_octet not in (0, 128, 192, 224, 240, 248, 252, 254, 255):
            return value, None
        return None, value
    return None, value


def build_normalized_config_from_mapping(
    mapping_data: Dict[str, Any],
    raw_config: str,
    filename: str = "unknown.cfg"
) -> NormalizedConfig:
    """Converts approved AI mapping JSON into the standard NormalizedConfig model."""
    norm = NormalizedConfig(
        vendor=mapping_data.get("vendor_guessed", "custom_whitebox"),
        hostname=mapping_data.get("hostname", "whitebox-device"),
        source_file=filename,
        raw_config=raw_config
    )

    # Interfaces
    for intf_dict in mapping_data.get("interfaces", []):
        ip, mask = _split_cidr(intf_dict.get("ip_address"))
        if intf_dict.get("subnet_mask"):
            mask = _split_cidr(intf_dict.get("subnet_mask"))[1] or _split_cidr(intf_dict.get("subnet_mask"))[0]
        norm.interfaces.append(
            InterfaceConfig(
                name=intf_dict.get("name", "eth0"),
                ip_address=ip,
                subnet_mask=mask,
                is_shutdown=intf_dict.get("is_shutdown", False),
                ref=LineRef(
                    line_start=intf_dict.get("line_start", 1),
                    line_end=intf_dict.get("line_end", 1),
                    snippet=intf_dict.get("snippet") or f"interface {intf_dict.get('name')}"
                )
            )
        )

    # Auth
    auth_data = mapping_data.get("auth", {})
    norm.auth.aaa_new_model = auth_data.get("aaa_enabled", False)
    norm.auth.password_encryption_enabled = auth_data.get("password_encryption", False)
    norm.auth.weak_or_default_users = auth_data.get("weak_or_default_users", [])

    # SNMP
    snmp_data = mapping_data.get("snmp", {})
    norm.snmp.enabled = snmp_data.get("enabled", False)
    for comm in snmp_data.get("communities", []):
        norm.snmp.communities.append(
            SNMPCommunity(
                name=comm.get("name", "public"),
                permission="ro" if comm.get("permission", "ro") != "rw" else "rw",
                is_default_string=comm.get("is_default", False),
                ref=LineRef(
                    line_start=comm.get("line_start", 1),
                    line_end=comm.get("line_end", 1),
                    snippet=comm.get("snippet") or f"snmp {comm.get('name')}"
                )
            )
        )

    # Crypto
    crypto_data = mapping_data.get("crypto", {})
    norm.crypto.ssh_enabled = crypto_data.get("ssh_enabled", False)
    norm.crypto.telnet_enabled = crypto_data.get("telnet_enabled", False)
    norm.crypto.http_server_enabled = crypto_data.get("http_enabled", False)
    norm.crypto.https_server_enabled = crypto_data.get("https_enabled", False)

    # Management
    mgmt_data = mapping_data.get("management", {})
    timeout = mgmt_data.get("session_timeout_minutes")
    norm.management.vty_lines.append(
        VTYLine(
            range="0 4",
            transport_input=["telnet"] if norm.crypto.telnet_enabled else ["ssh"],
            access_class="MGMT_ACL" if mgmt_data.get("access_list_applied") else None,
            exec_timeout_minutes=timeout,
            ref=LineRef(line_start=1, line_end=4, snippet="management session settings")
        )
    )

    return norm
