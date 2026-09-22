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
      setError(e?.message || 'Demo tamper failed');
    } finally {
      setTampering(false);
    }
  };

  const verified = result?.verified === true;

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div>
        <div className="kicker mb-3">Defense audit ledger</div>
        <h1 className="font-display font-bold text-h1 tracking-tight text-ink">
          Tamper-evident hash chain verification
        </h1>
        <p className="mt-3 max-w-2xl text-body text-muted">
          Cryptographic SHA-256 hash-chain verification for audit events. Ensures non-repudiation and immutable evidence logging.
        </p>
      </div>

      {error && (
        <div className="banner banner-error">{error}</div>
      )}

      {/* Verification Status Card — actions are flat & immediate (no motion) */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              verified ? 'bg-[#067647] text-white' : 'bg-[#D92D20] text-white'
            }`}>
              {verified ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="font-display font-bold text-[17px] text-ink">
                {verified ? 'Audit trail verified & intact' : 'Hash chain mismatch / tampering detected'}
              </div>
              <div className="text-caption text-muted mt-0.5">
                {result?.total_entries ?? 0} total entries validated across append sequence.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={verify}
              disabled={loading}
              className="btn btn-primary"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Verify chain
            </button>
            <button
              onClick={runDemoTamper}
              disabled={tampering}
              className="btn btn-ghost"
            >
              <Bug className="w-4 h-4" />
              Simulate tamper
            </button>
          </div>
        </div>

        {/* Verification Summary Details */}
        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="rounded-2xl bg-surface-2 border border-white/10 p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-faint">Status</div>
              <div className={`flex items-center gap-1.5 font-bold text-[16px] mt-1 ${
                verified ? 'text-ok' : 'text-crit'
              }`}>
                {verified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {verified ? 'PASS (100% intact)' : 'TAMPERED'}
              </div>
            </div>

            <div className="rounded-2xl bg-surface-2 border border-white/10 p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-faint">Entries checked</div>
              <div className="font-display font-bold text-[22px] text-ink mt-1">{result.total_entries}</div>
            </div>

            <div className="rounded-2xl bg-surface-2 border border-white/10 p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-faint">Broken entry ID</div>
              <div className="font-display font-bold text-[22px] mt-1 ${
                result.first_broken_entry_id != null ? 'text-crit' : 'text-ok'
              }">
                {result.first_broken_entry_id ?? 'None'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};