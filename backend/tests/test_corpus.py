import pytest
from backend.parsers.cisco_ios import CiscoIOSParser
from backend.parsers.fortios import FortiOSParser
from backend.rules.engine import engine

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
    }
]

def test_labelled_corpus_evaluation():
    total_expected_pass = 0
    actual_pass = 0
    total_expected_fail = 0
    actual_fail = 0

    cisco_p = CiscoIOSParser()
    forti_p = FortiOSParser()

    for item in LABELLED_CORPUS:
        with open(item["file"]) as f:
            content = f.read()

        parser = cisco_p if item["vendor"] == "cisco_ios" else forti_p
        cfg = parser.parse(content, filename=item["file"])
        score, findings, _, _, _ = engine.audit(cfg)

        finding_map = {f.rule_id: f.status for f in findings}

        for rule in item["must_pass"]:
            total_expected_pass += 1
            if finding_map.get(rule) == "pass":
                actual_pass += 1

        for rule in item["must_fail"]:
            total_expected_fail += 1
            if finding_map.get(rule) == "fail":
                actual_fail += 1

    detection_rate = (actual_fail / total_expected_fail) * 100.0 if total_expected_fail else 100.0
    false_negative_rate = 100.0 - detection_rate
    false_positive_rate = ((total_expected_pass - actual_pass) / total_expected_pass) * 100.0 if total_expected_pass else 0.0

    print(f"\n================ CORPUS EVALUATION METRICS ================")
    print(f"True Detection Rate (Recall): {detection_rate:.1f}%")
    print(f"False Positive Rate (FPR):    {false_positive_rate:.1f}%")
    print(f"False Negative Rate (FNR):    {false_negative_rate:.1f}%")
    print(f"Total Controls Verified:      {total_expected_pass + total_expected_fail}")
    print(f"===========================================================\n")

    assert detection_rate >= 95.0, f"Detection rate too low: {detection_rate}%"
    assert false_positive_rate <= 5.0, f"False positive rate too high: {false_positive_rate}%"
