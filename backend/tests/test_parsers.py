from backend.parsers.cisco_ios import CiscoIOSParser
from backend.parsers.fortios import FortiOSParser

def test_cisco_parser():
    sample = """!
version 15.6
hostname Test-Router
aaa new-model
service password-encryption
enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0
snmp-server community secret-str RO 10
logging host 192.168.1.100
ip ssh version 2
line vty 0 4
 transport input ssh
 access-class 10 in
 exec-timeout 5 0
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.0
 description LAN Interface
"""
    parser = CiscoIOSParser()
    cfg = parser.parse(sample)
    
    assert cfg.hostname == "Test-Router"
    assert cfg.auth.aaa_new_model is True
    assert cfg.auth.password_encryption_enabled is True
    assert cfg.auth.enable_secret_configured is True
    assert len(cfg.snmp.communities) == 1
    assert cfg.snmp.communities[0].name == "secret-str"
    assert cfg.crypto.ssh_version == 2
    assert len(cfg.management.vty_lines) == 1
    assert cfg.management.vty_lines[0].transport_input == ["ssh"]
    assert cfg.management.vty_lines[0].exec_timeout_minutes == 5
    assert len(cfg.interfaces) == 1
    assert cfg.interfaces[0].ip_address == "10.0.0.1"

def test_fortios_parser():
    sample = """config system global
    set hostname "Test-FW"
    set admintimeout 10
end
config system interface
    edit "port1"
        set ip 10.10.10.1 255.255.255.0
        set allowaccess ping ssh https
    next
end
config log syslogd setting
    set status enable
    set server "10.10.10.200"
end
"""
    parser = FortiOSParser()
    cfg = parser.parse(sample)

    assert cfg.hostname == "Test-FW"
    assert cfg.management.console_exec_timeout_minutes == 10
    assert len(cfg.interfaces) == 1
    assert cfg.interfaces[0].ip_address == "10.10.10.1"
    assert cfg.logging.enabled is True
    assert "10.10.10.200" in cfg.logging.syslog_servers
