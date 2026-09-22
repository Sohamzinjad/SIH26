import os
import sys
import io
import json
import zipfile
import pytest
from datetime import datetime
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

os.environ["SIH26_API_KEY"] = "sih26-secret-demo-key"
import backend.auth
backend.auth.API_KEY = "sih26-secret-demo-key"

from backend.config import settings
from backend.database import init_db, engine, SessionLocal, Base
from backend.main import app
from backend.models.device import Device, Audit, Finding, AttackPath
from backend.models.audit_trail import AuditTrailEntry
from backend.models.audit_trail_chain import verify_chain, get_latest_hash, compute_entry_hash

results = {
    "part_a": {},
    "part_b": {},
    "errors": []
}

print("=" * 60)
print("SIH26 FULL REGRESSION AND LIVE DEMO-PATH VERIFICATION")
print("=" * 60)

# Initialize and backfill database
init_db()

# PART A: Automated Regression
print("\n[PART A] Running pytest test suite...")
class PytestCollector:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.skipped = []

    def pytest_runtest_logreport(self, report):
        if report.when == "call":
            if report.passed:
                self.passed.append(report.nodeid)
            elif report.failed:
                self.failed.append((report.nodeid, str(report.longrepr)))
            elif report.skipped:
                self.skipped.append(report.nodeid)

collector = PytestCollector()
exit_code = pytest.main(["backend/tests", "-v", "--tb=short", "-s"], plugins=[collector])

results["part_a"]["pytest_exit_code"] = int(exit_code)
results["part_a"]["passed_count"] = len(collector.passed)
results["part_a"]["failed_count"] = len(collector.failed)
results["part_a"]["skipped_count"] = len(collector.skipped)
results["part_a"]["passed_tests"] = collector.passed
results["part_a"]["failed_tests"] = collector.failed

print(f"\nPytest result: {len(collector.passed)} passed, {len(collector.failed)} failed, {len(collector.skipped)} skipped")
if collector.failed:
    for nodeid, err in collector.failed:
        print(f"FAILED: {nodeid}\n{err}\n")

# PART B: 12-Step Live Demo-Path Walkthrough via TestClient
print("\n[PART B] Executing 12-Step Live Demo-Path Walkthrough...")

client = TestClient(app)
API_KEY = "sih26-secret-demo-key"
AUTH_HEADER = {"Authorization": f"Bearer {API_KEY}"}

# Step 1: Upload known-vendor config
print("\n--- Step 1: Upload Cisco non-compliant config ---")
cisco_cfg = open("backend/sample_configs/cisco_non_compliant.cfg", "r").read()
resp1 = client.post("/api/audit/upload", files={"file": ("cisco_non_compliant.cfg", cisco_cfg, "text/plain")})
s1_ok = resp1.status_code == 200 and resp1.json().get("status") == "COMPLETED" and resp1.json().get("total_findings") > 0
s1_data = resp1.json() if resp1.status_code == 200 else resp1.text
cisco_audit_id = resp1.json().get("audit_id") if s1_ok else None
cisco_device_id = resp1.json().get("device_id") if s1_ok else None
results["part_b"]["step_1"] = {
    "name": "Upload known-vendor config",
    "status": "PASS" if s1_ok else "FAIL",
    "request": {"endpoint": "POST /api/audit/upload", "file": "cisco_non_compliant.cfg"},
    "response": s1_data
}
print(f"Step 1: {'PASS' if s1_ok else 'FAIL'} (audit_id={cisco_audit_id}, score={s1_data.get('compliance_score') if s1_ok else 'N/A'}, findings={s1_data.get('total_findings') if s1_ok else 'N/A'})")

# Step 2: Upload unknown-vendor config
print("\n--- Step 2: Upload unknown-vendor config ---")
# Use a custom structural dialect syntax that has not been cached
uid = datetime.now().strftime('%H%M%S%f')
novel_wb_cfg = f""";; Whitebox Dialect Profile
[system_section_{uid}]
ident_tag = "Edge-Gateway-{uid}"
port_ge0_address = "192.168.99.1/24"
mgmt_telnet_state = "enabled"
mgmt_ssh_state = "disabled"
snmp_community_name = "public"
admin_account_pass = "plaintext:admin123"
session_idle_limit = "3600"
"""
resp2 = client.post("/api/audit/upload", files={"file": (f"novel_edge_{uid}.cfg", novel_wb_cfg, "text/plain")})
s2_ok = resp2.status_code == 200 and resp2.json().get("status") == "PENDING_AI_MAPPING" and resp2.json().get("ai_mapping_pending") is True
s2_data = resp2.json() if resp2.status_code == 200 else resp2.text
ai_mapping_id = resp2.json().get("ai_mapping_id") if s2_ok else None
wb_audit_id = resp2.json().get("audit_id") if s2_ok else None
results["part_b"]["step_2"] = {
    "name": "Upload unknown-vendor config (PENDING_AI_MAPPING)",
    "status": "PASS" if s2_ok else "FAIL",
    "request": {"endpoint": "POST /api/audit/upload", "file": f"novel_edge_{uid}.cfg"},
    "response": s2_data
}
print(f"Step 2: {'PASS' if s2_ok else 'FAIL'} (status={s2_data.get('status') if s2_ok else 'N/A'}, ai_mapping_id={ai_mapping_id})")

# Step 3: Approve mapping with API key auth
print("\n--- Step 3: Approve mapping via API key auth ---")
s3_unauth = client.post(f"/api/mappings/{ai_mapping_id}/approve", json={"approved_by": "analyst", "vendor_name": "Novel-EdgeOS"})
s3_auth = client.post(f"/api/mappings/{ai_mapping_id}/approve", headers=AUTH_HEADER, json={"approved_by": "analyst", "vendor_name": "Novel-EdgeOS"})
s3_ok = (s3_unauth.status_code == 401) and (s3_auth.status_code == 200) and (s3_auth.json().get("status") == "COMPLETED")
results["part_b"]["step_3"] = {
    "name": "Approve AI mapping with API key auth",
    "status": "PASS" if s3_ok else "FAIL",
    "unauthorized_attempt": {"status_code": s3_unauth.status_code, "response": s3_unauth.json() if s3_unauth.status_code != 500 else s3_unauth.text},
    "authorized_attempt": {"status_code": s3_auth.status_code, "response": s3_auth.json() if s3_auth.status_code == 200 else s3_auth.text}
}
print(f"Step 3: {'PASS' if s3_ok else 'FAIL'} (unauth_status={s3_unauth.status_code}, auth_status={s3_auth.status_code})")

# Step 4: Confirm approved config now shows findings and score
print("\n--- Step 4: Confirm approved audit details ---")
resp4 = client.get(f"/api/audit/{wb_audit_id}")
s4_ok = resp4.status_code == 200 and resp4.json().get("audit", {}).get("status") == "COMPLETED" and len(resp4.json().get("findings", [])) > 0
s4_data = resp4.json() if resp4.status_code == 200 else resp4.text
results["part_b"]["step_4"] = {
    "name": "Inspect approved audit details",
    "status": "PASS" if s4_ok else "FAIL",
    "request": {"endpoint": f"GET /api/audit/{wb_audit_id}"},
    "response": {
        "audit_id": wb_audit_id,
        "score": s4_data.get("audit", {}).get("score") if s4_ok else None,
        "status": s4_data.get("audit", {}).get("status") if s4_ok else None,
        "findings_count": len(s4_data.get("findings", [])) if s4_ok else None,
        "attack_paths_count": len(s4_data.get("attack_paths", [])) if s4_ok else None
    }
}
print(f"Step 4: {'PASS' if s4_ok else 'FAIL'} (score={s4_data.get('audit', {}).get('score') if s4_ok else 'N/A'}, findings_count={len(s4_data.get('findings', [])) if s4_ok else 'N/A'})")

# Step 5: Check audit CVE context for Cisco config
print("\n--- Step 5: Check CVE context & caveat on Cisco findings ---")
resp5 = client.get(f"/api/findings/{cisco_audit_id}")
s5_data = resp5.json() if resp5.status_code == 200 else []
cve_findings = [f for f in s5_data if f.get("cves")]
has_caveat = any(any(cve.get("caveat") for cve in f.get("cves", [])) for f in cve_findings)
s5_ok = resp5.status_code == 200 and len(cve_findings) > 0 and has_caveat
results["part_b"]["step_5"] = {
    "name": "Check CVE enrichment context & caveat",
    "status": "PASS" if s5_ok else "FAIL",
    "request": {"endpoint": f"GET /api/findings/{cisco_audit_id}"},
    "enriched_findings_count": len(cve_findings),
    "sample_cve": cve_findings[0]["cves"][0] if cve_findings and cve_findings[0].get("cves") else None
}
print(f"Step 5: {'PASS' if s5_ok else 'FAIL'} (enriched_findings={len(cve_findings)}, sample_cve={cve_findings[0]['cves'][0]['cve_id'] if cve_findings else 'N/A'})")

# Step 6: View attack-path graph data
print("\n--- Step 6: View attack-path graph data ---")
resp6 = client.get(f"/api/audit/{cisco_audit_id}")
s6_data = resp6.json() if resp6.status_code == 200 else {}
attack_paths = s6_data.get("attack_paths", [])
single_fix = s6_data.get("single_fix_recommendation")
s6_ok = resp6.status_code == 200 and len(attack_paths) > 0 and single_fix is not None
results["part_b"]["step_6"] = {
    "name": "View attack-path threat chains and single key fix",
    "status": "PASS" if s6_ok else "FAIL",
    "request": {"endpoint": f"GET /api/audit/{cisco_audit_id}"},
    "attack_paths_count": len(attack_paths),
    "active_chains": [p.get("chain_id") for p in attack_paths if p.get("is_active")],
    "single_fix_recommendation": single_fix
}
print(f"Step 6: {'PASS' if s6_ok else 'FAIL'} (attack_paths={len(attack_paths)}, single_key_fix={single_fix.get('rule_id') if single_fix else 'N/A'})")

# Step 7: Waive one failing finding with API key auth
print("\n--- Step 7: Waive failing finding with API key auth ---")
failing_finding = next((f for f in s5_data if f.get("status") == "fail"), None)
finding_id = failing_finding["id"] if failing_finding else 1
s7_unauth = client.post(f"/api/findings/{finding_id}/waive", json={"justification": "Approved risk exception for legacy maintenance window", "waived_by": "SecOps-Lead"})
s7_auth = client.post(f"/api/findings/{finding_id}/waive", headers=AUTH_HEADER, json={"justification": "Approved risk exception for legacy maintenance window", "waived_by": "SecOps-Lead"})

detail_after_waiver = client.get(f"/api/audit/{cisco_audit_id}").json()
eff_score = detail_after_waiver.get("effective_score")
raw_score = detail_after_waiver.get("audit", {}).get("score")

db = SessionLocal()
latest_trail = db.query(AuditTrailEntry).filter(AuditTrailEntry.action == "FINDING_WAIVED").order_by(AuditTrailEntry.id.desc()).first()
trail_written = latest_trail is not None and latest_trail.target_id == finding_id
db.close()

s7_ok = (s7_unauth.status_code == 401) and (s7_auth.status_code == 200) and trail_written and (eff_score is not None and eff_score > raw_score)
results["part_b"]["step_7"] = {
    "name": "Waive failing finding with governance auth",
    "status": "PASS" if s7_ok else "FAIL",
    "unauthorized_status": s7_unauth.status_code,
    "authorized_status": s7_auth.status_code,
    "raw_score": raw_score,
    "effective_score_after_waiver": eff_score,
    "audit_trail_action": latest_trail.action if latest_trail else None,
    "audit_trail_entry_hash": latest_trail.entry_hash if latest_trail else None
}
print(f"Step 7: {'PASS' if s7_ok else 'FAIL'} (unauth={s7_unauth.status_code}, auth={s7_auth.status_code}, raw={raw_score} -> eff={eff_score}, trail={latest_trail.action if latest_trail else 'NONE'})")

# Step 8: Re-upload modified version to test drift
print("\n--- Step 8: Re-upload modified config & check drift ---")
modified_cisco = cisco_cfg.replace("transport input telnet", "transport input ssh").replace("snmp-server community public RW", "snmp-server community restricted RO")
resp8_up = client.post("/api/audit/upload", files={"file": ("cisco_non_compliant.cfg", modified_cisco, "text/plain")})
resp8_drift = client.get(f"/api/devices/{cisco_device_id}/drift")
s8_drift_data = resp8_drift.json() if resp8_drift.status_code == 200 else {}
s8_ok = (
    resp8_up.status_code == 200 and
    resp8_drift.status_code == 200 and
    s8_drift_data.get("comparable") is True and
    len(s8_drift_data.get("rules", [])) > 0
)
results["part_b"]["step_8"] = {
    "name": "Device drift detection on re-audit",
    "status": "PASS" if s8_ok else "FAIL",
    "drift_response": {
        "device_id": cisco_device_id,
        "comparable": s8_drift_data.get("comparable"),
        "drift_score": s8_drift_data.get("drift_score"),
        "same_count": s8_drift_data.get("same_count"),
        "improved_count": s8_drift_data.get("improved_count"),
        "worsened_count": s8_drift_data.get("worsened_count"),
        "rules_tracked": len(s8_drift_data.get("rules", []))
    }
}
print(f"Step 8: {'PASS' if s8_ok else 'FAIL'} (comparable={s8_drift_data.get('comparable')}, drift_score={s8_drift_data.get('drift_score')}, improved={s8_drift_data.get('improved_count')})")

# Step 9: Fleet batch upload and cross-device summary
print("\n--- Step 9: Fleet batch upload & cross-device summary ---")
zip_buf = io.BytesIO()
with zipfile.ZipFile(zip_buf, "w") as z:
    z.writestr("fleet_r1.cfg", open("backend/sample_configs/cisco_compliant.cfg").read())
    z.writestr("fleet_r2.cfg", open("backend/sample_configs/cisco_partially_compliant.cfg").read())
    z.writestr("fleet_fw1.cfg", open("backend/sample_configs/fortios_compliant.cfg").read())
zip_buf.seek(0)

resp9_batch = client.post("/api/fleet/batch", files=[("zip_files", ("fleet_bundle.zip", zip_buf.getvalue(), "application/zip"))])
resp9_sum = client.get("/api/fleet/summary")
s9_batch_data = resp9_batch.json() if resp9_batch.status_code == 200 else {}
s9_sum_data = resp9_sum.json() if resp9_sum.status_code == 200 else {}
s9_ok = (
    resp9_batch.status_code == 200 and
    s9_batch_data.get("total_files") == 3 and
    resp9_sum.status_code == 200 and
    s9_sum_data.get("total_audits", 0) >= 3 and
    len(s9_sum_data.get("by_rule", [])) > 0
)
results["part_b"]["step_9"] = {
    "name": "Fleet batch upload and aggregate summary",
    "status": "PASS" if s9_ok else "FAIL",
    "batch_result": {
        "total_files": s9_batch_data.get("total_files"),
        "completed_count": s9_batch_data.get("completed_count")
    },
    "fleet_summary": {
        "total_devices": s9_sum_data.get("total_devices"),
        "total_audits": s9_sum_data.get("total_audits"),
        "rules_aggregated": len(s9_sum_data.get("by_rule", [])),
        "chains_aggregated": len(s9_sum_data.get("by_chain", []))
    }
}
print(f"Step 9: {'PASS' if s9_ok else 'FAIL'} (batch_files={s9_batch_data.get('total_files')}, fleet_total_audits={s9_sum_data.get('total_audits')})")

# Step 10: Call audit-trail verify endpoint
print("\n--- Step 10: Audit-trail verify across diverse actions ---")
resp10 = client.get("/api/audit-trail/verify")
s10_data = resp10.json() if resp10.status_code == 200 else {}
s10_ok = resp10.status_code == 200 and s10_data.get("verified") is True and s10_data.get("total_entries", 0) > 0
results["part_b"]["step_10"] = {
    "name": "Audit-trail hash chain verification",
    "status": "PASS" if s10_ok else "FAIL",
    "request": {"endpoint": "GET /api/audit-trail/verify"},
    "response": s10_data
}
print(f"Step 10: {'PASS' if s10_ok else 'FAIL'} (verified={s10_data.get('verified')}, total_entries={s10_data.get('total_entries')})")

# Step 11: Demo-tamper and verify detection
print("\n--- Step 11: Demo-tamper & chain break detection ---")
settings.AUDIT_TRAIL_DEMO_ENABLED = True
resp11_tamper = client.post("/api/audit-trail/demo-tamper", headers=AUTH_HEADER)
resp11_verify = client.get("/api/audit-trail/verify")
s11_tamper_data = resp11_tamper.json() if resp11_tamper.status_code == 200 else {}
s11_verify_data = resp11_verify.json() if resp11_verify.status_code == 200 else {}
s11_ok = (
    resp11_tamper.status_code == 200 and
    resp11_verify.status_code == 200 and
    s11_verify_data.get("verified") is False and
    s11_verify_data.get("first_broken_entry_id") == s11_tamper_data.get("tampered_entry_id")
)
results["part_b"]["step_11"] = {
    "name": "Audit-trail demo-tamper detection",
    "status": "PASS" if s11_ok else "FAIL",
    "tamper_response": s11_tamper_data,
    "verify_after_tamper": s11_verify_data
}
print(f"Step 11: {'PASS' if s11_ok else 'FAIL'} (tampered_id={s11_tamper_data.get('tampered_entry_id')}, detected_broken_id={s11_verify_data.get('first_broken_entry_id')}, reason={s11_verify_data.get('first_broken_reason')})")

# Step 12: Generate HTML compliance report
print("\n--- Step 12: Generate HTML compliance report ---")
resp12 = client.get(f"/api/reports/{cisco_audit_id}/html")
s12_ok = resp12.status_code == 200 and "text/html" in resp12.headers.get("content-type", "") and len(resp12.text) > 500 and "<html" in resp12.text.lower()
results["part_b"]["step_12"] = {
    "name": "HTML compliance report generation",
    "status": "PASS" if s12_ok else "FAIL",
    "request": {"endpoint": f"GET /api/reports/{cisco_audit_id}/html"},
    "content_type": resp12.headers.get("content-type"),
    "content_length_bytes": len(resp12.content),
    "html_snippet": resp12.text[:200]
}
print(f"Step 12: {'PASS' if s12_ok else 'FAIL'} (bytes={len(resp12.content)}, content_type={resp12.headers.get('content-type')})")

with open("verification_results.json", "w") as f:
    json.dump(results, f, indent=2, default=str)

print("\n" + "=" * 60)
print("ALL VERIFICATIONS COMPLETE. Output saved to verification_results.json")
print("=" * 60)
