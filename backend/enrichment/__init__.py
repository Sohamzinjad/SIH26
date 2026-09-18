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

Import discipline: `backend.schemas.finding` (FindingDTO) references
`CVEReferenceDTO` from this package, and `backend.enrichment.cve` references
`FindingDTO` — a two-node cycle. To keep both importable (this is not an
enrichment API barrier; it is a plain Python import cycle), the submodules do
NOT eagerly import each other. `FindingDTO` carries `cves` as an
`Optional[List["CVEReferenceDTO"]] = None` (stringized, additive-only) and
lazily resolves the type via `from __future__ import annotations`; the public
`enrich_findings`/`load_cve_cache` entrypoints are imported by consumers
(e.g. backend/tests/test_cve_enrichment.py and the audit route) from
`backend.enrichment.cve` directly, keeping schema imports side-effect-free.
"""

from typing import List, Optional
from backend.enrichment.schemas import CVEReferenceDTO

__all__ = ["CVEReferenceDTO", "enrich_findings", "load_cve_cache"]


def enrich_findings(findings: List["FindingDTO"]) -> List["FindingDTO"]:
    """Additive-only: return enriched copies that add an optional `cves` list.

    Never mutates the input; never changes severity/weight/status/evidence/
    remediation/explanation or the audit score/verdicts; only adds an
    optional `cves` list to FAILing findings whose rule_id is in the offline
    cache. See backend/enrichment/cve.py for the implementation + contract.
    """
    from backend.enrichment.cve import enrich_findings as _impl  # lazy, cycle-safe
    return _impl(findings)
