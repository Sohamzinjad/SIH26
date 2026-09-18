import { DashboardOverview, AuditDetail, AIMapping, FleetSummary, DeviceHistoryResponse, DeviceDriftResponse, AuditTrailVerifyResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const res = await fetch(`${API_BASE}/api/dashboard/overview`);
  if (!res.ok) throw new Error('Failed to load dashboard overview');
  return res.json();
}

export async function uploadConfig(params: { file?: File; rawText?: string; filename?: string }) {
  const formData = new FormData();
  if (params.file) {
    formData.append('file', params.file);
  }
  if (params.rawText) {
    formData.append('raw_text', params.rawText);
  }
  if (params.filename) {
    formData.append('filename', params.filename);
  }

  const res = await fetch(`${API_BASE}/api/audit/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload error' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchAuditDetail(auditId: number): Promise<AuditDetail> {
  const res = await fetch(`${API_BASE}/api/audit/${auditId}`);
  if (!res.ok) throw new Error('Failed to load audit detail');
  return res.json();
}

export async function fetchPendingMappings(): Promise<AIMapping[]> {
  const res = await fetch(`${API_BASE}/api/mappings/pending`);
  if (!res.ok) throw new Error('Failed to load pending AI mappings');
  return res.json();
}

export async function approveAIMapping(mappingId: number, approvedBy: string = 'analyst', editedSchema?: any) {
  const res = await fetch(`${API_BASE}/api/mappings/${mappingId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: approvedBy, edited_schema: editedSchema }),
  });
  if (!res.ok) throw new Error('Failed to approve AI mapping');
  return res.json();
}

export async function rejectAIMapping(mappingId: number) {
  const res = await fetch(`${API_BASE}/api/mappings/${mappingId}/reject`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reject AI mapping');
  return res.json();
}

export function getReportUrl(auditId: number): string {
  return `${API_BASE}/api/reports/${auditId}/html`;
}


export interface FleetBatchFileResult {
  audit_id: number;
  device_id: number;
  hostname: string;
  vendor: string;
  filename: string;
  status: string;
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

export interface FleetBatchResponse {
  total_files: number;
  completed_count: number;
  pending_count: number;
  failed_count: number;
  results: FleetBatchFileResult[];
}

export async function uploadFleetBatch(files: File[]): Promise<FleetBatchResponse> {
  const formData = new FormData();
  files.forEach(f => formData.append("files", f));
  const res = await fetch(`${API_BASE}/api/fleet/batch`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Fleet batch upload failed");
  return res.json();
}

export async function fetchFleetSummary(): Promise<FleetSummary> {
  const res = await fetch(`${API_BASE}/api/fleet/summary`);
  if (!res.ok) throw new Error("Failed to load fleet summary");
  return res.json();
}

export async function fetchDeviceHistory(deviceId: number): Promise<DeviceHistoryResponse> {
  const res = await fetch(`${API_BASE}/api/devices/${deviceId}/history`);
  if (!res.ok) throw new Error('Failed to load device history');
  return res.json();
}

export async function fetchDeviceDrift(deviceId: number): Promise<DeviceDriftResponse> {
  const res = await fetch(`${API_BASE}/api/devices/${deviceId}/drift`);
  if (!res.ok) throw new Error('Failed to load device drift');
  return res.json();
}

export async function waiveFinding(findingId: number, justification: string, waivedBy: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/findings/${findingId}/waive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ justification, waived_by: waivedBy }),
  });
  if (!res.ok) throw new Error('Failed to waive finding');
  return res.json();
}

export async function unwaiveFinding(findingId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/api/findings/${findingId}/unwaive`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to remove waiver');
  return res.json();
}
