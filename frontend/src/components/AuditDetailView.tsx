import React, { useState, useEffect } from 'react';
import { AuditDetail, Finding } from '../types';
import { fetchAuditDetail, getReportUrl } from '../api/client';
import {
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Zap, 
  Network,
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Code, 
  CornerDownRight,
  Copy,
  Check,
  Search,
  Filter,
  ArrowLeft,
  Share2,
  Terminal,
  FileCheck
} from 'lucide-react';

interface AuditDetailViewProps {
  auditId: number;
}

export const AuditDetailView: React.FC<AuditDetailViewProps> = ({ auditId }) => {
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [frameworkFilter, setFrameworkFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected finding for evidence snippet drawer
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [copiedRemediation, setCopiedRemediation] = useState(false);

  useEffect(() => {
    loadAudit();
  }, [auditId]);

  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditDetail(auditId);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit detail');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRemediation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRemediation(true);
    setTimeout(() => setCopiedRemediation(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading Audit Run #{auditId}...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl max-w-xl mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
        <p className="font-semibold text-sm">{error || 'Audit record not found'}</p>
        <button
          onClick={loadAudit}
          className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-white px-3 py-1.5 rounded-lg transition font-mono"
        >
          Retry Inspection
        </button>
      </div>
    );
  }

  const { audit, findings, attack_paths, single_fix_recommendation } = detail;

  const filteredFindings = findings.filter((f) => {
    if (frameworkFilter !== 'ALL' && f.framework !== frameworkFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter.toLowerCase()) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return f.title.toLowerCase().includes(q) || f.rule_id.toLowerCase().includes(q) || (f.explanation && f.explanation.toLowerCase().includes(q));
    }
    return true;
  });

  const passCount = findings.filter(f => f.status === 'pass').length;
  const failCount = findings.filter(f => f.status === 'fail').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Pinecone Breadcrumbs & Top Section */}
      <div className="border-b border-[#22262F] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1 font-mono">
            <span>Indexes</span>
            <span>/</span>
            <span className="text-slate-200">{audit.hostname}</span>
            <span>/</span>
            <span className="text-emerald-400">audit-{audit.id}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-mono tracking-tight">{audit.hostname}</h1>
            <span className="px-2.5 py-0.5 text-xs font-mono rounded-md bg-[#1A1D24] text-slate-300 border border-[#2C313B]">
              {audit.vendor}
            </span>
            <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Deterministic Engine
            </span>
          </div>
          <p className="text-xs text-[#9AA2B0] mt-1.5 font-mono">
            Evaluated at {new Date(audit.started_at).toLocaleString()} &bull; {findings.length} total controls evaluated
          </p>
        </div>

        {/* Score & Export Button */}
        <div className="flex items-center space-x-4">
          <div className="bg-[#12141A] border border-[#22262F] rounded-xl px-4 py-2.5 flex items-center space-x-3 shadow-pinecone">
            <div>
              <div className="text-[10px] text-[#9AA2B0] uppercase font-semibold tracking-wider">Compliance</div>
              <div className={`text-2xl font-extrabold font-mono ${
                audit.score >= 80 ? 'text-emerald-400' : audit.score >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {audit.score}%
              </div>
            </div>
            <div className="h-8 w-px bg-[#22262F]"></div>
            <div className="text-xs space-y-0.5">
              <div className="text-emerald-400 font-mono font-semibold">{passCount} Pass</div>
              <div className="text-rose-400 font-mono font-semibold">{failCount} Fail</div>
            </div>
          </div>

          <a
            href={getReportUrl(audit.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 bg-white hover:bg-neutral-200 text-neutral-900 font-semibold px-4 py-2.5 rounded-lg text-xs transition shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>Export Report</span>
          </a>
        </div>
      </div>

      {/* Strategic Threat Severance Recommendation (Pinecone Highlight Card) */}
      {single_fix_recommendation && (
        <div className="bg-gradient-to-r from-[#0A2018] via-[#12141A] to-[#12141A] border border-emerald-500/40 rounded-xl p-6 shadow-pinecone-glow relative overflow-hidden">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-2 font-mono">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Strategic Threat Severance Recommendation</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Single Fix That Dismantles the Most Threat Chains
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {single_fix_recommendation.why}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-[#0A0C0F] border border-[#22262F] p-3.5 rounded-lg">
              <span className="text-[11px] text-[#9AA2B0] uppercase tracking-wider font-semibold">Target Control</span>
              <div className="font-semibold text-white text-xs mt-1 truncate">
                {single_fix_recommendation.rule_title}
              </div>
              <code className="text-xs text-emerald-400 font-mono mt-0.5 block">{single_fix_recommendation.rule_id}</code>
            </div>

            <div className="bg-[#0A0C0F] border border-[#22262F] p-3.5 rounded-lg">
              <span className="text-[11px] text-[#9AA2B0] uppercase tracking-wider font-semibold">Threat Chains Severed</span>
              <div className="font-bold text-emerald-400 text-lg font-mono mt-0.5">
                {single_fix_recommendation.paths_broken_count} of {attack_paths.length} chains
              </div>
              <span className="text-[11px] text-slate-400">
                Leaves only {single_fix_recommendation.remaining_paths_count} active vector
              </span>
            </div>

            <div className="bg-[#0A0C0F] border border-[#22262F] p-3.5 rounded-lg">
              <span className="text-[11px] text-[#9AA2B0] uppercase tracking-wider font-semibold">Impact Score Gain</span>
              <div className="font-bold text-amber-400 text-lg font-mono mt-0.5">
                +{single_fix_recommendation.impact_score} pts
              </div>
              <span className="text-[11px] text-slate-400">Deterministic security boost</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider font-mono">
                Exact Remediation Script:
              </span>
              <button
                onClick={() => handleCopyRemediation(single_fix_recommendation.remediation)}
                className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-[#1A1D24] hover:bg-[#262B35] px-2.5 py-1 rounded border border-[#2C313B] transition font-mono"
              >
                {copiedRemediation ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy CLI Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3.5 text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed">
              {single_fix_recommendation.remediation}
            </pre>
          </div>
        </div>
      )}

      {/* Correlated Attack Paths Section */}
      {attack_paths.length > 0 && (
        <div className="bg-[#12141A] border border-[#22262F] rounded-xl p-6 space-y-4 shadow-pinecone">
          <div className="flex items-center justify-between border-b border-[#22262F] pb-4">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-orange-400" />
              <h3 className="font-bold text-white text-sm">
                Correlated Exploit Attack Chains ({attack_paths.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Multi-stage graph narrative</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attack_paths.map((path) => (
              <div
                key={path.chain_id}
                className="bg-[#0A0C0F] border border-[#22262F] hover:border-[#2C313B] rounded-lg p-4 space-y-2.5 transition"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-white text-xs pr-2">{path.name}</h4>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                    {path.severity}
                  </span>
                </div>
                <p className="text-xs text-[#9AA2B0] leading-relaxed">{path.narrative}</p>

                <div className="border-t border-[#262B35] pt-2 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
                    <CornerDownRight className="w-3 h-3 text-slate-500" />
                    <span>Prerequisite Findings:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {path.finding_rule_ids.map((rid) => (
                      <span
                        key={rid}
                        className="px-2 py-0.5 bg-[#12141A] text-[10px] font-mono text-rose-300 rounded border border-rose-500/20"
                      >
                        {rid}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinecone Findings Table Section with Interactive Filtering */}
      <div className="bg-[#12141A] border border-[#22262F] rounded-xl overflow-hidden shadow-pinecone">
        <div className="p-4 border-b border-[#22262F] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-white text-sm">Deterministic Compliance Evaluations</h3>
              <p className="text-[11px] text-[#9AA2B0]">
                Showing {filteredFindings.length} of {findings.length} evaluated rules
              </p>
            </div>

            {/* Search Input for Rules */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter rules by title or ID..."
                className="w-full bg-[#0A0C0F] border border-[#22262F] focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Framework Filter */}
            <div className="flex items-center space-x-1 bg-[#0A0C0F] p-0.5 rounded-lg border border-[#22262F]">
              {['ALL', 'CIS', 'NIST-800-53', 'DISA-STIG'].map((fw) => (
                <button
                  key={fw}
                  onClick={() => setFrameworkFilter(fw)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    frameworkFilter === fw
                      ? 'bg-[#22262F] text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center space-x-1 bg-[#0A0C0F] p-0.5 rounded-lg border border-[#22262F]">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    severityFilter === sev
                      ? 'bg-[#22262F] text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-[#0A0C0F] p-0.5 rounded-lg border border-[#22262F]">
              {['ALL', 'FAIL', 'PASS'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    statusFilter === st
                      ? 'bg-[#22262F] text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Findings List */}
        <div className="divide-y divide-[#22262F]/60">
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No compliance rules match the current filters.
            </div>
          ) : (
            filteredFindings.map((f) => {
              const isFailed = f.status === 'fail';
              return (
                <div
                  key={f.rule_id}
                  className="p-4 hover:bg-[#1A1D24]/80 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-emerald-400">{f.rule_id}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-[#0A0C0F] text-slate-400 border border-[#22262F]">
                        {f.framework}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase font-mono px-1.5 py-0.2 rounded ${
                          f.severity === 'critical'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : f.severity === 'high'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : f.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white tracking-tight">{f.title}</h4>
                    <p className="text-[11px] text-[#9AA2B0] leading-relaxed">{f.explanation}</p>
                  </div>

                  <div className="flex items-center space-x-4 flex-shrink-0">
                    {/* Status Pill */}
                    <div className="flex items-center space-x-1.5">
                      {isFailed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          FAIL
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          PASS
                        </span>
                      )}
                    </div>

                    {/* Evidence Snippet Trigger */}
                    {f.evidence && f.evidence.line_start && (
                      <button
                        onClick={() => setSelectedFinding(f)}
                        className="flex items-center space-x-1 text-xs bg-[#0A0C0F] hover:bg-[#1A1D24] text-slate-300 px-2.5 py-1.5 rounded-lg border border-[#22262F] transition font-mono"
                      >
                        <Code className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Line {f.evidence.line_start}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Evidence Modal / Slideover */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#12141A] border border-[#2C313B] rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-[#22262F] pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Configuration Evidence</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Rule: {selectedFinding.rule_id} &bull; Lines {selectedFinding.evidence?.line_start}-
                  {selectedFinding.evidence?.line_end || selectedFinding.evidence?.line_start}
                </p>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-[#22262F] transition"
              >
                &times; Close
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider font-mono">
                Running Config Snippet:
              </span>
              <pre className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                {selectedFinding.evidence?.snippet || 'No raw snippet captured.'}
              </pre>
            </div>

            {selectedFinding.remediation && (
              <div className="space-y-1">
                <span className="text-[11px] uppercase font-semibold text-[#9AA2B0] tracking-wider font-mono">
                  Recommended CLI Fix:
                </span>
                <pre className="bg-[#0A0C0F] border border-[#22262F] rounded-lg p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                  {selectedFinding.remediation}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
// test
