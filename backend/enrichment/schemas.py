from typing import List, Optional
from pydantic import BaseModel


class CVEReferenceDTO(BaseModel):
    """Additive-only CVE reference attached to a finding.

    Constraint contract (mirrors the repo's preregistration discipline):
      * ADDITIVE-ONLY: enrichment never changes severity, weight, status,
        evidence, remediation, explanation, or the audit score/verdicts. It
        only *adds* an optional `cves` list to a finding DTO. Enriching the
        same set of findings must always produce a byte-identical
        (score, verdicts, counts) result.
      * OFFLINE & VERIFIABLE: references come from a committed local cache
        (backend/cve_cache.json) built deterministically by
        backend/scripts/build_cve_cache.py. No network calls; no invented
        CVE ids -- every id is a real, NVD/Cisco-verifiable id.
      * CAVEATED: enrichment maps a configuration *condition* to a published
        advisory's documented precondition. It never asserts the audited
        device's own version is confirmed exploitable)Skip. Every reference
        MUST carry a caveat string surfaced verbatim by the product UI next
        to the reference (see frontend AuditDetailView).
    """
    cve_id: str
    rule_id: str
    title: str
    severity: str            # matches finding severity vocabulary (critical/high/...)
    cvss_base_score: float
    source: str              # e.g. "Cisco Security Advisory / NVD (offline cache)"
    advisory_url: str
    caveat: str              # REQUIRED; surfaced verbatim in the product UI

    @classmethod
    def from_cache(cls, rule_id: str, entry: dict) -> "CVEReferenceDTO":
        return cls(
            cve_id=entry["cve_id"],
            rule_id=rule_id,
            title=entry.get("title", entry["cve_id"]),
            severity=entry.get("severity", "high"),
            cvss_base_score=float(entry.get("cvss_base_score", 0.0)),
            source=entry.get("source", "offline-cache"),
            advisory_url=entry.get("advisory_url", f"https://nvd.nist.gov/vuln/detail/{entry['cve_id']}"),
            caveat=entry.get(
                "caveat",
                "Offline heuristic enrichment: maps a real published Cisco "
                "advisory to the configuration condition this finding flags. "
                "It does NOT confirm the audited device's own version is "
                "exploitable — verify the exact IOS release against the linked "
                "vendor advisory before acting.",
            ),
        )
