"""
Offline, additive-only CVE reference enrichment.

Design contract (mirrors the repo's preregistration discipline):
  * Additive: enrichment NEVER changes a finding's severity, weight, status,
    evidence, remediation, explanation, or the audit score. It only *adds* an
    optional `cves` list to a finding DTO. Enriching the same set of findings
    must always produce a byte-identical (score, verdicts, counts) result.
  * Offline & verifiable: references come from a committed local cache
    (backend/cve_cache.json) built deterministically by
    backend/scripts/build_cve_cache.py. No network calls, no live API. CVE ids
    are real, NVD/Cisco-verifiable ids. Version applicability is NOT asserted
    here: enrichment is heuristic against the *configuration findings* only,
    and every reference carries a caveat string that the product UI must show.
  * Preregistered: cve_cache.json (the data the test validates) must be
    committed before the validating test, asserted via git ancestry in
    backend/tests/test_cve_enrichment.py - mirroring the chain-verdicts order.
"""

from typing import Dict, List, Optional
from backend.schemas.finding import FindingDTO

CVE_CACHE_PATH = pathlib.Path(__file__).resolve().parent.parent / "cve_cache.json"

class CVEReferenceDTO(BaseModel):
    cve_id: str
    rule_id: str
    title: str
    cvss_base: float
    source: str          # e.g. "Cisco Security Advisory / NVD"
    url: str
    caveat: str          # MUST be surfaced by the product UI next to the ref

    @classmethod
    def from_cache(cls, rule_id: str, entry: dict) -> "CVEReferenceDTO":
        return cls(
            cve_id=entry["cve_id"],
            rule_id=rule_id,
            title=entry.get("title", entry["cve_id"]),
            cvss_base=float(entry.get("cvss_base", 0.0)),
            source=entry.get("source", "offline-cache"),
            url=entry.get("url", f"https://nvd.nist.gov/vuln/detail/{entry['cve_id']}"),
            caveat=entry.get(
                "caveat",
                "Offline heuristic enrichment keyed to configuration findings only; "
                "does not assert version-level exploitability. Verify the exact IOS "
                "release against the linked vendor advisory before acting.",
            ),
        )

@lru_cache(maxsize=1)
def load_cve_cache() -> Dict[str, List[dict]]:
    """rule_id -> [entry,...] loaded from the offline committed cache."""
    if not CVE_CACHE_PATH.exists():
        return {}
    return json.loads(CVE_CACHE_PATH.read_text(encoding="utf-8")).get("cves", {})

def enrich_findings(findings: List[FindingDTO]) -> List[FindingDTO]:
    """
    Additive enrichment: returns NEW DTO objects with an optional `cves` list
    attached (CVEReferenceDTO per matching failing rule). Never mutates the
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
