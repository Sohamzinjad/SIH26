import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Upload, Loader2, CheckCircle2, AlertTriangle, XCircle, Layers, ShieldAlert, ArrowLeft } from 'lucide-react';

interface FleetViewProps {
  onBatchCompleted?: (batch: FleetBatchResponse) => void;
  onBatchFailed?: (msg: string) => void;
}

export const FleetView: React.FC<FleetViewProps> = ({ onBatchCompleted, onBatchFailed }) => {
  
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<FleetBatchResponse | null>(null);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const navigate = useNavigate();

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
      // refresh the cross-device N-of-M summary from REAL persisted data
      try {
        setSummary(await fetchFleetSummary());
      } catch { /* summary is best-effort; batch table already landed */ }
    } catch (e: any) {
      setError(e?.message || 'Fleet batch failed');
      onBatchFailed?.(e?.message || 'Fleet batch failed');
    } finally {
      setIsUploading(false);
    }
  };

  const openAudit = (auditId: number) => {
    navigate(`/audit/${auditId}`);
  };

  const activeRules = (summary?.by_rule ?? []).filter((r: FleetRuleAggregate) => r.devices_failing > 0);
  const activeChains = (summary?.by_chain ?? []).filter((c: FleetAttackChainAggregate) => c.devices_active > 0);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#F4F6FB]">Fleet & Batch Auditing</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload many devices at once — each runs the <span className="text-emerald-400 font-mono">exact same deterministic pipeline</span> the single-file view runs.
        </p>
      </div>

      {/* Batch Upload Panel */}
      <div className="bg-[#111419] border border-[#22262F] rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Config files <span className="text-slate-500">(or .zip containing many)</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex-1 cursor-pointer border border-dashed border-[#2A3040] rounded-lg p-6 text-center hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-colors">
            <input
              type="file"
              multiple
              accept=".cfg,.conf,.zip,.txt"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex flex-col items-center">
              <Upload className="w-6 h-6 text-slate-500 mb-2" />
              <span className="text-sm text-slate-300">
                {files.length ? `${files.length} file(s) selected` : 'Click to select multiple config files'}
              </span>
              <span className="text-xs text-slate-500 mt-1">cisco_ios / fortios / junos detected structurally; unknown → PENDING AI mapping (kept pending, never force-scored)</span>
            </div>
          </label>
          <button
            onClick={runBatch}
            disabled={!files.length || isUploading}
            className="self-start sm:self-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Auditing fleet…</>
            ) : (
              <>Run Fleet Audit</>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 inline mr-1" />{error}
          </p>
        )}
      </div>

      {/* Batch Progress Table — one row per device/file, REAL per-file outcome */}
      {lastBatch && (
        <div className="bg-[#111419] border border-[#22262F] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#22262F] flex items-center justify-between">
            <h2 className="font-semibold text-[#F4F6FB]">Batch Results</h2>
            <span className="text-xs text-slate-400">
              {lastBatch.completed_count}/{lastBatch.total_files} completed ·{' '}
              {lastBatch.pending_count} pending AI · {lastBatch.failed_count} failed
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-[#22262F]">
                  <th className="px-6 py-3 font-medium">Device</th>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Findings</th>
                  <th className="px-4 py-3 font-medium">Attack Paths</th>
                  <th className="px-4 py-3 font-medium">Detection</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {lastBatch.results.map((r: FleetDeviceResult, i: number) => (
                  <tr key={r.audit_id || i} className="border-b border-[#1A1E26] hover:bg-[#14181D] transition-colors">
                    <td className="px-6 py-3 font-mono text-[#7BF2C0]">{r.hostname}</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{r.vendor}</td>
                    <td className="px-4 py-3">
                      {r.error ? (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <XCircle className="w-3.5 h-3.5" />{r.error}
                        </span>
                      ) : r.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />Pending AI
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#7BF2C0]">{r.compliance_score?.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.failed_findings}/{r.total_findings} failing
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.attack_paths_count}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{r.detection_method}</td>
                    <td className="px-4 py-3">
                      {r.status === 'COMPLETED' && (
                        <button
                          onClick={() => openAudit(r.audit_id)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5" />View
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

      {/* Fleet Summary — cross-device N-of-M aggregates, REAL persisted rows inline */}
      {(activeRules.length > 0 || activeChains.length > 0) && (
        <div className="bg-[#111419] border border-[#22262F] rounded-xl p-6">
          <h2 className="font-semibold text-[#F4F6FB] mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" /> Fleet Vulnerabilities Across Devices
          </h2>

          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">By Rule — N of M devices failing</h3>
          <div className="space-y-2 mb-5">
            {activeRules.slice(0, 50).map((r: FleetRuleAggregate) => (
              <div key={r.rule_id} className="flex items-center justify-between gap-4 text-sm bg-[#171B21] rounded-lg px-4 py-2.5">
                <span className="text-slate-300 truncate">{r.title}</span>
                <span className="font-mono text-amber-300 whitespace-nowrap text-xs">
                  {r.devices_failing} of {r.devices_present} failing
                </span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">By Attack Chain</h3>
          <div className="space-y-2">
            {activeChains.slice(0, 30).map((c: FleetAttackChainAggregate) => (
              <div key={c.chain_id} className="flex items-center justify-between gap-4 text-sm bg-[#171B21] rounded-lg px-4 py-2.5">
                <span className="text-slate-300 truncate">{c.name}</span>
                <span className="font-mono text-red-300 whitespace-nowrap text-xs">
                  {c.devices_active} of {c.devices_present} active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root-cause summary note (external-governance style) */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <ArrowLeft className="w-3.5 h-3.5 cursor-pointer" />
        <span>Back to dashboard</span>
      </div>
    </div>
  );
};

export default FleetView;
