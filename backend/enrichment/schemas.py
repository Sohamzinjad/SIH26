from typing import List, Optional
from pydantic import BaseModel

class CVEReferenceDTO(BaseModel):
    """Additive-only CVE reference attached to a finding.

    Always carries a caveat that must be surfaced by the product UI next to
    the reference (see frontend AuditDetailView). The reference is heuristic:
    it says a real, published Cisco advisory maps to the *configuration
    condition* this finding flags — it never claims the audited device's own
    version is confirmed exploitable.
    """
    cve_id: str
    cve_title: str
    severity: str            # matches finding severity vocabulary (critical/high/...)
    cvss_base_score: str
    source: str              # e.g. "Cisco Security Advisory / NVD (offline cache)"
    advisory_url: str
    caveat: str              # REQUIRED; surfaced verbatim in the UI

class EnrichedFindingMixin(BaseModel):
    cves: Optional[List[CVEReferenceDTO]] = None
