from typing import List, Optional
from pydantic import BaseModel


class CVEReferenceDTO(BaseModel):
    """Additive-only CVE reference attached to a finding.

    Constraint contract (mirrors the repo's preregistration discipline — the
    same discipline the chain-verdicts preregistration already enforces):

      * ADDITIVE-ONLY: enrichment never changes a finding's severity, weight,
        status, evidence, remediation, explanation, or the audit score /
        verdicts. It only *adds* an optional `cves` list to a finding DTO.
        Enriching the same set of findings must always produce a byte-identical
        (score, verdicts, counts) result.
      * OFFLINE & VERIFIABLE: CVE references come from a committed local cache
        (backend/cve_cache.json) built deterministically by
        backend/scripts/build_cve_cache.py. No network calls, no live API; no
        invented CVE ids — every id is a real, NVD/Cisco-verifiable id.
      * CAVEATED & HEURISTIC: enrichment maps a configuration *condition* this
        finding flags to a published advisory's documented precondition. It
        never asserts the audited device's own version is confirmed
        exploitable. Every reference MUST carry a `caveat` string that the
        product UI surfaces verbatim next to the reference (see frontend
        AuditDetailView).
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
                "Offline heuristic enrichment keyed to configuration findings "
                "only; does not assert the device's own version is confirmed "
                "exploitable. Verify the exact IOS release against the linked "
                "vendor advisory.",
            ),
        )
