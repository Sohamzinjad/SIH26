"""Offline, additive-only CVE reference enrichment.

Additive contract (mirrors the repo's preregistration discipline — see
cve.py docstring): enrichment NEVER changes severity, weight, status,
evidence, remediation, explanation, or the audit score/verdicts. It only
*adds* optional `cves` references to findings pulled from the committed
offline rear cache built deterministically by build_cve_cache.py. Every
reference carries a caveat the product UI must surface verbatim.
"""

from backend.enrichment.cve import (
    enrich_findings,
    load_cve_cache,
    CVE_CACHE_PATH,
)

__all__ = [
    "enrich_findings",
    "load_cve_cache",
    "CVE_CACHE_PATH",
]
