import os
import pytest
from backend.parsers.cisco_ios import CiscoIOSParser
from backend.parsers.fortios import FortiOSParser
from backend.rules.engine import engine
from backend.ai.structural_fallback import extract_structural_mapping
from backend.ai.fingerprint_cache import build_normalized_config_from_mapping

def _whitebox_builder(content, filename):
    proposal = extract_structural_mapping(content)
    return build_normalized_config_from_mapping(proposal, content, filename)

LABELLED_CORPUS = [
    {
        "file": "backend/sample_configs/cisco_compliant.cfg",
        "vendor": "cisco_ios",
        "expected_posture": "compliant",
        "must_pass": ["CIS-CISCO-1.1.1", "CIS-CISCO-1.1.6", "CIS-CISCO-1.4.1", "CIS-CISCO-1.1.7"],
        "must_fail": []
    },
    {
        "file": "backend/sample_configs/cisco_non_compliant.cfg",
        "vendor": "cisco_ios",
        "expected_posture": "non_compliant",
        "must_pass": [],
        "must_fail": ["CIS-CISCO-1.1.1", "CIS-CISCO-1.1.6", "CIS-CISCO-1.4.1", "CIS-CISCO-1.2.1"]
    },
    {
        "file": "backend/sample_configs/cisco_partially_compliant.cfg",
        "vendor": "cisco_ios",
        "expected_posture": "partially_compliant",
        "must_pass": ["CIS-CISCO-1.1.1", "CIS-CISCO-1.1.2", "CIS-CISCO-1.1.3", "CIS-CISCO-1.3.1", "CIS-CISCO-1.5.1"],
        "must_fail": ["CIS-CISCO-1.1.6", "CIS-CISCO-1.1.8", "CIS-CISCO-1.4.1", "CIS-CISCO-1.4.2"]
    },
    {
        "file": "backend/sample_configs/fortios_compliant.cfg",
        "vendor": "fortios",
        "expected_posture": "compliant",
        "must_pass": ["CIS-FORTI-1.1.1", "CIS-FORTI-1.1.2", "CIS-FORTI-1.3.1"],
        "must_fail": []
    },
    {
        "file": "backend/sample_configs/fortios_non_compliant.cfg",
        "vendor": "fortios",
        "expected_posture": "non_compliant",
        "must_pass": [],
        "must_fail": ["CIS-FORTI-1.1.1", "CIS-FORTI-1.1.2", "CIS-FORTI-1.3.1"]
    },
    {
        "file": "backend/sample_configs/fortios_partially_compliant.cfg",
        "vendor": "fortios",
        "expected_posture": "partially_compliant",
        "must_pass": ["CIS-FORTI-1.1.2"],
        "must_fail": ["CIS-FORTI-1.1.1", "CIS-FORTI-1.1.3", "CIS-FORTI-1.3.1"]
    },
    {
        "file": "backend/sample_configs/unknown_whitebox.cfg",
        "vendor": "whitebox_fallback",
        "expected_posture": "non_compliant",
        "must_pass": [],
        "must_fail": ["NIST-AC-17", "NIST-AC-3", "NIST-IA-5", "NIST-AU-2"]
    },
    {
        "file": "backend/sample_configs/unknown_mesh_node.cfg",
        "vendor": "whitebox_fallback",
        "expected_posture": "non_compliant",
        "must_pass": [],
        "must_fail": ["NIST-AC-17", "NIST-AC-3", "NIST-IA-5", "NIST-AU-2"]
    }
]

def test_labelled_corpus_evaluation():
    total_expected_pass = 0
    actual_pass = 0
    total_expected_fail = 0
    actual_fail = 0
    per_severity = {}
    per_config = []

    cisco_p = CiscoIOSParser()
    forti_p = FortiOSParser()

    for item in LABELLED_CORPUS:
        with open(item["file"]) as f:
            content = f.read()

        if item["vendor"] == "cisco_ios":
            cfg = cisco_p.parse(content, filename=item["file"])
        elif item["vendor"] == "fortios":
            cfg = forti_p.parse(content, filename=item["file"])
        else:
            cfg = _whitebox_builder(content, item["file"])

        score, findings, _, _, _ = engine.audit(cfg)

        finding_map = {f.rule_id: f.status for f in findings}
        sev_map = {f.rule_id: f.severity for f in findings}
        cfg_stats = {"file": item["file"], "score": score, "tp": 0, "tn": 0, "fp": 0, "fn": 0}

        for rule in item["must_pass"]:
            total_expected_pass += 1
            sev = per_severity.setdefault(sev_map.get(rule, "unknown"), {"tp": 0, "tn": 0, "fp": 0, "fn": 0})
            if finding_map.get(rule) == "pass":
                actual_pass += 1
                sev["tp"] += 1
                cfg_stats["tp"] += 1
            else:
                sev["fp"] += 1
                cfg_stats["fp"] += 1

        for rule in item["must_fail"]:
            total_expected_fail += 1
            sev = per_severity.setdefault(sev_map.get(rule, "unknown"), {"tp": 0, "tn": 0, "fp": 0, "fn": 0})
            if finding_map.get(rule) == "fail":
                actual_fail += 1
                sev["tn"] += 1
                cfg_stats["tn"] += 1
            else:
                sev["fn"] += 1
                cfg_stats["fn"] += 1

        per_config.append(cfg_stats)

    detection_rate = (actual_fail / total_expected_fail) * 100.0 if total_expected_fail else 100.0
    false_negative_rate = 100.0 - detection_rate
    false_positive_rate = ((total_expected_pass - actual_pass) / total_expected_pass) * 100.0 if total_expected_pass else 0.0

    print(f"\n================ CORPUS EVALUATION METRICS ================")
    print(f"# Configs: {len(LABELLED_CORPUS)}")
    print(f"True Detection Rate (Recall): {detection_rate:.1f}%")
    print(f"False Positive Rate (FPR):    {false_positive_rate:.1f}%")
    print(f"False Negative Rate (FNR):    {false_negative_rate:.1f}%")
    print(f"Total Controls Verified:      {total_expected_pass + total_expected_fail}")
    print("Per Config (score | TP TN FP FN):")
    for c in per_config:
        print(f"  {c['score']:5.1f}%  {c['tp']} {c['tn']} {c['fp']} {c['fn']}  {os.path.basename(c['file'])}")
    print("By Severity Tier:")
    for sev in ("critical", "high", "medium", "low"):
        s = per_severity.get(sev, {"tp": 0, "tn": 0, "fp": 0, "fn": 0})
        denom_neg = s["tn"] + s["fn"]
        denom_pos = s["tp"] + s["fp"]
        det = (s["tn"] / denom_neg * 100.0) if denom_neg else 100.0
        fp_r = (s["fp"] / denom_pos * 100.0) if denom_pos else 0.0
        print(f"  {sev:<9} detection={det:5.1f}%  FPR={fp_r:5.1f}%  "
              f"(tp={s['tp']} tn={s['tn']} fp={s['fp']} fn={s['fn']})")
    print(f"===========================================================\n")

    assert detection_rate >= 95.0, f"Detection rate too low: {detection_rate}%"
    assert false_positive_rate <= 5.0, f"False positive rate too high: {false_positive_rate}%"

def test_structural_fallback_is_derived_from_input():
    """Two distinct unknown-vendor configs must yield distinct real values (not fixed sample data)."""
    cfg_a = open("backend/sample_configs/unknown_whitebox.cfg").read()
    cfg_b = cfg_a.replace("172.16.10.1", "192.168.200.7").replace("admin", "operator").replace("telnet", "ssh")

    m_a = extract_structural_mapping(cfg_a)
    m_b = extract_structural_mapping(cfg_b)

    ip_a = {i["name"] for i in m_a["interfaces"]}
    assert any(i["ip_address"] == "172.16.10.1" for i in m_a["interfaces"])
    assert any(i["ip_address"] == "192.168.200.7" for i in m_b["interfaces"])
    assert m_a["hostname"] == m_b["hostname"]  # hostname unchanged => config-derived, expected
    assert "admin" in m_a["auth"]["weak_or_default_users"]
    assert m_b["auth"]["weak_or_default_users"] and "operator" in m_b["auth"]["weak_or_default_users"]