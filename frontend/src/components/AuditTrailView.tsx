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
      setError(e?.message || 'Demo tamper failed');
    } finally {
      setTampering(false);
    }
  };

  const verified = result?.verified === true;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-[#B9B9B4] pb-5">
        <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
          DEFENSE AUDIT LEDGER
        </div>
        <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5">
          Tamper-Evident Hash Chain Verification
        </h1>
        <p className="text-xs text-[#5E5E5E] font-sans mt-1">
          Cryptographic SHA-256 hash-chain verification for audit events. Ensures non-repudiation and immutable evidence logging.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#D64545] text-white font-mono text-xs trinetra-chamfer">
          {error}
        </div>
      )}

      {/* Verification Status Card */}
      <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-6 space-y-4 shadow-sm font-mono text-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#B9B9B4] pb-4">
          <div className="flex items-center space-x-3">
            {verified ? (
              <div className="p-2 bg-[#00A86B] text-white font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2 bg-[#D64545] text-white font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="font-bold text-sm text-[#171717]">
                {verified ? 'AUDIT TRAIL VERIFIED & INTACT' : 'HASH CHAIN MISMATCH / TAMPERING DETECTED'}
              </div>
              <div className="text-[11px] text-[#5E5E5E]">
                {result?.total_entries ?? 0} total entries validated across append sequence.
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={verify}
              disabled={loading}
              className="bg-[#171717] hover:bg-[#232323] text-white font-bold px-4 py-2 trinetra-chamfer text-xs transition"
            >
              VERIFY CHAIN
            </button>
            <button
              onClick={runDemoTamper}
              disabled={tampering}
              className="bg-[#EAEAE7] hover:bg-[#B9B9B4] text-[#171717] font-bold px-4 py-2 trinetra-chamfer text-xs border border-[#B9B9B4] transition"
            >
              SIMULATE TAMPER
            </button>
          </div>
        </div>

        {/* Verification Summary Details */}
        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
            <div className="p-3 bg-[#EAEAE7] border border-[#B9B9B4]">
              <span className="text-[#5E5E5E] block text-[10px] uppercase">Status</span>
              <span className={`font-bold ${verified ? 'text-[#00A86B]' : 'text-[#D64545]'}`}>
                {verified ? 'PASS (100% Intact)' : 'TAMPERED'}
              </span>
            </div>

            <div className="p-3 bg-[#EAEAE7] border border-[#B9B9B4]">
              <span className="text-[#5E5E5E] block text-[10px] uppercase">Entries Checked</span>
              <span className="font-bold text-[#171717]">{result.total_entries}</span>
            </div>

            <div className="p-3 bg-[#EAEAE7] border border-[#B9B9B4]">
              <span className="text-[#5E5E5E] block text-[10px] uppercase">Broken Entry ID</span>
              <span className="font-bold text-[#171717]">{result.first_broken_entry_id ?? 'None'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};