"""Offline, additive-only CVE reference enrichment.

Design contract (mirrors the repo's preregistration discipline):
  * Additive: enrichment NEVER changes a finding's severity, weight, status,
    evidence, remediation, explanation, or the audit score. It only *adds* an
    optional `cves` list to a finding DTO. Enriching the same set of findings
    must always produce a byte-identical (score, verdicts, counts) result.
  * Offline & verifiable: CVE references come from a committed local cache
    (backend/cve_cache.json) built deterministically by
    backend/scripts/build_cve_cache.py. No network calls, no live API, no
    invented CVE ids -- every id is a real, NVD/Cisco-verifiable id.
  * Caveated & heuristic: enrichment maps a *configuration condition* this
    finding flags to a published advisory's documented precondition. It never
    claims the audited device's own version is confirmed exploitable, and
    every reference carries a `caveat` string that the product UI MUST surface
    verbatim next to the reference.
"""

from backend.enrichment.schemas import CVEReferenceDTO
from backend.enrichment.cve import enrich_findings, load_cve_cache

__all__ = ["CVEReferenceDTO", "enrich_findings", "load_cve_cache"]
