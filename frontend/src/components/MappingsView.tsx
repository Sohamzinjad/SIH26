import React, { useState, useEffect } from 'react';
import { AIMapping } from '../types';
import { fetchPendingMappings, approveAIMapping, rejectAIMapping } from '../api/client';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Info, 
  Terminal
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
      <div className="flex flex-col justify-center items-center h-96 space-y-3 font-mono">
        <div className="w-10 h-10 border-4 border-[#171717] border-t-transparent animate-spin"></div>
        <p className="text-xs text-[#5E5E5E] tracking-widest uppercase">FETCHING PENDING AI PROPOSALS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-[#B9B9B4] pb-5">
        <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
          HUMAN-IN-THE-LOOP AI GOVERNANCE
        </div>
        <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5">
          White-Box Grammar & Dialect Review
        </h1>
        <p className="text-xs text-[#5E5E5E] font-sans mt-1">
          Review local AI proposed normalizations for unknown device configurations. Approving caches the SHA-256 syntax fingerprint for 100% deterministic future runs.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#00A86B] text-white font-mono text-xs trinetra-chamfer flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#D64545] text-white font-mono text-xs trinetra-chamfer flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-12 text-center space-y-3 font-mono">
          <ShieldCheck className="w-10 h-10 text-[#00A86B] mx-auto" />
          <div className="font-bold text-sm text-[#171717]">ALL DIALECT PROPOSALS REVIEWED</div>
          <div className="text-xs text-[#5E5E5E]">No pending white-box device mappings require human approval.</div>
        </div>
      ) : (
        <div className="space-y-8">
          {mappings.map((m) => {
            const rawConfigText = m.config_sample || '';
            const rawLines = rawConfigText.split('\n');
            return (
              <div key={m.id} className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-6 space-y-4 shadow-sm font-mono">
                <div className="flex justify-between items-center border-b border-[#B9B9B4] pb-3">
                  <div>
                    <span className="text-[10px] text-[#5E5E5E] uppercase font-bold tracking-widest">PROPOSAL #{m.id}</span>
                    <h3 className="font-bold text-base text-[#171717]">Fingerprint: {m.fingerprint_hash.substring(0, 16)} &bull; Guessed: {m.vendor_guessed}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#0057B8] text-white font-bold text-xs">
                    PENDING ANALYST SIGN-OFF
                  </span>
                </div>

                {/* Side-by-side Review Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  {/* Left: Raw Config */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#5E5E5E] font-bold uppercase tracking-wider flex items-center">
                      <Terminal className="w-3.5 h-3.5 mr-1 text-[#171717]" />
                      <span>RAW UNKNOWN CONFIG TEXT ({rawLines.length} LINES)</span>
                    </div>
                    <pre className="bg-[#171717] text-[#F1F1EF] p-4 border border-[#232323] h-80 overflow-y-auto font-mono text-xs leading-relaxed">
                      {rawConfigText}
                    </pre>
                  </div>

                  {/* Right: AI Proposed Mapping */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#5E5E5E] font-bold uppercase tracking-wider flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[#00A86B]" />
                      <span>AI PROPOSED STRUCTURED MAPPING (NEUTRAL SCHEMA)</span>
                    </div>
                    <pre className="bg-[#171717] text-[#00A86B] p-4 border border-[#232323] h-80 overflow-y-auto font-mono text-xs leading-relaxed">
                      {JSON.stringify(m.proposed_schema, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Bottom Approval Action Bar */}
                <div className="flex justify-between items-center pt-3 border-t border-[#B9B9B4]">
                  <div className="text-[11px] text-[#5E5E5E] flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>Approving stores SHA-256 dialect fingerprint in database cache.</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleReject(m.id)}
                      disabled={processingId === m.id}
                      className="bg-[#D64545] hover:bg-[#b83535] text-white font-bold px-4 py-2 trinetra-chamfer text-xs transition"
                    >
                      REJECT MAPPING
                    </button>
                    <button
                      onClick={() => handleApprove(m)}
                      disabled={processingId === m.id}
                      className="bg-[#171717] hover:bg-[#232323] text-white font-bold px-6 py-2 trinetra-chamfer text-xs transition shadow-sm"
                    >
                      {processingId === m.id ? 'CACHING...' : 'APPROVE & CACHE DIALECT'}
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
