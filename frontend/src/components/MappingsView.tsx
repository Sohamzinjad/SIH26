import React, { useState, useEffect } from 'react';
import { AIMapping } from '../types';
import { fetchPendingMappings, approveAIMapping, rejectAIMapping } from '../api/client';
import { Cpu, CheckCircle2, XCircle, AlertCircle, Shield, Info, ArrowRight } from 'lucide-react';

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
      setSuccessMsg(`Mapping #${m.id} approved! Dialect fingerprint cached for instantaneous offline recognition.`);
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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Principle Banner */}
      <div className="bg-gradient-to-r from-blue-900/30 via-dark-800 to-dark-800 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">
              Human-in-the-Loop AI Governance Layer
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>Core Assurance Principle:</strong> AI models never decide security compliance.
              When an unfamiliar or white-box syntax is detected, the AI proposes an initial
              structural normalization. A human auditor reviews and approves it. Once approved, the
              structural fingerprint is cached so future configs of that dialect parse
              deterministically.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center space-x-3 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center space-x-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-12 text-center space-y-3">
          <Cpu className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Pending AI Normalization Proposals</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            All uploaded configs either matched known deterministic parsers (Cisco, FortiOS) or had
            previously approved dialect fingerprints.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span>Pending Review Queue ({mappings.length})</span>
          </h3>

          {mappings.map((m) => (
            <div key={m.id} className="bg-dark-800 border border-dark-600 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-dark-700 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-base">Proposal #{m.id}</span>
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                      Guessed: {m.vendor_guessed}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Confidence: {(m.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Fingerprint: {m.fingerprint_hash.substring(0, 24)}...
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    disabled={processingId === m.id}
                    onClick={() => handleReject(m.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-rose-400 border border-dark-500 text-xs font-medium rounded-lg transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    disabled={processingId === m.id}
                    onClick={() => handleApprove(m)}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Cache Dialect</span>
                  </button>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                    Raw Unfamiliar Syntax:
                  </span>
                  <pre className="bg-dark-900 border border-dark-600 rounded-lg p-3 text-xs font-mono text-slate-300 mt-1 max-h-80 overflow-y-auto">
                    {m.config_sample || 'No raw sample available.'}
                  </pre>
                </div>

                <div>
                  <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                    AI-Proposed Neutral Schema Mapping:
                  </span>
                  <pre className="bg-dark-900 border border-dark-600 rounded-lg p-3 text-xs font-mono text-cyan-300 mt-1 max-h-80 overflow-y-auto">
                    {JSON.stringify(m.proposed_schema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
