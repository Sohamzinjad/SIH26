export interface Evidence {
  line_start?: number;
  line_end?: number;
  snippet?: string;
}

export interface Finding {
  id?: number;
  rule_id: string;
  framework: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  weight: number;
  status: 'pass' | 'fail';
  evidence?: Evidence;
  remediation?: string;
  explanation?: string;
}

export interface AttackPath {
  id?: number;
  chain_id: string;
  name: string;
  severity: string;
  narrative: string;
  finding_rule_ids: string[];
  break_rule_id: string;
  break_why: string;
  is_active: boolean;
}

export interface SingleFixRecommendation {
  rule_id: string;
  rule_title: string;
  remediation: string;
  paths_broken_count: number;
  paths_broken_names: string[];
  remaining_paths_count: number;
  impact_score: number;
  why: string;
}

export interface AuditSummary {
  id: number;
  device_id?: number;
  hostname: string;
  vendor: string;
  score: number;
  pass_count: number;
  fail_count: number;
  total_count: number;
  status: string;
  started_at: string;
  completed_at?: string;
  attack_paths_count: number;
}

export interface AuditDetail {
  audit: AuditSummary;
  findings: Finding[];
  attack_paths: AttackPath[];
  single_fix_recommendation?: SingleFixRecommendation;
}

export interface AIMapping {
  id: number;
  audit_id?: number;
  fingerprint_hash: string;
  vendor_guessed: string;
  confidence: number;
  status: string;
  proposed_schema: any;
  config_sample?: string;
}

export interface DashboardOverview {
  total_devices: number;
  total_audits: number;
  average_score: number;
  critical_failures: number;
  high_failures: number;
  active_attack_chains: number;
  pending_ai_proposals: number;
  devices: Array<{
    id: number;
    hostname: string;
    vendor: string;
    latest_audit_id?: number;
    score?: number;
    status: string;
    last_audited?: string;
  }>;
  recent_audits: Array<{
    id: number;
    hostname: string;
    vendor: string;
    score: number;
    fail_count: number;
    status: string;
    started_at: string;
  }>;
}

export interface FleetDeviceResult {
  audit_id: number;
  device_id: number;
  hostname: string;
  vendor: string;
  filename: string;
  status: string;                  // COMPLETED | PENDING_AI_MAPPING
  compliance_score: number;
  total_findings: number;
  failed_findings: number;
  attack_paths_count: number;
  ai_mapping_pending: boolean;
  detection_method: string;
  mapping_source: string;
  latency_ms: number;
  error?: string;
}

export interface FleetRuleAggregate {
  rule_id: string;
  title: string;
  severity: string;
  framework: string;
  devices_present: number;
  devices_failing: number;
  compliance_pct: number;
}

export interface FleetAttackChainAggregate {
  chain_id: string;
  name: string;
  severity: string;
  devices_present: number;
  devices_active: number;
  firing_pct: number;
}

export interface FleetSummary {
  total_devices: number;
  by_rule: FleetRuleAggregate[];
  by_chain: FleetAttackChainAggregate[];
}

export interface DeviceRuleRun {
  rule_id: string;
  status: 'pass' | 'fail';
  severity: string;
}

export interface DeviceAuditRecord {
  audit_id: number;
  started_at: string;
  completed_at?: string | null;
  vendor: string;
  compliance_score: number;
  status: string;
  fail_count: number;
  total_count: number;
  per_rule: DeviceRuleRun[];
}

export interface DeviceHistoryResponse {
  device_id: number;
  hostname: string;
  audits: DeviceAuditRecord[];
}

export type DriftTransition = 'same' | 'improved' | 'worsened' | 'new' | 'disappeared';

export interface DeviceDriftRule {
  rule_id: string;
  title?: string | null;
  framework?: string | null;
  previous_status?: string | null;
  current_status?: string | null;
  transition: DriftTransition;
}

export interface DeviceDriftResponse {
  device_id: number;
  hostname: string;
  comparable: boolean;
  detail: string;
  previous_audit_id?: number | null;
  current_audit_id?: number | null;
  drift_score: number;
  same_count: number;
  improved_count: number;
  worsened_count: number;
  new_count: number;
  disappeared_count: number;
  rules: DeviceDriftRule[];
}
