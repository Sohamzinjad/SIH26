import { DashboardOverview, AuditDetail, AIMapping } from '../types';

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
