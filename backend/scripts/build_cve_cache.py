"""Deterministic builder for the offline CVE reference cache.

Preregistration discipline (mirrors the repo's chain-verdicts discipline):
  * This script's OUTPUT (backend/cve_cache.json) is the data the validating
    test (backend/tests/test_cve_enrichment.py) checks. Consistent with the
    repo's preregistration rule, cve_cache.json MUST be committed BEFORE this
    build script and BEFORE the validating test; that ordering is asserted in
    git ancestry by the test itself (same mechanism as the chain-verdicts
    preregistration assertions).
  * Deterministic & offline: building the cache requires no network. CVE ids
    are REAL, NVD/Cisco-verifiable ids (CVE-2017-6742 maps the SNMP
    community-string precondition this product's CIS-CISCO-1.4.1/1.4.2/1.4.3
    findings flag). The cache keys are rule ids of FAILED findings only.
  * Additive-only contract (see backend/enrichment/schemas.py): enrichment
    NEVER changes a finding's severity, weight, status, evidence, remediation,
    explanation, or the audit score/verdicts. It only *adds* an optional
    `cves` list. Enriching the same set of findings must produce a
    byte-identical (score, verdicts, counts) result — byte-deterministic.
  * Every environment that builds this cache from the same committed inputs
    MUST produce a byte-identical cve_cache.json (the test asserts this).
"""

import json
import pathlib
from typing import Dict, List

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "backend" / "cve_cache.json"

# rule_id -> [CVE reference entry].
# Real, verifiable Cisco/NVD ids. Caveat strings are surfaced verbatim by the
# product UI next to the reference (see frontend AuditDetailView).
CVES: Dict[str, List[dict]] = {
    "CIS-CISCO-1.4.1": [
        {
            "cve_id": "CVE-2017-6742",
            "title": "Cisco IOS and IOS XE Software SNMP Remote Code Execution Vulnerability",
            "severity": "critical",
            "cvss_base_score": 8.8,
            "source": "Cisco Security Advisory / NVD (offline cache)",
            "advisory_url": "https://nvd.nist.gov/vuln/detail/CVE-2017-6742",
            "caveat": "Offline heuristic enrichment: this finding flags a "
                      "default/weak SNMP read-only community string, which is "
                      "exactly the documented precondition an attacker must "
                      "know (CVE-2017-6742). It does NOT confirm the audited "
                      "device's own IOS version is confirmed exploitable — "
                      "verify the exact IOS release against the linked Cisco "
                      "advisory before acting.",
        }
    ],
    "CIS-CISCO-1.4.2": [
        {
            "cve_id": "CVE-2017-6742",
            "title": "Cisco IOS and IOS XE Software SNMP Remote Code Execution Vulnerability",
            "severity": "critical",
            "cvss_base_score": 8.8,
            "source": "Cisco Security Advisory / NVD (offline cache)",
            "advisory_url": "https://nvd.nist.gov/vuln/detail/CVE-2017-6742",
            "caveat": "Offline heuristic enrichment: this finding flags an "
                      "SNMP community without a restricting ACL, expanding the "
                      "attack surface toward CVE-2017-6742's precondition. It "
                      "does NOT confirm the audited device's own IOS version "
                      "is exploitable — verify the exact IOS release against "
                      "the linked Cisco advisory before acting.",
        }
    ],
    "CIS-CISCO-1.4.3": [
        {
            "cve_id": "CVE-2017-6742",
            "title": "Cisco IOS and IOS XE Software SNMP Remote Code Execution Vulnerability",
            "severity": "critical",
            "cvss_base_score": 8.8,
            "source": "Cisco Security Advisory / NVD (offline cache)",
            "advisory_url": "https://nvd.nist.gov/vuln/detail/CVE-2017-6742",
            "caveat": "Offline heuristic enrichment: this finding flags SNMP "
                      "v1/v2c with a readable community string, the "
                      "precondition CVE-2017-6742 documents. It does NOT "
                      "confirm the audited device's own IOS version is "
                      "exploitable — verify the exact IOS release against the "
                      "linked Cisco advisory before acting.",
        }
    ],
}


def build() -> Dict:
    doc = {
        "generated_by": "backend/scripts/build_cve_cache.py",
        "discipline": (
            "Offline, additive-only, preregistered CVE reference enrichment. "
            "No network calls; real NVD/Cisco-verifiable ids; caveats surfaced "
            "verbatim by the product UI. Enrichment never changes severity, "
            "weight, status, evidence, remediation, explanation, or score/"
            "verdicts."
        ),
        "cves": CVES,
    }
    return doc


def main() -> None:
    payload = json.dumps(build(), indent=2, sort_keys=True) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(payload, encoding="utf-8")
    print(f"Wrote {OUT} ({len(CVES)} rule keys, {sum(len(v) for v in CVES.values())} refs)")


if __name__ == "__main__":
    main()
