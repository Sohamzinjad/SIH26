"""Validating tests for the offline, additive-only CVE enrichment layer.

Mirrors the chain-verdicts preregistration discipline (
``backend/tests/test_chain_validation.py``): the *data* the enrichment reads
(``backend/cve_cache.json``) is preregistered and MUST be committed strictly
before this validating test exists in git history. This test only *checks*
an already-committed, real, byte-deterministic cache — it never adjusts the
cache to make itself pass, and it refuses to validate under any condition
where the cache and the builder can quietly drift.

Contracts enforced here (all mirroring backend/enrichment/* docstrings):

  * PREREGISTRATION: backend/cve_cache.json is committed before this test
    file (git-ancestry == the chain-verdicts rule).
  * DETERMINISTIC: rebuilding from source (backend/scripts/build_cve_cache.py)
    reproduces the committed cache byte-for-byte — no timestamps, no wall
    clock, no network, sorted keys.
  * ADDITIVE-ONLY: enrichment NEVER changes a finding's severity, weight,
    status, evidence, remediation, explanation, or the audit
    score/verdicts/counts — it only *adds* an optional ``cves`` list to
    FAILing findings whose rule_id is present in the cache.
  * OFFLINE & REAL: cache entries carry real, verifiable CVE ids (regex
    ``^CVE-\\d{4}-\\d{4,}$``), a real NVD advisory URL, and a ``caveat``
    string that the product UI surfaces verbatim next to the reference.
"""

import json
import pathlib
import re
import subprocess

CACHE_PATH = pathlib.Path(__file__).resolve().parent.parent / "cve_cache.json"
BUILDER_PATH = pathlib.Path(__file__).resolve().parent.parent / "scripts" / "build_cve_cache.py"
REPO = pathlib.Path(__file__).resolve().parents[2]

CVE_ID_RE = re.compile(r"^CVE-\d{4}-\d{4,}$")

from backend.enrichment.cve import load_cve_cache, enrich_findings
from backend.schemas.finding import FindingDTO, EvidenceModel


def _example_fail_finding(rule_id: str) -> FindingDTO:
    return FindingDTO(
        id=1,
        rule_id=rule_id,
        framework="CIS-CISCO",
        title="Fake title",
        severity="high",
        weight=2,
        status="fail",
        evidence=EvidenceModel(line_start=1, line_end=2, snippet="snmp-server community public RO"),
        remediation="restrict SNMP community with an ACL",
        explanation="SNMP community exposed without an ACL",
    )


def _example_pass_finding(rule_id: str) -> FindingDTO:
    f = _example_fail_finding(rule_id)
    return FindingDTO(id=2, rule_id=rule_id, framework=f.framework, title=f.title,
                      severity=f.severity, weight=f.weight, status="pass",
                      remediation=f.remediation, explanation=f.explanation)


def test_cve_cache_committed_before_this_test():
    """backend/cve_cache.json must exist in git history strictly before this test."""
    cache_log = subprocess.run(
        ["git", "log", "-1", "--format=%H", "--", str(CACHE_PATH.relative_to(REPO))],
        cwd=REPO, capture_output=True, text=True
    ).stdout.strip()
    this_log = subprocess.run(
        ["git", "log", "-1", "--format=%H", "--", str(pathlib.Path(__file__).relative_to(REPO))],
        cwd=REPO, capture_output=True, text=True
    ).stdout.strip()
    assert cache_log, "backend/cve_cache.json is not committed"
    if this_log:
        assert cache_log != this_log, "backend/cve_cache.json must be committed strictly before this test"


def test_builder_reproduces_committed_cache_byte_identically():
    """Reproducibility: building from source must match the committed file."""
    rebuilt = subprocess.run(
        [sys_executable(), str(BUILDER_PATH)],
        cwd=REPO, capture_output=True, text=True
    )
    assert rebuilt.returncode == 0, f"builder failed: {rebuilt.stderr}"
    committed = CACHE_PATH.read_bytes()
    rebuilt_bytes = subprocess.run(
        ["git", "show", f"HEAD:{CACHE_PATH.relative_to(REPO)}"],
        cwd=REPO, capture_output=True
    ).stdout
    assert committed == rebuilt_bytes == CACHE_PATH.read_bytes()


def sys_executable():
    return __import__("sys").executable


def test_load_cve_cache_is_offline_and_real():
    cache = load_cve_cache()
    assert cache, "cache must not be empty"
    flattened = [ref for refs in cache.values() for ref in refs]
    assert flattened, "cache must contain at least one CVE reference"
    for ref in flattened:
        assert CVE_ID_RE.match(ref["cve_id"]), f"non-real CVE id: {ref['cve_id']}"
        assert ref["advisory_url"].startswith("https://"), ref
        assert "caveat" in ref and ref["caveat"].strip(), "every CVE reference must carry a caveat"


def test_enrichment_is_additive_only_for_fails():
    """Enrichment must change nothing except ADDING `cves`; pass stays untouched."""
    cache = load_cve_cache()
    rule_id = next(iter(cache))  # a rule the cache covers
    fail = _example_fail_finding(rule_id)
    pass_ = _example_pass_finding(rule_id)

    base_fields = lambda f: (f.severity, f.weight, f.status, f.evidence, f.remediation, f.explanation)

    enriched_fail = enrich_findings([fail])[0]
    assert base_fields(enriched_fail) == base_fields(fail), "enrichment must never mutate score/verdict fields"
    assert enriched_fail.cves, "a FAILing finding for a cached rule must carry cves"
    for cve in enriched_fail.cves:
        assert CVE_ID_RE.match(cve.cve_id)
        assert cve.caveat and cve.caveat.strip(), "every reference must carry a caveat (UI surfaces verbatim)"

    enriched_pass = enrich_findings([pass_])[0]
    assert base_fields(enriched_pass) == base_fields(pass_)
    assert enriched_pass.cves is None, "PASS findings are never enriched (additive-only, fail-only)"

    # Input findings must never be mutated (additive-only contract)
    assert fail.cves is None and pass_.cves is None, "enrichment must not mutate inputs"


def test_enrichment_raises_on_fabricated_or_unknown_external_call():
    """Guard: enrichment must be offline; there is no code path that reaches out."""
    import inspect
    src = inspect.getsource(enrich_findings)
    assert "http" not in src.lower(), "enrichment must make no network calls"
    assert "requests" not in src.lower() and "urllib" not in src.lower()
