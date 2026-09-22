import React, { useState, useEffect } from 'react';
import { DeviceAuditRecord, DeviceDriftResponse, DeviceHistoryResponse } from '../types';
import { fetchDeviceHistory, fetchDeviceDrift } from '../api/client';
import {
  History,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  CornerDownRight,
  ShieldCheck,
  Layers,
  ArrowLeft,
} from 'lucide-react';

interface DeviceHistoryViewProps {
  deviceId: number;
  onSelectAudit?: (auditId: number) => void;
  onBack?: () => void;
}

const DELTA_STYLE: Record<string, { label: string; cls: string; Icon: any }> = {
  same: { label: 'SAME', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20', Icon: Minus },
  improved: { label: 'IMPROVED', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', Icon: ArrowUpRight },
  worsened: { label: 'WORSENED', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', Icon: ArrowDownRight },
  new: { label: 'NEW', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', Icon: Plus },
  disappeared: { label: 'GONE', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', Icon: CornerDownRight },
};

export const DeviceHistoryView: React.FC<DeviceHistoryViewProps> = ({ deviceId, onSelectAudit, onBack }) => {
  const [history, setHistory] = useState<DeviceHistoryResponse | null>(null);
  const [drift, setDrift] = useState<DeviceDriftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchDeviceHistory(deviceId), fetchDeviceDrift(deviceId)])
      .then(([h, d]) => {
        if (cancelled) return;
        setHistory(h);
        setDrift(d);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load device history');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading device history & drift...</p>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl max-w-xl mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
        <p className="font-semibold text-sm">{error || 'Device not found'}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 bg-[#171717] text-white px-4 py-2 font-mono text-xs font-bold"
          >
            &larr; BACK
          </button>
        )}
      </div>
    );
  }

  const audits = history.audits;
  const comparable = drift?.comparable ?? false;
  const counts = drift || null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Back Navigation Bar */}
      {onBack && (
        <div className="pb-1 border-b border-[#22262F]">
          <button
            onClick={onBack}
            className="bg-[#171717] hover:bg-[#232323] text-white font-mono text-xs font-bold px-4 py-2 trinetra-chamfer transition flex items-center space-x-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#00A86B]" />
            <span>&larr; BACK TO PREVIOUS MODULE</span>
          </button>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="border-b border-[#22262F] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1 font-mono">
            <span>Indexes</span>
            <span>/</span>
            <span className="text-slate-200">{history.hostname}</span>
            <span>/</span>
            <span className="text-emerald-400">history & drift</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-2.5">
            <History className="w-5 h-5 text-emerald-400" />
            {history.hostname}
          </h1>
          <p className="text-xs text-[#9AA2B0] mt-1.5 font-mono">
            {audits.length} audit run(s) recorded for device #{deviceId} — real persisted Audit/Finding rows.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-[#1A1D24] border border-[#22262F] transition"
            >
              &larr; Back
            </button>
          )}
          <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-[#12141A] border border-[#22262F]">
            device-{String(deviceId).padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* Drift Card */}
      <div className="bg-[#111419] border border-[#22262F] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#22262F] flex items-center justify-between">
          <h2 className="font-semibold text-[#F4F6FB] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Drift Between Recent Audits
          </h2>
        </div>

        {!comparable ? (
          <div className="px-6 py-10 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-slate-500 mb-3" />
            <p className="text-sm text-slate-300 font-medium">No drift comparison available yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Only one audit is recorded for this device. Run another audit and revisit to see per-rule
              same / improved / worsened / new / disappeared deltas.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-[#9AA2B0] font-semibold">Drift Score</div>
                <div className={`text-2xl font-bold font-mono mt-1 ${
                  (drift!.drift_score ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {drift!.drift_score}{drift!.drift_score >= 0 ? '+' : ''}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">improved vs worsened</div>
              </div>
              <div className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-[#9AA2B0] font-semibold">Same</div>
                <div className="text-xl font-bold font-mono text-slate-300 mt-1">{drift!.same_count}</div>
              </div>
              <div className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-[#9AA2B0] font-semibold">Improved</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{drift!.improved_count}</div>
              </div>
              <div className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-[#9AA2B0] font-semibold">Worsened</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1">{drift!.worsened_count}</div>
              </div>
              <div className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-[#9AA2B0] font-semibold">New</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">{drift!.new_count}</div>
              </div>
              <div className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5">
                <div className="text-[10px] uppercase tracking-wider text-[#9AA2B0] font-semibold">Resolved</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">{drift!.disappeared_count}</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-mono">{drift!.detail}</p>

            {/* Per-rule drift delta table */}
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Per-Rule Delta ({drift!.rules.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-[#22262F]">
                      <th className="px-3 py-2 font-medium">Rule</th>
                      <th className="px-3 py-2 font-medium">Framework</th>
                      <th className="px-3 py-2 font-medium">Previous</th>
                      <th className="px-3 py-2 font-medium">Current</th>
                      <th className="px-3 py-2 font-medium">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drift!.rules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-500">
                          No rules to compare between these audits.
                        </td>
                      </tr>
                    )}
                    {drift!.rules.map((r) => {
                      const d = DELTA_STYLE[r.transition] || DELTA_STYLE.same;
                      const Icon = d.Icon;
                      return (
                        <tr key={r.rule_id} className="border-b border-[#1A1E26] hover:bg-[#14181D] transition-colors">
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-[#7BF2C0] text-xs">{r.rule_id}</span>
                            {r.title && <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{r.title}</div>}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.framework ? (
                              <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded bg-[#0A0C0F] text-slate-400 border border-[#22262F]">
                                {r.framework}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.previous_status ? (
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                r.previous_status === 'fail'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {r.previous_status.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.current_status ? (
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                r.current_status === 'fail'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {r.current_status.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${d.cls}`}>
                              <Icon className="w-3 h-3" />
                              {d.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {(drift!.previous_audit_id || drift!.current_audit_id) && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Compare:</span>
                {drift!.previous_audit_id != null && (
                  <button
                    onClick={() => onSelectAudit?.(drift!.previous_audit_id!)}
                    className="px-2.5 py-1 rounded-lg bg-[#1A1D24] hover:bg-[#262B35] text-slate-300 border border-[#2C313B] transition font-mono"
                  >
                    audit-{drift!.previous_audit_id}
                  </button>
                )}
                <span className="text-slate-600">→</span>
                {drift!.current_audit_id != null && (
                  <button
                    onClick={() => onSelectAudit?.(drift!.current_audit_id!)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 border border-emerald-500/30 transition font-mono"
                  >
                    audit-{drift!.current_audit_id}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-[#111419] border border-[#22262F] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#22262F] flex items-center justify-between">
          <h2 className="font-semibold text-[#F4F6FB] flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Audit History ({audits.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">newest first</span>
        </div>
        {audits.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-slate-500">
            No completed audits recorded for this device yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-[#22262F]">
                  <th className="px-6 py-3 font-medium">Audit</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Compliance</th>
                  <th className="px-4 py-3 font-medium">Fail / Total</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a: DeviceAuditRecord) => (
                  <tr key={a.audit_id} className="border-b border-[#1A1E26] hover:bg-[#14181D] transition-colors">
                    <td className="px-6 py-3 font-mono text-[#7BF2C0]">audit-{a.audit_id}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {new Date(a.started_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#7BF2C0]">{a.compliance_score.toFixed ? a.compliance_score.toFixed(1) : a.compliance_score}%</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">
                      <span className="text-rose-400">{a.fail_count}</span> / {a.total_count}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectAudit?.(a.audit_id)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceHistoryView;