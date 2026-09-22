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

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-[#B9B9B4] pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
            FLEET-WIDE POSTURE AUDITOR
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5">
            Bulk Archive & Infrastructure Audit
          </h1>
          <p className="text-xs text-[#5E5E5E] font-sans mt-1">
            Upload bulk .zip archives containing multiple device configs to run parallel deterministic audits.
          </p>
        </div>

        {lastBatch && lastBatch.results.length > 0 && (
          <button
            onClick={exportExecutiveCSV}
            className="bg-[#171717] hover:bg-[#232323] text-white font-mono text-xs font-bold px-4 py-2.5 trinetra-chamfer flex items-center space-x-2 transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00A86B]" />
            <span>EXPORT EXECUTIVE CSV REPORT</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[#D64545] text-white font-mono text-xs trinetra-chamfer">
          {error}
        </div>
      )}

      {/* Bulk Upload Dropzone */}
      <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-6 space-y-4 shadow-sm font-mono text-xs">
        <div className="border-2 border-dashed border-[#B9B9B4] p-8 text-center space-y-3 bg-[#EAEAE7]">
          <Upload className="w-8 h-8 text-[#171717] mx-auto" />
          <div className="font-bold text-[#171717]">Select bulk archive (.zip) or drag config files here</div>
          <input
            type="file"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="fleet-file-input"
          />
          <label
            htmlFor="fleet-file-input"
            className="inline-block bg-[#171717] hover:bg-[#232323] text-white font-bold px-4 py-2 trinetra-chamfer cursor-pointer transition"
          >
            BROWSE FILES ({files.length} SELECTED)
          </label>
        </div>

        {files.length > 0 && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-[#5E5E5E]">{files.length} configuration payloads ready for fleet processing.</span>
            <button
              onClick={runBatch}
              disabled={isUploading}
              className="bg-[#171717] hover:bg-[#232323] text-white font-bold px-6 py-2.5 trinetra-chamfer text-xs transition shadow-sm disabled:opacity-50"
            >
              {isUploading ? 'AUDITING FLEET...' : 'RUN PARALLEL FLEET AUDIT'}
            </button>
          </div>
        )}
      </div>

      {/* Results Section & Filters */}
      {lastBatch && (
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-5 space-y-4 shadow-sm font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#B9B9B4] pb-3 gap-3">
            <div className="font-bold text-sm text-[#171717]">
              FLEET BATCH RESULTS ({lastBatch.total_files} DEVICES)
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-[#00A86B] font-bold">COMPLETED: {lastBatch.completed_count}</span>
              <span className="text-[#D4A017] font-bold">PENDING: {lastBatch.pending_count}</span>
              {lastBatch.failed_count > 0 && (
                <span className="text-[#D64545] font-bold">FAILED: {lastBatch.failed_count}</span>
              )}
            </div>
          </div>

          {/* Search & Multi-criteria Controls */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E5E5E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hostname or filename..."
                className="w-full bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] pl-8 pr-3 py-1.5 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] px-3 py-1.5 focus:outline-none font-mono"
              >
                <option value="ALL">ALL VENDORS</option>
                <option value="cisco_ios">Cisco IOS</option>
                <option value="fortios">FortiOS</option>
                <option value="juniper_junos">Juniper JunOS</option>
                <option value="unknown">Unknown Dialects</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] px-3 py-1.5 focus:outline-none font-mono"
              >
                <option value="ALL">ALL STATUS</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending AI Mapping</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-[#5E5E5E] border-b border-[#B9B9B4] uppercase bg-[#EAEAE7]">
                <tr>
                  <th className="py-2 px-3">Device Hostname</th>
                  <th className="py-2 px-3">Vendor</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Compliance Score</th>
                  <th className="py-2 px-3">Failed Controls</th>
                  <th className="py-2 px-3">Attack Paths</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9B9B4]/40">
                {filteredResults.map((d: FleetDeviceResult, idx: number) => (
                  <tr key={idx} className="hover:bg-[#EAEAE7]">
                    <td className="py-2.5 px-3 font-bold text-[#171717]">{d.hostname}</td>
                    <td className="py-2.5 px-3 text-[#5E5E5E] uppercase">{d.vendor}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold ${
                        d.status === 'COMPLETED' ? 'bg-[#00A86B]/20 text-[#00A86B]' : 'bg-[#D4A017]/20 text-[#D4A017]'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${
                        d.compliance_score >= 80 ? 'text-[#00A86B]' : d.compliance_score >= 60 ? 'text-[#D4A017]' : 'text-[#D64545]'
                      }`}>
                        {d.compliance_score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#D64545] font-bold">{d.failed_findings}</td>
                    <td className="py-2.5 px-3 font-bold text-[#171717]">{d.attack_paths_count}</td>
                    <td className="py-2.5 px-3 text-right">
                      {d.audit_id ? (
                        <button
                          onClick={() => openAudit(d.audit_id!)}
                          className="text-[11px] font-bold text-[#171717] hover:underline"
                        >
                          Inspect &rarr;
                        </button>
                      ) : (
                        <span className="text-[#5E5E5E] text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#5E5E5E]">
                      No devices match current search or filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

