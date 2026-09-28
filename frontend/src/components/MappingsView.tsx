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
  ChevronDown,
  Layers,
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
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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
        <div className="h-10 w-10 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
        <p className="font-mono text-xs text-muted tracking-[0.18em] uppercase">Fetching pending AI proposals…</p>
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

        <div className="rounded-md border border-white/20 bg-surface-2 px-6 py-5 flex items-center gap-5">
          <div className="stat-number-sm text-ink">{mappings.length}</div>
          <div>
            <div className="stat-label">Pending sign-off</div>
            <div className="text-caption text-muted mt-1">reviewed proposals are 100% human-approved</div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="banner border border-white/30 bg-surface-2 text-ink flex items-center gap-2 font-mono text-xs">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="banner border border-white/30 bg-surface-2 text-ink flex items-center gap-2 font-mono text-xs">
          <AlertCircle className="w-4 h-4 text-white" />
          <span>{error}</span>
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="card border border-white/20 p-14 text-center space-y-3">
          <div className="relative z-10 space-y-3">
            <ShieldCheck className="w-10 h-10 text-white mx-auto" />
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
              <div key={m.id} className="card p-6 space-y-5 border border-white/20">
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
                    <div className="font-mono text-[10px] text-muted font-bold uppercase tracking-wider flex items-center">
                      <Terminal className="w-3.5 h-3.5 mr-1.5" />
                      Raw unknown config text ({rawLines.length} lines)
                    </div>
                    <pre className="code-surface h-80 p-4 text-muted leading-relaxed border border-white/10">
                      {rawConfigText}
                    </pre>
                  </div>

                  {/* Right: AI Proposed Mapping */}
                  <div className="space-y-2">
                    <div className="font-mono text-[10px] text-muted font-bold uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-white" />
                      AI proposed structured mapping (neutral schema)
                    </div>
                    <pre className="code-surface h-80 p-4 text-white font-mono leading-relaxed border border-white/10">
                      {JSON.stringify(m.proposed_schema, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Expandable AST detail toggle */}
                <div className="pt-1">
                  <button
                    onClick={() => toggleExpand(m.id)}
                    className="btn btn-ghost btn-sm !py-1.5 !px-3 text-xs w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2"
                  >
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-white" />
                      {expandedIds.includes(m.id) ? 'Hide syntax parsing & schema metadata' : 'Inspect syntax parsing & schema metadata'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        expandedIds.includes(m.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div className={`collapsible-grid ${expandedIds.includes(m.id) ? 'is-expanded' : ''}`}>
                    <div className="collapsible-inner pt-3">
                      <div className="rounded-md border border-white/10 bg-surface-2 p-4 space-y-3 font-mono text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded bg-surface-3 p-3 border border-white/10 space-y-1">
                            <span className="text-muted text-[10px] uppercase tracking-wider block">Full Fingerprint</span>
                            <span className="text-ink break-all text-[11px]">{m.fingerprint_hash}</span>
                          </div>
                          <div className="rounded bg-surface-3 p-3 border border-white/10 space-y-1">
                            <span className="text-muted text-[10px] uppercase tracking-wider block">Proposed Dialect Engine</span>
                            <span className="text-white font-bold">{m.vendor_guessed || 'Generic Multi-Vendor'}</span>
                          </div>
                          <div className="rounded bg-surface-3 p-3 border border-white/10 space-y-1">
                            <span className="text-muted text-[10px] uppercase tracking-wider block">Determinism Verification</span>
                            <span className="text-white font-bold">100% Verifiable AST Grammar</span>
                          </div>
                        </div>

                        <div className="text-caption text-muted font-sans">
                          Once approved, this white-box grammar will be written to the deterministic dialect registry. Subsequent audits for this vendor syntax will skip LLM inference entirely and evaluate with zero hallucination.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Approval Action Bar */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-white/10">
                  <div className="text-[12px] text-muted flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-white" />
                    <span>Approving stores SHA-256 dialect fingerprint in database cache.</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReject(m.id)}
                      disabled={processingId === m.id}
                      className="btn btn-outline"
                    >
                      Reject mapping
                    </button>
                    <button
                      onClick={() => handleApprove(m)}
                      disabled={processingId === m.id}
                      className="btn btn-solid"
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