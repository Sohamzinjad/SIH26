"""
Offline, additive-only CVE reference enrichment.

Design contract (mirrors the repo's preregistration discipline):
  * Additive: enrichment NEVER changes a finding's severity, weight, status,
    evidence, remediation, explanation, or the audit score. It only *adds* an
    optional `cves` list to a finding DTO. Enriching the same set of findings
    must always produce a byte-identical (score, verdicts, counts, severities,
    weights) result -- enrichment and scoring are independent and order-free.
  * Offline & verifiable: CVE references come from a committed local cache
    (backend/cve_cache.json) built deterministically by
    backend/scripts/build_cve_cache.py. No network calls, no live API, no
    invented ids. Every CVE id is a real, NVD/Cisco-verifiable id.
  * Heuristic & caveated: enrichment maps a *configuration finding* to a real,
    published advisory whose documented precondition matches the configuration
    condition the finding flags. It NEVER asserts the audited device's own
    version is confirmed exploitable. Every reference carries a `caveat`
    string that the product UI MUST surface verbatim next to the reference.
  * Preregistered: cve_cache.json (the data the validating test checks) must
    be committed before the test, asserted via git ancestry in
    backend/tests/test_cve_enrichment.py -- mirroring the chain-verdicts order.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from backend.schemas.finding import FindingDTO
from backend.enrichment.schemas import CVEReferenceDTO

CVE_CACHE_PATH = pathlib.Path(__file__).resolve().parent.parent / "cve_cache.json"
CVE_TARGET_RULES = ("CIS-CISCO-1.4.1", "CIS-CISCO-1.4.2", "CIS-CISCO-1.4.3")


def load_cve_cache() -> Dict[str, List[dict]]:
    """rule_id -> [CVE entries...] from the committed offline cache."""
    if not CVE_CACHE_PATH.exists():
        return {}
    return json.loads(CVE_CACHE_PATH.read_text(encoding="utf-8")).get("cves", {})


def enrich_findings(findings: List[FindingDTO]) -> List[FindingDTO]:
    """
    Additive-only enrichment: returns NEW DTO objects with an optional `cves`
    list attached (CVEReferenceDTO per matching failing rule). Never mutates
    input findings; never alters severity/weight/status/remediation/score.
    """
    cache = load_cve_cache()
    enriched: List[FindingDTO] = []
    for f in findings:
        refs: Optional[List[CVEReferenceDTO]] = None
        rule_hits = cache.get(f.rule_id)
        if rule_hits and f.status == "fail":
            refs = [CVEReferenceDTO.from_cache(f.rule_id, e) for e in rule_hits]
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
