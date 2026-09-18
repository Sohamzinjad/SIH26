import json
import os
import pathlib

LIST = {"pos": "expected_positive_fired", "neg": "expected_negative_fired"}

VERDICTS_PATH = pathlib.Path(__file__).parent / "expected_chain_verdicts.json"
CHAINS_DIR = pathlib.Path(__file__).parent.parent / "sample_configs" / "chains"

from backend.parsers.cisco_ios import CiscoIOSParser
from backend.rules.engine import engine
from backend.ai.structural_fallback import extract_structural_mapping
from backend.ai.fingerprint_cache import build_normalized_config_from_mapping
from backend.correlation.attack_paths import correlate_attack_paths


def _whitebox_builder(content, filename):
    proposal = extract_structural_mapping(content)
    return build_normalized_config_from_mapping(proposal, content, filename)


def _fired_chain_ids(config):
    _, findings, _, _, _ = engine.audit(config)
    paths = correlate_attack_paths(findings)
    return sorted(p.chain_id for p in paths if p.is_active)


def _run_fixture(filename):
    with open(CHAINS_DIR / filename) as f:
        content = f.read()
    if filename.startswith("CHAIN-WB-"):
        cfg = _whitebox_builder(content, str(CHAINS_DIR / filename))
    else:
        cfg = CiscoIOSParser().parse(content, filename=str(CHAINS_DIR / filename))
    return _fired_chain_ids(cfg)


def test_pre_registered_verdicts_exist_and_predate_this_test():
    """The verdict file must be committed before this test exists in git history."""
    repo = pathlib.Path(__file__).resolve().parents[2]
    import subprocess
    verdict_commit = subprocess.run(
        ["git", "log", "-1", "--format=%H", "--", str(VERDICTS_PATH.relative_to(repo))],
        cwd=repo, capture_output=True, text=True
    ).stdout.strip()
    this_commit = subprocess.run(
        ["git", "log", "-1", "--format=%H", "--", str(pathlib.Path(__file__).relative_to(repo))],
        cwd=repo, capture_output=True, text=True
    ).stdout.strip()
    assert verdict_commit, "expected_chain_verdicts.json is not committed"
    if this_commit:
        assert verdict_commit != this_commit, "verdicts must be committed before the test"


def test_all_chain_fixtures_match_preregistered_verdicts():
    with open(VERDICTS_PATH) as f:
        verdicts = json.load(f)["chains"]

    results = []
    for chain_id, spec in verdicts.items():
        for kind, key in LIST.items():
            fixture = spec[f"{kind}_fixture"]
            expected = spec[key]
            actual = _run_fixture(fixture)
            cast_exp = sorted(expected)
            if actual != cast_exp:
                raise AssertionError(
                    f"MISMATCH on {chain_id} {kind.upper()} fixture {fixture}:\n"
                    f"  expected fired: {cast_exp}\n"
                    f"  actual fired:   {actual}\n"
                    f"  (pre-registered in expected_chain_verdicts.json; "
                    f"refusing to silently adjust verdict or fixture)"
                )
            results.append((chain_id, kind, fixture, actual))
    # Defensive: every chain must appear in verdicts
    assert len(results) == 16