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
