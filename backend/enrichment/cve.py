"""Offline, additive-only CVE reference enrichment logic.

Mirrors the repo's preregistration discipline (see backend/enrichment/
__init__.py docstring and backend/enrichment/schemas.py): enrichment is
ALWAYS additive-only and byte-deterministic with respect to (score, verdicts,
counts). It never mutates finding fields that feed the score or verdicts; it
only *adds* an optional `cves` list to a finding DTO when (a) the finding is
a FAIL and (b) the committed offline cache has a real CVE reference for that
finding's rule id.

Pipeline contract:
  * enrich_findings takes a list of FindingDTO and returns a NEW list of
    FindingDTO objects, each carrying an optional `cves` list. The input
    findings are never mutated (they are read-only inputs).
  * A finding is enriched IFF:
        status == "fail" AND rule_id is present in the offline cache.
    Otherwise the returned DTO simply omits the cves list (None).
  * score/verdict/count-affecting fields (severity, weight, status,
    remediation, explanation, evidence) are copied through byte-identically.
  * No network calls. CVE ids are real NVD/Cisco-verifiable ids from the
    cache. Every reference carries a caveat surfaced verbatim by the UI.
"""

from typing import Dict, List, Optional

from backend.enrichment.schemas import CVEReferenceDTO
from backend.schemas.finding import FindingDTO, EvidenceModel


def load_cve_cache() -> Dict[str, List[dict]]:
    """Load the committed offline CVE cache keyed by rule_id -> [entry, ...]."""
    import pathlib
    import json

    cache_path = pathlib.Path(__file__).resolve().parent.parent / "cve_cache.json"
    if not cache_path.exists():
        return {}
    try:
        data = json.loads(cache_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    return data.get("cves", {})


def enrich_findings(findings: List[FindingDTO]) -> List[FindingDTO]:
    """Additive-only: return enriched copies that add an optional `cves` list.

    This function NEVER modifies the input findings and NEVER changes a
    finding's severity, weight, status, remediation, explanation, evidence,
    or the audit score/verdicts — adding enrichment must always produce a
    byte-identical (score, verdicts, counts) result.
    """
    cache = load_cve_cache()
    enriched: List[FindingDTO] = []
    for f in findings:
        refs: Optional[List[CVEReferenceDTO]] = None
        hits = cache.get(f.rule_id)
        if hits and f.status == "fail":
            refs = [CVEReferenceDTO.from_cache(f.rule_id, e) for e in hits]
        enriched.append(
            FindingDTO(
                id=f.id,
                rule_id=f.rule_id,
                framework=f.framework,
                title=f.title,
                severity=f.severity,
                weight=f.weight,
                status=f.status,
                evidence=f.evidence,
                remediation=f.remediation,
                explanation=f.explanation,
                cves=refs,
            )
        )
    return enriched
