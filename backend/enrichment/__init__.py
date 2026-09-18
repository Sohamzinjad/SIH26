"""Offline, additive-only CVE enrichment for compliance findings.

Constraint contract:
  * enrichment is ADDITIVE-ONLY: it never modifies severity, weight, status,
    remediation, explanation, or any field that affects compliance score or
    attack-path verdicts. It may only ADD informational fields.
  * enrichment is OFFLINE: CVE references come from a committed local cache
    (cve_cache.json) regenerated deterministically by build_cve_cache.py.
    No network calls at audit time; no invented CVE ids.
  * every CVE reference must carry a caveat that is visible in the product UI
    stating that offline enrichment is version-agnostic and must be verified
    against the vendor advisory before treating it as authoritative.
"""

from backend.enrichment.cve import (
    EnrichedCVEDTO,
    enrich_findings,
    load_cve_cache,
    CVE_CACHE_PATH,
)

__all__ = [
    "EnrichedCVEDTO",
    "enrich_findings",
    "load_cve_cache",
    "CVE_CACHE_PATH",
]
