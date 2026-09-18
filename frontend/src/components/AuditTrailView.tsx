import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchAuditTrailVerify,
  demoTamperAuditTrail,
} from '../api/client';
import type { AuditTrailVerifyResponse } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bug,
  Loader2,
  Link2,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [result, setResult] = useState<AuditTrailVerifyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tampering, setTampering] = useState<boolean>(false);

  const verify = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await fetchAuditTrailVerify());
    } catch (e: any) {
      setError(e?.message || 'Failed to verify audit trail');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  const runDemoTamper = async () => {
    setTampering(true);
    setError(null);
    try {
      const tampered = await demoTamperAuditTrail();
      setResult(await fetchAuditTrailVerify());
      setError(`Demo: entry #${tampered.tampered_entry_id} tampered (hash NOT recomputed) — chain should now fail.`);
    } catch (e: any) {
      setError(e?.message || 'Demo tamper failed (is AUDIT_TRAIL_DEMO_ENABLED=true?)');
    } finally {
      setTampering(false);
    }
  };

  const verified = result?.verified === true;

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#F4F6FB]">Audit Trail Verification</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tamper-evident <span className="text-emerald-400 font-mono">SHA-256 hash chain</span> over every
          audit trail entry — recomputed across the entire table in id order.
        </p>
      </div>

      {/* Result Panel */}
      <div
        className={`bg-[#111419] border rounded-xl p-6 ${
          verified ? 'border-emerald-500/40' : result ? 'border-red-500/40' : 'border-[#22262F]'
        }`}
      >
        <div className="flex items-center gap-3">
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className="text-sm text-slate-300">Recomputing chain…</span>
            </>
          ) : verified ? (
            <>
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="font-semibold text-[#F4F6FB]">Chain Verified</div>
                <div className="text-xs text-slate-400">
                  {result?.total_entries} entr{result?.total_entries === 1 ? 'y' : 'ies'} chained — every hash +
                  prev_hash link matches a live recomputation.
                </div>
              </div>
            </>
          ) : result ? (
            <>
              <ShieldAlert className="w-6 h-6 text-red-400" />
              <div>
                <div className="font-semibold text-red-400">Chain BROKEN — tamper detected</div>
                <div className="text-xs text-slate-400">
                  {result?.total_entries} entries · broke at entry{' '}
                  <span className="font-mono text-amber-300">
                    #{result?.first_broken_entry_id}
                  </span>{' '}
                  · reason <span className="font-mono text-amber-300">{result?.first_broken_reason}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {error && (
          <p className="mt-3 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            <Link2 className="w-4 h-4 inline mr-1" />{error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={verify}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Re-verify Chain
          </button>
          <button
            onClick={runDemoTamper}
            disabled={loading || tampering}
            className="inline-flex items-center gap-2 bg-[#1A1D24] hover:bg-[#22262F] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-[#2A3040] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Bug className="w-4 h-4" /> Demo: Tamper Latest Entry
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Demo removal requires <span className="font-mono text-slate-400">AUDIT_TRAIL_DEMO_ENABLED=true</span> —
          OFF by default (no attack surface in prod). It mutates the newest entry without recomputing its hash.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-[#111419] border border-[#22262F] rounded-xl p-6">
        <h2 className="font-semibold text-[#F4F6FB] mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> What is verified
        </h2>
        <ul className="text-sm text-slate-400 space-y-2">
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
            <span>Every row's stored <span className="font-mono text-slate-300">entry_hash</span> equals a live
            recomputation chained from the previous row's hash.</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
            <span>Every row's <span className="font-mono text-slate-300">prev_hash</span> points at the previous
            row's <span className="font-mono text-slate-300">entry_hash</span> (the very first row's
            <span className="font-mono text-slate-300"> prev_hash</span> is NULL).</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
            <span>Canonicalization is byte-for-byte fixed: <span className="font-mono text-slate-300">
            sort_keys=True, separators=(",",":")</span>, timestamp via <span className="font-mono text-slate-300">
            isoformat()</span>.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AuditTrailView;