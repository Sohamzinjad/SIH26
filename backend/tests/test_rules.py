from backend.parsers.cisco_ios import CiscoIOSParser
from backend.rules.engine import engine

def test_hardened_cisco_high_score():
    with open("backend/sample_configs/cisco_compliant.cfg") as f:
        content = f.read()

    parser = CiscoIOSParser()
    cfg = parser.parse(content)
    score, findings, pass_cnt, fail_cnt, total_cnt = engine.audit(cfg)

    assert score >= 85.0
    assert pass_cnt > fail_cnt
    assert total_cnt >= 25

def test_vulnerable_cisco_low_score():
    with open("backend/sample_configs/cisco_non_compliant.cfg") as f:
        content = f.read()

    parser = CiscoIOSParser()
    cfg = parser.parse(content)
    score, findings, pass_cnt, fail_cnt, total_cnt = engine.audit(cfg)

    assert score < 50.0
    # Must fail critical checks
    failed_rule_ids = [f.rule_id for f in findings if f.status == "fail"]
    assert "CIS-CISCO-1.1.1" in failed_rule_ids  # aaa new-model
    assert "CIS-CISCO-1.1.6" in failed_rule_ids  # ssh only
    assert "CIS-CISCO-1.4.1" in failed_rule_ids  # default snmp public/private
