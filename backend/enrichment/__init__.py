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

NOTE on import discipline: this package's `__init__` intentionally performs a
LAZY re-export of `backend.enrichment.cve` (PEP 562 module ``__getattr__``).
Eagerly importing `cve` here would create a circular import:
  backend/schemas/finding.py  ->  backend.enrichment.schemas
  backend.enrichment.cve      ->  backend.schemas.finding
because `cve` imports `FindingDTO` while `finding` is importing the enrichment
schemas. The laziness keeps the additive `cves` field usable on FindingDTO
without forcing the whole enrichment pipeline to load at schema-import time.
"""

from typing import Any, Dict, List

from backend.enrichment.schemas import CVEReferenceDTO

__all__ = ["CVEReferenceDTO", "enrich_findings", "load_cve_cache"]

_imported = False


def _ensure_imported() -> None:
    global _imported
    if not _imported:
        from backend.enrichment import cve as _cve  # circular-safe lazy load
        globals()["enrich_findings"] = _cve.enrich_findings
        globals()["load_cve_cache"] = _cve.enrich_findings  # placeholder, see __getattr__
        globals()["_cve_mod"] = _cve
        _imported = True


def __getattr__(name: str) -> Any:
    if name in ("enrich_findings", "load_cve_cache"):
        _ensure_imported()
        mod = globals()["_cve_mod"]
        if name == "enrich_findings":
            return mod.enrich_findings
        return mod.load_cve_cache
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
