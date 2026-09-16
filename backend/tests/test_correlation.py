from backend.parsers.cisco_ios import CiscoIOSParser
from backend.rules.engine import engine
from backend.correlation.attack_paths import correlate_attack_paths
from backend.correlation.remediation import compute_single_key_fix

def test_attack_path_correlation():
    with open("backend/sample_configs/cisco_non_compliant.cfg") as f:
        content = f.read()

    parser = CiscoIOSParser()
    cfg = parser.parse(content)
    score, findings, pass_cnt, fail_cnt, total_cnt = engine.audit(cfg)

    attack_paths = correlate_attack_paths(findings)
    assert len(attack_paths) >= 2

    chain_ids = [p.chain_id for p in attack_paths]
    assert "CHAIN-NET-MGMT-TAKEOVER" in chain_ids
    assert "CHAIN-NET-SNMP-RECON-WRITE" in chain_ids

    # Single fix recommendation must be calculated
    fix = compute_single_key_fix(findings, attack_paths)
    assert fix is not None
    assert fix.paths_broken_count >= 1
    assert len(fix.paths_broken_names) >= 1
    assert fix.remediation != ""
