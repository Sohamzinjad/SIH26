"""Deterministic builder for the offline CVE reference cache.

Builds backend/cve_cache.json byte-for-byte reproducibly. The cache is
preregistered: the committed cve_cache.json MUST predate the validating test
(backend/tests/test_cve_enrichment.py) in git history, asserted via the same
git-ancestry discipline the chain-verdicts preregistration already enforces.

This builder is the ONLY source of truth for the cache file. It:
  * makes NO network calls (offline, offline, offline);
  * references REAL, verifiable CVE ids — every id comes from a curated,
    hardcoded mapping of a Cisco Security Advisory / NVD advisory to the
    configuration condition the FAILing finding flags (see
    backend/enrichment/cve.py docstring);
  * is deterministic: running it always produces a byte-identical file
    (no timestamps, no wall-clock dependencies, sorted keys);
  * is additive-only-promise-aware: enrichment itself is defined in
    backend/enrichment/cve.py and is additive-only (see its docstring);
    this script only builds the *data* the enrichment reads.
"""

import json
import pathlib
from typing import Dict, Dict

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "backend" / "cve_cache.json"


def _cache_entry(rule_id: str, cve_id: str, title: str, severity: str,
                 cvss_base_score: float, advisory_url_template: str,
                 caveat: str) -> Dict[str, str]:
    return {
        "rule_id": rule_id,
        "cve_id": cve_id,
        "title": title,
        "severity": severity,
        "cvss_base_score": f"{cvss_base_score:.1f}",
        "advisory_url": advisory_url_template.format(cve_id=cve_id),
        "caveat": caveat,
    }


def build() -> Dict[str, object]:
    """Deterministic, byte-reproducible cache document.

    Every rule_id key maps to a list of CVE references. References are only
    *attached* by enrichment to FAILing findings for those exact rule ids (see
    backend/enrichment/cve.py); nothing in this document may imply a device
    version is confirmed exploitable — every entry carries a caveat.
    """
    caveat_snmp = (
        "Offline heuristic: this CVE reference is attached because the finding "
        "flags a configuration condition (an SNMP read/read-write community "
        "string, or community exposure without an ACL) matching the documented "
        "precondition of the linked Cisco advisory (CVE-2017-6742: SNMP "
        "subsystem buffer overflow requiring knowledge of the community "
        "string). This enrichment NEVER asserts the audited device's own IOS "
        "version is confirmed exploitable — verify the exact IOS release "
        "against the vendor advisory before acting."
    )

    cves = {
        "CIS-CISCO-1.4.1": [
            _cache_entry(
                "CIS-CISCO-1.4.1",
                "CVE-2017-6742",
                "Cisco IOS and IOS XE Software SNMP Remote Code Execution Vulnerability",
                "critical",
                9.8,
                "https://nvd.nist.gov/vuln/detail/{cve_id}",
                caveat_snmp,
            ),
        ],
        "CIS-CISCO-1.4.2": [
            _cache_entry(
                "CIS-CISCO-1.4.2",
                "CVE-2017-6742",
                "Cisco IOS and IOS XE Software SNMP Remote Code Execution Vulnerability",
                "critical",
                9.8,
                "https://nvd.nist.gov/vuln/detail/{cve_id}",
                caveat_snmp,
            ),
        ],
        "CIS-CISCO-1.4.3": [
            _cache_entry(
                "CIS-CISCO-1.4.3",
                "CVE-2017-6742",
                "Cisco IOS and IOS XE Software SNMP Remote Code Execution Vulnerability",
                "critical",
                9.8,
                "https://nvd.nist.gov/vuln/detail/{cve_id}",
                caveat_snmp,
            ),
        ],
    }

    return {
        "generated_by": "backend/scripts/build_cve_cache.py",
        "generated_from_committed_sources": [
            "backend/rules/cis_cisco.py (SNMP community rules 1.4.1/1.4.2/1.4.3)",
        ],
        "discipline": (
            "Offline, additive-only, preregistered CVE enrichment. RO/VERIFY "
            "contract: this cache is the committed data the validating test "
            "checks; the builder output must always be byte-identical. CVE "
            "ids are real and verifiable. Enrichment NEVER changes finding "
            "severity/weight/status/evidence/remediation/explanation or the "
            "audit score/verdicts — it only adds an optional `cves` list."
        ),
        "cves": cves,
    }


def main() -> None:
    payload = json.dumps(build(), indent=2, sort_keys=True) + "\n"
    OUT.write_text(payload, encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
