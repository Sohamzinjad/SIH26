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
  same: { label: 'SAME', cls: 'border-white/15 bg-surface-3 text-muted', Icon: Minus },
  improved: { label: 'IMPROVED', cls: 'border-[#067647] bg-[#067647]/15 text-ok', Icon: ArrowUpRight },
  worsened: { label: 'WORSENED', cls: 'border-[#D92D20]/60 bg-[#D92D20]/15 text-crit', Icon: ArrowDownRight },
  new: { label: 'NEW', cls: 'border-high/70 bg-high/15 text-high', Icon: Plus },
  disappeared: { label: 'GONE', cls: 'border-med/70 bg-med/15 text-med', Icon: CornerDownRight },
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
        <Loader2 className="w-10 h-10 text-ok animate-spin" />
        <p className="text-xs text-faint font-mono tracking-[0.18em] uppercase">Loading device history &amp; drift…</p>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="p-8 text-center text-crit bg-crit/10 border border-crit/40 rounded-2xl max-w-xl mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-crit" />
        <p className="font-semibold text-sm">{error || 'Device not found'}</p>
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost">
            &larr; Back
          </button>
        )}
      </div>
    );
  }

  const audits = history.audits;
  const comparable = drift?.comparable ?? false;
  const counts = drift || null;

  return (
    <div className="space-y-10 pb-16">
      {/* Top Back Navigation Bar */}
      {onBack && (
        <div>
          <button onClick={onBack} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to previous module
          </button>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-faint mb-2 font-mono">
            <span>Indexes</span>
            <span>/</span>
            <span className="text-ink">{history.hostname}</span>
            <span>/</span>
            <span className="text-ok">history &amp; drift</span>
          </div>
          <h1 className="font-display font-bold text-h1 tracking-tight text-ink flex items-center gap-2.5">
            <History className="w-5 h-5 text-ok" />
            {history.hostname}
          </h1>
          <p className="text-caption text-muted mt-2 font-mono">
            {audits.length} audit run(s) recorded for device #{deviceId} — real persisted Audit/Finding rows.
          </p>
        </div>
        <span className="badge badge-neutral font-mono">device-{String(deviceId).padStart(3, '0')}</span>
      </div>

      {/* Drift Card */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ok" /> Drift Between Recent Audits
          </h2>
        </div>

        {!comparable ? (
          <div className="px-6 py-10 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-faint mb-3" />
            <p className="text-sm text-muted font-medium">No drift comparison available yet</p>
            <p className="text-xs text-faint mt-1 max-w-md mx-auto">
              Only one audit is recorded for this device. Run another audit and revisit to see per-rule
              same / improved / worsened / new / disappeared deltas.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="rounded-xl bg-surface-2 border border-white/10 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint font-semibold">Drift Score</div>
                <div className={`font-display font-bold text-2xl mt-1 ${
                  (drift!.drift_score ?? 0) >= 0 ? 'text-ok' : 'text-crit'
                }`}>
                  {drift!.drift_score}{drift!.drift_score >= 0 ? '+' : ''}
                </div>
                <div className="text-[10px] text-faint mt-0.5">improved vs worsened</div>
              </div>
              <div className="rounded-xl bg-surface-2 border border-white/10 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint font-semibold">Same</div>
                <div className="font-display font-bold text-xl text-ink mt-1">{drift!.same_count}</div>
              </div>
              <div className="rounded-xl bg-surface-2 border border-white/10 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint font-semibold">Improved</div>
                <div className="font-display font-bold text-xl text-ok mt-1">{drift!.improved_count}</div>
              </div>
              <div className="rounded-xl bg-surface-2 border border-white/10 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint font-semibold">Worsened</div>
                <div className="font-display font-bold text-xl text-crit mt-1">{drift!.worsened_count}</div>
              </div>
              <div className="rounded-xl bg-surface-2 border border-white/10 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint font-semibold">New</div>
                <div className="font-display font-bold text-xl text-high mt-1">{drift!.new_count}</div>
              </div>
              <div className="rounded-xl bg-surface-2 border border-white/10 p-3.5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-faint font-semibold">Resolved</div>
                <div className="font-display font-bold text-xl text-med mt-1">{drift!.disappeared_count}</div>
              </div>
            </div>

            <p className="text-xs text-faint font-mono">{drift!.detail}</p>

            {/* Per-rule drift delta table */}
            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Per-rule delta ({drift!.rules.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Framework</th>
                      <th>Previous</th>
                      <th>Current</th>
                      <th>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drift!.rules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted">
                          No rules to compare between these audits.
                        </td>
                      </tr>
                    )}
                    {drift!.rules.map((r) => {
                      const d = DELTA_STYLE[r.transition] || DELTA_STYLE.same;
                      const Icon = d.Icon;
                      return (
                        <tr key={r.rule_id} className="row-hover">
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[12px] text-ok">{r.rule_id}</span>
                            {r.title && <div className="text-xs text-muted mt-0.5 max-w-xs truncate">{r.title}</div>}
                          </td>
                          <td className="py-2.5 px-3">
                            {r.framework ? (
                              <span className="badge badge-neutral">{r.framework}</span>
                            ) : (
                              <span className="text-xs text-faint">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {r.previous_status ? (
                              <span className={`badge ${r.previous_status === 'fail' ? 'badge-fail' : 'badge-pass'}`}>{r.previous_status.toUpperCase()}</span>
                            ) : (
                              <span className="text-xs text-faint">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {r.current_status ? (
                              <span className={`badge ${r.current_status === 'fail' ? 'badge-fail' : 'badge-pass'}`}>{r.current_status.toUpperCase()}</span>
                            ) : (
                              <span className="text-xs text-faint">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${d.cls}`}>
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
                <span className="text-faint">Compare:</span>
                {drift!.previous_audit_id != null && (
                  <button
                    onClick={() => onSelectAudit?.(drift!.previous_audit_id!)}
                    className="btn btn-ghost btn-sm"
                  >
                    audit-{drift!.previous_audit_id}
                  </button>
                )}
                <span className="text-faint">→</span>
                {drift!.current_audit_id != null && (
                  <button
                    onClick={() => onSelectAudit?.(drift!.current_audit_id!)}
                    className="btn btn-primary btn-sm"
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
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <Layers className="w-4 h-4 text-ok" /> Audit History ({audits.length})
          </h2>
          <span className="text-xs text-faint font-mono">newest first</span>
        </div>
        {audits.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-faint">
            No completed audits recorded for this device yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Audit</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Compliance</th>
                  <th>Fail / Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a: DeviceAuditRecord) => (
                  <tr key={a.audit_id} className="row-hover">
                    <td className="font-mono text-ok">audit-{a.audit_id}</td>
                    <td className="text-xs text-muted font-mono">
                      {new Date(a.started_at).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-pass">{a.status}</span>
                    </td>
                    <td className="font-mono text-ok">{a.compliance_score.toFixed ? a.compliance_score.toFixed(1) : a.compliance_score}%</td>
                    <td className="text-muted text-xs">
                      <span className="text-crit font-bold">{a.fail_count}</span> / {a.total_count}
                    </td>
                    <td>
                      <button
                        onClick={() => onSelectAudit?.(a.audit_id)}
                        className="text-xs text-accent-hover hover:text-white font-semibold flex items-center gap-1"
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