import React, { useState } from 'react';
import {
  uploadFleetBatch,
  fetchFleetSummary,
  FleetBatchResponse,
} from '../api/client';
import {
  FleetDeviceResult,
  FleetRuleAggregate,
  FleetAttackChainAggregate,
} from '../types';
import type { FleetSummary } from '../types';
import { Upload } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-[#B9B9B4] pb-5">
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

      {/* Results Table if available */}
      {lastBatch && (
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-5 space-y-4 shadow-sm font-mono text-xs">
          <div className="flex justify-between items-center border-b border-[#B9B9B4] pb-3">
            <div className="font-bold text-sm text-[#171717]">FLEET BATCH RESULTS ({lastBatch.total_files} DEVICES)</div>
            <span className="text-[#00A86B] font-bold">COMPLETED: {lastBatch.completed_count} / {lastBatch.total_files}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-[#5E5E5E] border-b border-[#B9B9B4] uppercase">
                <tr>
                  <th className="py-2 px-3">Device Hostname</th>
                  <th className="py-2 px-3">Vendor</th>
                  <th className="py-2 px-3">Compliance Score</th>
                  <th className="py-2 px-3">Failed Controls</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9B9B4]/40">
                {lastBatch.results.map((d: FleetDeviceResult, idx: number) => (
                  <tr key={idx} className="hover:bg-[#EAEAE7]">
                    <td className="py-2.5 px-3 font-bold text-[#171717]">{d.hostname}</td>
                    <td className="py-2.5 px-3 text-[#5E5E5E]">{d.vendor}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${
                        d.compliance_score >= 80 ? 'text-[#00A86B]' : d.compliance_score >= 60 ? 'text-[#D4A017]' : 'text-[#D64545]'
                      }`}>
                        {d.compliance_score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#D64545] font-bold">{d.failed_findings}</td>
                    <td className="py-2.5 px-3 text-right">
                      {d.audit_id && (
                        <button
                          onClick={() => openAudit(d.audit_id!)}
                          className="text-[11px] font-bold text-[#171717] hover:underline"
                        >
                          View &rarr;
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
