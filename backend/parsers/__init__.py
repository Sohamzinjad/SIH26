from backend.parsers.base import BaseConfigParser
from backend.parsers.cisco_ios import CiscoIOSParser
from backend.parsers.fortios import FortiOSParser
from backend.parsers.vendor_detect import detect_vendor, compute_structural_fingerprint

PARSERS = {
    "cisco_ios": CiscoIOSParser(),
    "fortios": FortiOSParser(),
}

def get_parser_for_vendor(vendor: str) -> BaseConfigParser:
    return PARSERS.get(vendor)
