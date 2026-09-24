"""
HELD-OUT EVALUATION — real-world configs the rule engine was NOT tuned against.

Provenance
----------
Each config in ``backend/sample_configs/heldout/`` is an unmodified, sanitized
Cisco IOS ``show running-config`` from Batfish's public "Example Network"
(school campus topology), https://github.com/batfish/batfish (Apache License 2.0),
``networks/example/live/configs/``.

They are real enterprise configurations authored by the Batfish maintainers for
network-theoretic testing — NOT crafted to fit this project's CIS/NIST/STIG rules.
Ground-truth labels below were derived by a human reading of each config's actual
text, independently of the rule engine output.

References
----------
- https://github.com/batfish/batfish/blob/master/networks/example/live/configs/as1border1.cfg
- https://github.com/batfish/batfish/blob/master/networks/example/live/configs/as1core1.cfg
- https://github.com/batfish/batfish/blob/master/networks/example/live/configs/as2border1.cfg
- https://github.com/batfish/batfish/blob/master/networks/example/live/configs/as2border2.cfg
- https://github.com/batfish/batfish/blob/master/networks/example/live/configs/as2dist1.cfg
"""
import os
from backend.parsers.vendor_detect import detect_vendor
from backend.parsers import get_parser_for_vendor
from backend.rules.engine import engine
from backend.ai.structural_fallback import extract_structural_mapping
from backend.ai.fingerprint_cache import build_normalized_config_from_mapping

HELDOUT_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_configs", "heldout")

# Ground-truth derived by human inspection of the actual config text.
# 'pass'/'fail' denote the expected status of each controlled check.
# Rules not listed per config are intentionally excluded from the assertion set
# because they cannot be unambiguously decided from the config text.
HELDOUT_LABELS = {
    "as1border1.cfg": {
        # line: "no aaa new-model" -> no centralized AAA
        "CIS-CISCO-1.1.1": "fail",
        # line: "line con 0" exec-timeout 0 0 -> timeout disabled
        "CIS-CISCO-1.1.5": "fail",
        # line: "line vty 0 4" only 'login', no transport input -> telnet default
        "CIS-CISCO-1.1.6": "fail",
        # line vty has no access-class
        "CIS-CISCO-1.1.8": "fail",
        # "no ip http server" + "no ip http secure-server" present
        "CIS-CISCO-1.2.1": "pass",
        # no remote syslog host configured
        "CIS-CISCO-1.3.1": "fail",
        # "service timestamps log datetime msec" present
        "CIS-CISCO-1.3.3": "pass",
        # no snmp-server commands at all -> nothing to restrict
        "CIS-CISCO-1.4.2": "pass",
        # no 'no ip source-route'
        "CIS-CISCO-1.5.1": "fail",
        # no 'no service finger'
        "CIS-CISCO-1.5.2": "fail",
        # no default/weak local usernames
        "NIST-AC-2": "pass",
        # vty lines lack access-class enforcement
        "NIST-AC-3": "fail",
        # vty exec-timeout absent
        "NIST-AC-12": "fail",
        # vty permits default cleartext transport
        "NIST-AC-17": "fail",
        # no centralized audit logging destination
        "NIST-AU-2": "fail",
        # no AAA
        "NIST-IA-2": "fail",
        # no password encryption / enable secret
        "NIST-IA-5": "fail",
        # vty idle timeout exceeds 10 min (disabled)
        "STIG-V-202007": "fail",
        # no encrypted password storage
        "STIG-V-202065": "fail",
        # finger not disabled
        "STIG-V-202049": "fail",
    },
    "as1core1.cfg": {
        "CIS-CISCO-1.1.1": "fail",
        # "logging host 1.1.1.1" and "logging host 2.2.2.2" present
        "CIS-CISCO-1.3.1": "pass",
        # "service timestamps log datetime msec" present
        "CIS-CISCO-1.3.3": "pass",
        "NIST-AC-17": "fail",
        # centralized logging hosts configured
        "NIST-AU-2": "pass",
        "NIST-IA-2": "fail",
        "NIST-IA-5": "fail",
    },
    "as2border1.cfg": {
        # "aaa new-model" + "aaa authentication login privilege-mode" present
        "CIS-CISCO-1.1.1": "pass",
        "CIS-CISCO-1.1.6": "fail",
        "CIS-CISCO-1.1.8": "fail",
        "CIS-CISCO-1.2.1": "pass",
        "CIS-CISCO-1.3.1": "fail",
        "CIS-CISCO-1.3.3": "pass",
        "NIST-AC-17": "fail",
        "NIST-AU-2": "fail",
        # AAA framework active
        "NIST-IA-2": "pass",
        "NIST-IA-5": "fail",
    },
    "as2border2.cfg": {
        "CIS-CISCO-1.1.1": "fail",
        "CIS-CISCO-1.1.6": "fail",
        "CIS-CISCO-1.1.8": "fail",
        "CIS-CISCO-1.2.1": "pass",
        "CIS-CISCO-1.3.1": "fail",
        "CIS-CISCO-1.3.3": "pass",
        "NIST-AC-17": "fail",
        "NIST-AU-2": "fail",
        "NIST-IA-2": "fail",
        "NIST-IA-5": "fail",
    },
    "as2dist1.cfg": {
        "CIS-CISCO-1.1.1": "fail",
        "CIS-CISCO-1.1.6": "fail",
        "CIS-CISCO-1.1.8": "fail",
        "CIS-CISCO-1.2.1": "pass",
        "CIS-CISCO-1.3.1": "fail",
        "CIS-CISCO-1.3.3": "pass",
        "NIST-AC-17": "fail",
        "NIST-AU-2": "fail",
        "NIST-IA-2": "fail",
        "NIST-IA-5": "fail",
    },
}


def test_heldout_real_world_configs():
    total_pos = total_neg = tp = tn = fp = fn = 0
    per_severity = {}

    for fname, expected in HELDOUT_LABELS.items():
        path = os.path.join(HELDOUT_DIR, fname)
        assert os.path.exists(path), f"held-out config missing: {path}"
        with open(path) as f:
            text = f.read()

        vendor, confidence, _ = detect_vendor(text)
        assert vendor == "cisco_ios", f"{fname}: expected cisco_ios, got {vendor} ({confidence})"

        parser = get_parser_for_vendor(vendor)
        cfg = parser.parse(text, fname)
        _, findings, *_ = engine.audit(cfg)
        actual = {fd.rule_id: fd.status for fd in findings}

        for rule_id, want in expected.items():
            got = actual.get(rule_id)
            assert got is not None, f"{fname}: rule {rule_id} not evaluated ({len(findings)} findings)"
            sev = next(fd.severity for fd in findings if fd.rule_id == rule_id)
            sev_stat = per_severity.setdefault(sev, {"tp": 0, "tn": 0, "fp": 0, "fn": 0})

            if want == "pass":
                total_pos += 1
                if got == "pass":
                    tp += 1
                    sev_stat["tp"] += 1
                else:
                    fp += 1
                    sev_stat["fp"] += 1
            else:
                total_neg += 1
                if got == "fail":
                    tn += 1
                    sev_stat["tn"] += 1
                else:
                    fn += 1
                    sev_stat["fn"] += 1

    detection_rate = (tn / total_neg * 100.0) if total_neg else 100.0
    fpr = (fp / total_pos * 100.0) if total_pos else 0.0
    fnr = 100.0 - detection_rate

    print("\n================ HELD-OUT (REAL-WORLD) METRICS ================")
    print(f"Configs: {len(HELDOUT_LABELS)}  (Batfish public Cisco IOS running-configs)")
    print(f"True Positive (expected-pass, got-pass):       {tp}")
    print(f"True Negative (expected-fail, got-fail):       {tn}")
    print(f"False Positive (expected-pass, got-fail):      {fp}")
    print(f"False Negative (expected-fail, got-pass):      {fn}")
    print(f"Detection Rate (Recall):                       {detection_rate:.1f}%")
    print(f"False Positive Rate (FPR):                     {fpr:.1f}%")
    print(f"False Negative Rate (FNR):                     {fnr:.1f}%")
    print("By Severity:")
    for sev in ("critical", "high", "medium", "low"):
        if sev in per_severity:
            s = per_severity[sev]
            denom_neg = s["tn"] + s["fn"]
            denom_pos = s["tp"] + s["fp"]
            det = (s["tn"] / denom_neg * 100.0) if denom_neg else 100.0
            fpr_s = (s["fp"] / denom_pos * 100.0) if denom_pos else 0.0
            print(f"  {sev:<9} detection={det:5.1f}%  FPR={fpr_s:5.1f}%  "
                  f"(tp={s['tp']} tn={s['tn']} fp={s['fp']} fn={s['fn']})")
    print("===============================================================\n")

    assert detection_rate >= 95.0, f"Held-out detection rate too low: {detection_rate}%"
    assert fpr <= 5.0, f"Held-out false positive rate too high: {fpr}%"

def test_dialect_cache_does_not_reuse_device_identity():
    """Two devices sharing a structural dialect (same fingerprint) must NOT
    inherit the first device's cached hostname/IPs. Cache supplies approved
    semantics; value-bearing fields come fresh from the current config."""
    base = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             "..", "sample_configs", "unknown_mesh_node.cfg")).read()
    variant = (base.replace("BRANCH-MESH-09", "BRANCH-LAB-77")
                   .replace("10.88.0.14", "10.99.0.17"))

    _, _, fp_a = detect_vendor(base)
    _, _, fp_b = detect_vendor(variant)
    assert fp_a == fp_b, "test premise: both configs share a structural fingerprint"

    cached = extract_structural_mapping(base)  # simulates approved cache entry
    fresh = extract_structural_mapping(variant)  # simulates current device text

    cache_effective = dict(cached)
    cache_effective["hostname"] = fresh["hostname"]
    cache_effective["interfaces"] = fresh["interfaces"]
    cfg = build_normalized_config_from_mapping(cache_effective, variant, "variant.cfg")

    assert cfg.hostname == "BRANCH-LAB-77", "cache must not leak the first device's hostname"
    ips = {i.ip_address for i in cfg.interfaces}
    assert "10.99.0.17" in ips, f"cache must use the current device's IPs, got {ips}"
    assert "10.88.0.14" not in ips, "stale cached IP leaked into a same-dialect device"
