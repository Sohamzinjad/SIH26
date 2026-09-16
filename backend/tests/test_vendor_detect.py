from backend.parsers.vendor_detect import detect_vendor

def test_detect_cisco():
    cisco_cfg = """!
version 15.6
hostname Router-1
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.0
line vty 0 4
 transport input ssh
"""
    vendor, conf, fp = detect_vendor(cisco_cfg)
    assert vendor == "cisco_ios"
    assert conf >= 0.5
    assert len(fp) == 64

def test_detect_fortios():
    forti_cfg = """config system global
    set hostname "FortiGate-01"
end
config system interface
    edit "port1"
        set ip 192.168.1.1 255.255.255.0
    next
end
"""
    vendor, conf, fp = detect_vendor(forti_cfg)
    assert vendor == "fortios"
    assert conf >= 0.5

def test_detect_unknown():
    unknown_cfg = """;; Custom NOS Switch Configuration
[hardware]
chassis_id = 9988
ports = 48
"""
    vendor, conf, fp = detect_vendor(unknown_cfg)
    assert vendor == "unknown"
