import React, { useState, useEffect } from 'react';
import { AttackPath, AuditDetail } from '../types';
import { fetchAuditDetail } from '../api/client';
import {
  ArrowLeft,
  ShieldAlert,
  GitFork,
  Zap
} from 'lucide-react';

interface AttackPathGraphProps {
  auditId: number;
  onBack?: () => void;
}

export const AttackPathGraph: React.FC<AttackPathGraphProps> = ({ auditId, onBack }) => {
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAuditDetail(auditId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load attack paths');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3 font-mono">
        <div className="w-10 h-10 border-4 border-[#171717] border-t-transparent animate-spin"></div>
        <p className="text-xs text-[#5E5E5E] tracking-widest uppercase">CORRELATING ATTACK PATHS...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 bg-[#D64545] text-white font-mono text-xs trinetra-chamfer space-y-3">
        <div className="font-bold uppercase text-sm font-display">ATTACK PATH ERROR</div>
        <div>{error || 'Audit not found'}</div>
      </div>
    );
  }

  const { audit, attack_paths, single_fix_recommendation } = detail;
  const paths: AttackPath[] = attack_paths || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#B9B9B4] pb-5">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-mono font-bold text-[#171717] hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>BACK TO AUDIT</span>
              </button>
            )}
            <span className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
              ATTACK PATH WORKSPACE &bull; #{audit.id}
            </span>
          </div>

          <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5 flex items-center space-x-3">
            <span>{audit.hostname}</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#D64545] text-white">
              {paths.length} ACTIVE PATHS
            </span>
          </h1>
          <p className="text-xs text-[#5E5E5E] font-sans mt-1">
            Correlated multi-stage exploit chains linking rule violations into actionable attack stories.
          </p>
        </div>
      </div>

      {/* Single Key Fix Highlight Box */}
      {single_fix_recommendation && (
        <div className="bg-[#171717] text-[#F1F1EF] border border-[#232323] trinetra-chamfer p-5 space-y-2 shadow-sm font-mono">
          <div className="flex items-center space-x-2 text-xs text-[#00A86B] font-bold tracking-widest uppercase">
            <Zap className="w-4 h-4 text-[#00A86B]" />
            <span>SINGLE KEY FIX (OPTIMAL REMEDIATION MOVE)</span>
          </div>
          <code className="block bg-[#000000] p-3 text-sm text-[#00A86B] border border-[#232323] overflow-x-auto">
            {single_fix_recommendation.remediation}
          </code>
          <p className="text-[11px] text-[#B9B9B4]">
            Dismantles <strong className="text-white">{single_fix_recommendation.paths_broken_count}</strong> attack paths simultaneously.
          </p>
        </div>
      )}

      {/* Graph Area */}
      {paths.length === 0 ? (
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-12 text-center space-y-3 font-mono">
          <ShieldAlert className="w-10 h-10 text-[#00A86B] mx-auto" />
          <div className="font-bold text-sm text-[#171717]">NO ACTIVE ATTACK PATHS DETECTED</div>
          <div className="text-xs text-[#5E5E5E]">Device configuration has passed critical chain correlation.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {paths.map((p, idx) => (
            <div key={idx} className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-5 space-y-4 shadow-sm font-mono">
              <div className="flex items-center justify-between border-b border-[#B9B9B4] pb-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-[#D64545] text-white uppercase">
                    PATH #{idx + 1} &bull; {p.severity}
                  </span>
                  <span className="font-bold text-sm text-[#171717]">{p.name}</span>
                </div>
                <span className="text-xs text-[#5E5E5E]">CHAIN LENGTH: {p.finding_rule_ids?.length || 0} STEPS</span>
              </div>

              {/* Exploit Steps Visualization */}
              <div className="p-4 bg-[#171717] border border-[#232323] space-y-3">
                <div className="text-[10px] text-[#B9B9B4] tracking-widest uppercase font-bold">
                  EXPLOIT CHAIN NARRATIVE:
                </div>
                <p className="text-xs text-[#F1F1EF] leading-relaxed font-sans">
                  {p.narrative}
                </p>

                {/* Steps Nodes Diagram */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#232323]">
                  {p.finding_rule_ids?.map((fId, fIdx) => (
                    <React.Fragment key={fIdx}>
                      <div className="bg-[#232323] border border-[#3A3A3A] p-2 text-xs font-mono text-white flex items-center space-x-2">
                        <span className="w-5 h-5 bg-[#D64545] text-white font-bold flex items-center justify-center text-[10px]">
                          {fIdx + 1}
                        </span>
                        <span>{fId}</span>
                      </div>
                      {fIdx < (p.finding_rule_ids.length - 1) && (
                        <span className="text-[#00A86B] font-bold text-sm">&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Break Rule / Severance Command for this path */}
              {p.break_why && (
                <div className="bg-[#EAEAE7] border border-[#B9B9B4] p-3 text-xs space-y-1">
                  <div className="text-[10px] text-[#5E5E5E] font-bold uppercase">SEVERANCE RATIONALE:</div>
                  <div className="text-xs font-bold text-[#171717]">{p.break_why}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};