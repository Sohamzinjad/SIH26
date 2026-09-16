from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class LineRef(BaseModel):
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    snippet: Optional[str] = None

class InterfaceConfig(BaseModel):
    name: str
    ip_address: Optional[str] = None
    subnet_mask: Optional[str] = None
    vlan_id: Optional[int] = None
    is_shutdown: bool = False
    description: Optional[str] = None
    cdp_enabled: Optional[bool] = None
    ref: Optional[LineRef] = None

class ACLRule(BaseModel):
    acl_name: str
    sequence: Optional[int] = None
    action: str  # "permit" or "deny"
    protocol: Optional[str] = None  # "ip", "tcp", "udp", "icmp", etc.
    source: Optional[str] = None
    destination: Optional[str] = None
    port: Optional[str] = None
    ref: Optional[LineRef] = None

class AuthConfig(BaseModel):
    aaa_new_model: bool = False
    enable_secret_configured: bool = False
    enable_password_configured: bool = False
    password_encryption_enabled: bool = False
    local_users_count: int = 0
    weak_or_default_users: List[str] = Field(default_factory=list)
    login_block_configured: bool = False
    ref: Optional[LineRef] = None

class SNMPCommunity(BaseModel):
    name: str
    permission: str  # "ro" or "rw"
    acl_name: Optional[str] = None
    is_default_string: bool = False  # True for "public", "private"
    ref: Optional[LineRef] = None

class SNMPConfig(BaseModel):
    enabled: bool = False
    communities: List[SNMPCommunity] = Field(default_factory=list)
    snmpv3_configured: bool = False
    v3_users: List[str] = Field(default_factory=list)
    contact: Optional[str] = None
    location: Optional[str] = None
    ref: Optional[LineRef] = None

class LoggingConfig(BaseModel):
    enabled: bool = False
    syslog_servers: List[str] = Field(default_factory=list)
    trap_level: Optional[str] = None  # e.g., "informational", "debugging"
    buffered_enabled: bool = False
    timestamps_enabled: bool = False
    ref: Optional[LineRef] = None

class CryptoConfig(BaseModel):
    ssh_enabled: bool = False
    ssh_version: Optional[int] = None
    telnet_enabled: bool = False
    rsa_key_size: Optional[int] = None
    http_server_enabled: bool = False
    https_server_enabled: bool = False
    ref: Optional[LineRef] = None

class VTYLine(BaseModel):
    range: str  # "0 4", "0 15", etc.
    transport_input: List[str] = Field(default_factory=list)  # ["ssh"], ["telnet"], ["all"]
    access_class: Optional[str] = None
    exec_timeout_minutes: Optional[int] = None
    ref: Optional[LineRef] = None

class ManagementAccess(BaseModel):
    vty_lines: List[VTYLine] = Field(default_factory=list)
    console_exec_timeout_minutes: Optional[int] = None
    ref: Optional[LineRef] = None

class ServiceConfig(BaseModel):
    cdp_enabled: bool = True
    ip_source_routing: bool = True
    finger_disabled: bool = False
    small_servers_disabled: bool = False
    ref: Optional[LineRef] = None

class NormalizedConfig(BaseModel):
    vendor: str = "unknown"  # "cisco_ios", "fortios", "juniper_junos", "unknown"
    hostname: str = "router"
    os_version: Optional[str] = None
    interfaces: List[InterfaceConfig] = Field(default_factory=list)
    acls: List[ACLRule] = Field(default_factory=list)
    auth: AuthConfig = Field(default_factory=AuthConfig)
    snmp: SNMPConfig = Field(default_factory=SNMPConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    crypto: CryptoConfig = Field(default_factory=CryptoConfig)
    management: ManagementAccess = Field(default_factory=ManagementAccess)
    services: ServiceConfig = Field(default_factory=ServiceConfig)
    source_file: str = "running-config.cfg"
    raw_config: str = ""
    parse_timestamp: datetime = Field(default_factory=datetime.utcnow)
    unparsed_blocks: List[str] = Field(default_factory=list)
