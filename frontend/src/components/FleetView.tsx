import React, { useState } from 'react';
import {
  uploadFleetBatch,
  fetchFleetSummary,
  FleetBatchResponse,
} from '../api/client';
import {
  FleetDeviceResult,
} from '../types';
import type { FleetSummary } from '../types';
import { Reveal } from './Reveal';
import { Upload, Search, Download, Filter, FileSpreadsheet } from 'lucide-react';

interface FleetViewProps {
  onBatchCompleted?: (batch: FleetBatchResponse) => void;
  onBatchFailed?: (msg: string) => void;
  onSelectAudit?: (auditId: number) => void;
}

export const FleetView: React.FC<FleetViewProps> = ({ onBatchCompleted, onBatchFailed, onSelectAudit }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<FleetBatchResponse | null>(null);
  const [summary, setSummary] = useState<FleetSummary | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
  };

  const runBatch = async () => {
    if (!files.length) return;
    setIsUploading(true);
    setError(null);
    try {
      const batch = await uploadFleetBatch(files);
      setLastBatch(batch);
      onBatchCompleted?.(batch);
      try {
        setSummary(await fetchFleetSummary());
      } catch { /* best effort */ }
    } catch (e: any) {
      setError(e?.message || 'Fleet batch failed');
      onBatchFailed?.(e?.message || 'Fleet batch failed');
    } finally {
      setIsUploading(false);
    }
  };

  const openAudit = (auditId: number) => {
    onSelectAudit?.(auditId);
  };

  const exportExecutiveCSV = () => {
    if (!lastBatch || !lastBatch.results.length) return;
    const headers = [
      'Hostname/File',
      'Vendor',
      'Status',
      'Compliance Score (%)',
      'Total Findings',
      'Failed Findings',
      'Attack Paths Count',
      'Detection Method',
      'Mapping Source',
      'Latency (ms)'
    ];

    const rows = lastBatch.results.map(r => [
      `"${r.hostname}"`,
      `"${r.vendor}"`,
      `"${r.status}"`,
      r.compliance_score,
      r.total_findings,
      r.failed_findings,
      r.attack_paths_count,
      `"${r.detection_method}"`,
      `"${r.mapping_source}"`,
      r.latency_ms
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trinetra_fleet_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered results
  const filteredResults = (lastBatch?.results || []).filter((item) => {
    const matchesSearch =
      item.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendor = vendorFilter === 'ALL' || item.vendor === vendorFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && item.status === 'COMPLETED') ||
      (statusFilter === 'PENDING' && item.status.includes('PENDING')) ||
      (statusFilter === 'FAILED' && (item.status === 'FAILED' || item.error));

    return matchesSearch && matchesVendor && matchesStatus;
  });

  const statusBadge = (item: FleetDeviceResult) => {
    if ((item.status === 'FAILED' || item.error) ) return <span className="badge badge-fail">Failed</span>;
    if (item.status === 'COMPLETED') return <span className="badge badge-pass">Completed</span>;
    return <span className="badge badge-pending">Pending AI</span>;
  };

  const scoreCls = (score: number) =>
    score >= 80 ? 'text-ok' : score >= 60 ? 'text-high' : 'text-crit';

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="kicker mb-3">Fleet-wide posture auditor</div>
            <h1 className="font-display font-bold text-h1 tracking-tight text-ink">
              Bulk archive &amp; infrastructure audit
            </h1>
            <p className="mt-3 max-w-2xl text-body text-muted">
              Upload bulk .zip archives containing multiple device configs to run parallel deterministic audits.
            </p>
          </div>

          {lastBatch && lastBatch.results.length > 0 && (
            <button
              onClick={exportExecutiveCSV}
              className="btn btn-solid"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Executive CSV
            </button>
          )}
        </div>
      </Reveal>

      {error && (
        <div className="banner banner-error">
          {error}
        </div>
      )}

      {/* Bulk Upload Dropzone */}
      <Reveal delayMs={40}>
        <div className="card p-6 sm:p-8">
          <div className="rounded-2xl border-2 border-dashed border-white/15 bg-surface-2/50 p-10 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-accent-soft border border-accent/40 flex items-center justify-center">
              <Upload className="w-6 h-6 text-accent-hover" />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-ink">Select a bulk archive (.zip) or drag config files here</div>
              <div className="mt-1 text-caption text-faint">Multiple configs are extracted and audited in parallel</div>
            </div>
            <input
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="fleet-file-input"
            />
            <label
              htmlFor="fleet-file-input"
              className="btn btn-primary cursor-pointer inline-flex"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Browse files {files.length > 0 && `(${files.length} selected)`}
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-5 flex justify-between items-center">
              <span className="text-caption text-muted">{files.length} configuration payloads ready for fleet processing.</span>
              <button
                onClick={runBatch}
                disabled={isUploading}
                className="btn btn-primary"
              >
                {isUploading ? 'Auditing fleet…' : 'Run parallel fleet audit'}
              </button>
            </div>
          )}
        </div>
      </Reveal>

      {/* Results Section & Filters */}
      {lastBatch && (
        <Reveal delayMs={60}>
          <div className="mb-6">
            <div className="kicker mb-2">Fleet batch results</div>
            <h2 className="section-title">
              {lastBatch.total_files} devices processed
              <span className="ml-4 inline-flex items-center gap-2 align-middle">
                <span className="badge badge-pass align-middle">{lastBatch.completed_count} completed</span>
                <span className="badge badge-pending align-middle">{lastBatch.pending_count} pending</span>
                {lastBatch.failed_count > 0 && (
                  <span className="badge badge-fail align-middle">{lastBatch.failed_count} failed</span>
                )}
              </span>
            </h2>
          </div>

          <div className="card p-4 sm:p-5 space-y-4">
            {/* Search & Multi-criteria Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hostname or filename..."
                  className="field pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-faint" />
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="field !w-auto"
                >
                  <option value="ALL">All Vendors</option>
                  <option value="cisco_ios">Cisco IOS</option>
                  <option value="fortios">FortiOS</option>
                  <option value="juniper_junos">Juniper JunOS</option>
                  <option value="unknown">Unknown Dialects</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="field !w-auto"
                >
                  <option value="ALL">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending AI Mapping</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Device Hostname</th>
                    <th>Vendor</th>
                    <th>Status</th>
                    <th>Compliance Score</th>
                    <th>Failed Controls</th>
                    <th>Attack Paths</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((d: FleetDeviceResult, idx: number) => (
                    <tr key={idx} className="row-hover">
                      <td className="font-semibold">{d.hostname}</td>
                      <td className="text-muted uppercase">{d.vendor}</td>
                      <td>{statusBadge(d)}</td>
                      <td className={`font-bold ${scoreCls(d.compliance_score)}`}>{d.compliance_score}%</td>
                      <td className="font-bold text-crit">{d.failed_findings}</td>
                      <td className="font-bold">{d.attack_paths_count}</td>
                      <td className="text-right">
                        {d.audit_id ? (
                          <button
                            onClick={() => openAudit(d.audit_id!)}
                            className="text-[12px] font-semibold text-accent-hover hover:text-white inline-flex items-center gap-1"
                          >
                            Inspect <span aria-hidden>&rarr;</span>
                          </button>
                        ) : (
                          <span className="text-caption text-faint">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        No devices match current search or filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
};