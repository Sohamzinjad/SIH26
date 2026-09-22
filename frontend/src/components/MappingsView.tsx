import React, { useState, useEffect } from 'react';
import { AIMapping } from '../types';
import { fetchPendingMappings, approveAIMapping, rejectAIMapping } from '../api/client';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
  Terminal,
} from 'lucide-react';

interface MappingsViewProps {
  onMappingApproved: (auditId: number) => void;
}

export const MappingsView: React.FC<MappingsViewProps> = ({ onMappingApproved }) => {
  const [mappings, setMappings] = useState<AIMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const data = await fetchPendingMappings();
      setMappings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending AI mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (m: AIMapping) => {
    setProcessingId(m.id);
    setError(null);
    try {
      const res = await approveAIMapping(m.id, 'lead_analyst_ntro');
      setSuccessMsg(`Dialect fingerprint #${m.id} approved and cached into deterministic memory.`);
      setMappings((prev) => prev.filter((item) => item.id !== m.id));
      if (res.audit_id) {
        onMappingApproved(res.audit_id);
      }
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await rejectAIMapping(id);
      setMappings((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
        <p className="font-mono text-xs text-faint tracking-[0.18em] uppercase">Fetching pending AI proposals…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="kicker mb-3">Human-in-the-loop AI governance</div>
          <h1 className="font-display font-bold text-h1 tracking-tight text-ink">
            White-box grammar &amp; dialect review
          </h1>
          <p className="mt-3 max-w-2xl text-body text-muted">
            Review local AI proposed normalizations for unknown device configurations. Approving
            caches the SHA-256 syntax fingerprint for 100% deterministic future runs.
          </p>
        </div>

        <div className="rounded-2xl border border-accent/35 bg-accent/10 px-6 py-5 flex items-center gap-5">
          <div className="stat-number-sm text-accent-hover">{mappings.length}</div>
          <div>
            <div className="stat-label">Pending sign-off</div>
            <div className="text-caption text-faint mt-1">reviewed proposals are 100% human-approved</div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="banner banner-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="banner banner-error flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="relative card overflow-hidden p-14 text-center space-y-3">
          {/* Decorative shapes allowed in empty states only */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            <div className="orb orb-violet orb-drift-a -top-20 left-[20%] h-52 w-52" />
            <div className="orb orb-indigo orb-drift-b -bottom-24 right-[18%] h-60 w-60" />
          </div>
          <div className="relative z-10 space-y-3">
            <ShieldCheck className="w-10 h-10 text-ok mx-auto" />
            <div className="font-semibold text-ink">All dialect proposals reviewed</div>
            <div className="text-caption text-muted">No pending white-box device mappings require human approval.</div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {mappings.map((m) => {
            const rawConfigText = m.config_sample || '';
            const rawLines = rawConfigText.split('\n');
            return (
              <div key={m.id} className="card p-6 space-y-5">
                <div className="flex flex-wrap justify-between items-start gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="kicker">Proposal #{m.id}</span>
                    <h3 className="font-display font-semibold text-lg text-ink mt-1">
                      Fingerprint: <span className="font-mono">{m.fingerprint_hash.substring(0, 16)}</span> &bull;{' '}
                      Guessed: <span className="uppercase">{m.vendor_guessed}</span>
                    </h3>
                  </div>
                  <span className="badge badge-medium">Pending analyst sign-off</span>
                </div>

                {/* Side-by-side Review Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-[13px]">
                  {/* Left: Raw Config */}
                  <div className="space-y-2">
                    <div className="font-mono text-[10px] text-faint font-bold uppercase tracking-wider flex items-center">
                      <Terminal className="w-3.5 h-3.5 mr-1.5" />
                      Raw unknown config text ({rawLines.length} lines)
                    </div>
                    <pre className="code-surface h-80 p-4 text-muted leading-relaxed">
                      {rawConfigText}
                    </pre>
                  </div>

                  {/* Right: AI Proposed Mapping */}
                  <div className="space-y-2">
                    <div className="font-mono text-[10px] text-faint font-bold uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-ok" />
                      AI proposed structured mapping (neutral schema)
                    </div>
                    <pre className="code-surface h-80 p-4 text-ok leading-relaxed">
                      {JSON.stringify(m.proposed_schema, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Bottom Approval Action Bar — flat, immediate, no motion */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-white/10">
                  <div className="text-[12px] text-muted flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-ok" />
                    <span>Approving stores SHA-256 dialect fingerprint in database cache.</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReject(m.id)}
                      disabled={processingId === m.id}
                      className="btn btn-danger"
                    >
                      Reject mapping
                    </button>
                    <button
                      onClick={() => handleApprove(m)}
                      disabled={processingId === m.id}
                      className="btn btn-primary"
                    >
                      {processingId === m.id ? 'Caching…' : 'Approve & cache dialect'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};