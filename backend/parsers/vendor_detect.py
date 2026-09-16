import re
import hashlib
from typing import Tuple, Dict, Any

def compute_structural_fingerprint(config_text: str) -> str:
    """Computes a structural hash of the dialect based on punctuation, keywords, and indentation."""
    structural_tokens = []
    for line in config_text.splitlines()[:150]:  # sample first 150 lines
        stripped = line.strip()
        if not stripped:
            continue
        first_word = stripped.split()[0].lower()
        has_brace = "{" if "{" in stripped else ("}" if "}" in stripped else "")
        has_colon = ":" if ":" in stripped else ""
        has_bang = "!" if stripped.startswith("!") else ""
        structural_tokens.append(f"{has_bang}{first_word}{has_brace}{has_colon}")
    joined = "|".join(structural_tokens)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()

def detect_vendor(config_text: str) -> Tuple[str, float, str]:
    """
    Returns (vendor_name, confidence, fingerprint).
    Vendors: 'cisco_ios', 'fortios', 'juniper_junos', or 'unknown'.
    Confidence is between 0.0 and 1.0.
    """
    fingerprint = compute_structural_fingerprint(config_text)
    scores: Dict[str, int] = {"cisco_ios": 0, "fortios": 0, "juniper_junos": 0}

    lines = [line.strip() for line in config_text.splitlines() if line.strip()]
    sample_text = "\n".join(lines[:200])

    # Cisco IOS markers
    if re.search(r"^!\s*$", sample_text, re.MULTILINE):
        scores["cisco_ios"] += 3
    if re.search(r"^version\s+\d+", sample_text, re.MULTILINE):
        scores["cisco_ios"] += 4
    if re.search(r"^line\s+(vty|con)\s+\d+", sample_text, re.MULTILINE):
        scores["cisco_ios"] += 3
    if re.search(r"^interface\s+(GigabitEthernet|FastEthernet|Ethernet|TenGigabitEthernet|Vlan|Loopback)", sample_text, re.MULTILINE | re.IGNORECASE):
        scores["cisco_ios"] += 3
    if "enable secret" in sample_text or "enable password" in sample_text:
        scores["cisco_ios"] += 2
    if "service password-encryption" in sample_text:
        scores["cisco_ios"] += 2

    # FortiOS markers
    if re.search(r"^config\s+(system|firewall|router|vpn)", sample_text, re.MULTILINE):
        scores["fortios"] += 5
    if re.search(r"^\s*edit\s+[\"\w\d]+", sample_text, re.MULTILINE):
        scores["fortios"] += 3
    if re.search(r"^\s*next\s*$", sample_text, re.MULTILINE):
        scores["fortios"] += 3
    if re.search(r"^\s*end\s*$", sample_text, re.MULTILINE):
        scores["fortios"] += 3
    if "set vdom" in sample_text or "set allowaccess" in sample_text:
        scores["fortios"] += 3

    # Juniper JunOS markers
    if re.search(r"^system\s*\{", sample_text, re.MULTILINE):
        scores["juniper_junos"] += 4
    if re.search(r"^interfaces\s*\{", sample_text, re.MULTILINE):
        scores["juniper_junos"] += 4
    if re.search(r"^firewall\s*\{", sample_text, re.MULTILINE):
        scores["juniper_junos"] += 4
    if sample_text.count("{") > 5 and sample_text.count("}") > 5:
        scores["juniper_junos"] += 2

    best_vendor = max(scores, key=scores.get)
    best_score = scores[best_vendor]

    # Require score threshold for confident match
    if best_score >= 5:
        confidence = min(1.0, round(best_score / 12.0, 2))
        return best_vendor, confidence, fingerprint
    else:
        return "unknown", round(best_score / 12.0, 2), fingerprint
