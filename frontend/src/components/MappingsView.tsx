import React, { useState, useEffect } from 'react';
import { AIMapping } from '../types';
import { fetchPendingMappings, approveAIMapping, rejectAIMapping } from '../api/client';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  Info, 
  ArrowRight,
  Code,
  Terminal,
  Database,
  Cpu
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
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Checking AI Grammar Proposals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Pinecone Breadcrumbs & Top Section */}
      <div className="border-b border-[#22262F] pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1 font-mono">
          <span>Indexes</span>
          <span>/</span>
          <span className="text-slate-200">AI Schema Governance</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Human-in-the-Loop Dialect Normalization</span>
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-[#1F222E] text-slate-400 border border-[#2C313B]">
            {mappings.length} Pending
          </span>
        </h1>
        <p className="text-xs text-[#9AA2B0] mt-1 max-w-3xl">
          Deterministic compliance principle: AI proposes structural mappings for unfamiliar NOS/whitebox syntaxes; human security analysts approve the fingerprint before caching.
        </p>
      </div>

      {/* Governance Banner */}
      <div className="bg-[#12141A] border border-[#22262F] rounded-xl p-5 shadow-pinecone">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Deterministic Memory Guarantee
            </h3>
            <p className="text-xs text-[#9AA2B0] leading-relaxed">
              Once an analyst approves a dialect schema, the grammar fingerprint is hashed and stored in local deterministic memory. Subsequent configurations in this dialect are audited instantaneously without LLM intervention.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mappings List */}
      <div className="space-y-4">
        {mappings.length === 0 ? (
          <div className="bg-[#12141A] border border-[#22262F] rounded-xl p-12 text-center shadow-pinecone">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">All Dialects Fingerprinted</h3>
              <p className="text-xs text-[#9AA2B0] max-w-md">
                No syntax proposals are awaiting human review. All monitored fleet configurations map deterministically to known vendor grammars.
              </p>
            </div>
          </div>
        ) : (
          mappings.map((m) => (
            <div
              key={m.id}
              className="bg-[#12141A] border border-[#22262F] hover:border-[#2C313B] rounded-xl p-6 space-y-4 shadow-pinecone transition"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#22262F] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-cyan-400">Proposal #{m.id}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Guessed: {m.vendor_guessed}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Confidence: {(m.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Fingerprint Hash: <span className="text-slate-300">{m.fingerprint_hash}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReject(m.id)}
                    disabled={processingId === m.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-[#0A0C0F] hover:bg-[#1A1D24] border border-[#22262F] transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(m)}
                    disabled={processingId === m.id}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>Approve & Cache Dialect</span>
                  </button>
                </div>
              </div>

              {/* Proposed Schema & Raw Config Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider font-mono flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Proposed AST Normalization (JSON)</span>
                  </span>
                  <pre className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5 font-mono text-[11px] text-emerald-300 max-h-60 overflow-y-auto leading-relaxed">
                    {JSON.stringify(m.proposed_schema, null, 2)}
                  </pre>
                </div>

                {m.config_sample && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider font-mono flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Uncatalogued Config Sample</span>
                    </span>
                    <pre className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5 font-mono text-[11px] text-emerald-400 max-h-60 overflow-y-auto leading-relaxed">
                      {m.config_sample}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
