import React, { useState, useEffect } from 'react';
import { AuditDetail, Finding } from '../types';
import { fetchAuditDetail, getReportUrl } from '../api/client';
import {
  ShieldCheck, AlertTriangle, ExternalLink, Zap, Network,
  ChevronDown, ChevronRight, CheckCircle, XCircle, Code, CornerDownRight
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

  // Selected finding for evidence snippet drawer
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl">
        <p>{error || 'Audit record not found'}</p>
      </div>
    );
  }

  const { audit, findings, attack_paths, single_fix_recommendation } = detail;

  const filteredFindings = findings.filter((f) => {
    if (frameworkFilter !== 'ALL' && f.framework !== frameworkFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter.toLowerCase()) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white font-mono">{audit.hostname}</h2>
            <span className="px-2.5 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
              {audit.vendor}
            </span>
            <span className="text-xs text-slate-400">Audit #{audit.id}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            File: <code className="text-slate-300">{detail.audit.status}</code> &bull; Started:{' '}
            {new Date(audit.started_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-semibold">Compliance Score</div>
            <div
              className={`text-3xl font-extrabold ${
                audit.score >= 80 ? 'text-emerald-400' : audit.score >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {audit.score}%
            </div>
          </div>
          <a
            href={getReportUrl(audit.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 bg-dark-700 hover:bg-dark-600 text-slate-200 px-4 py-2.5 rounded-lg border border-dark-500 transition text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Export Auditor Report</span>
          </a>
        </div>
      </div>

      {/* Differentiator Hero: Single Key Fix that breaks most paths */}
      {single_fix_recommendation && (
        <div className="bg-gradient-to-r from-blue-950/80 via-dark-800 to-dark-800 border-2 border-blue-500/60 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Strategic Threat Severance Recommendation</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Single Fix That Dismantles the Most Threat Chains
          </h3>
          <p className="text-sm text-slate-300 mb-4">{single_fix_recommendation.why}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-dark-900/80 border border-dark-600 p-3 rounded-lg">
              <span className="text-xs text-slate-400">Target Rule:</span>
              <div className="font-semibold text-white text-sm mt-0.5">
                {single_fix_recommendation.rule_title}
              </div>
              <code className="text-xs text-blue-400 font-mono">{single_fix_recommendation.rule_id}</code>
            </div>

            <div className="bg-dark-900/80 border border-dark-600 p-3 rounded-lg">
              <span className="text-xs text-slate-400">Chains Neutralized:</span>
              <div className="font-bold text-emerald-400 text-lg mt-0.5">
                {single_fix_recommendation.paths_broken_count} of {attack_paths.length} chains
              </div>
              <span className="text-[11px] text-slate-400">
                Leaves only {single_fix_recommendation.remaining_paths_count} remaining
              </span>
            </div>

            <div className="bg-dark-900/80 border border-dark-600 p-3 rounded-lg">
              <span className="text-xs text-slate-400">Impact Score:</span>
              <div className="font-bold text-amber-400 text-lg mt-0.5">
                +{single_fix_recommendation.impact_score} pts
              </div>
              <span className="text-[11px] text-slate-400">Threat reduction index</span>
            </div>
          </div>

          <div>
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Exact Remediation Commands:
            </span>
            <pre className="bg-dark-900 border border-dark-600 rounded-lg p-3 text-xs text-emerald-400 font-mono mt-1 overflow-x-auto">
              {single_fix_recommendation.remediation}
            </pre>
          </div>
        </div>
      )}

      {/* Attack Paths Correlation Section */}
      {attack_paths.length > 0 && (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-white text-lg">
                Correlated Attack Paths ({attack_paths.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Chained multi-stage exploit narratives</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attack_paths.map((path) => (
              <div
                key={path.chain_id}
                className="bg-dark-900 border border-dark-600 rounded-lg p-4 space-y-3 relative hover:border-dark-500 transition"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-white text-sm pr-2">{path.name}</h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                    {path.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{path.narrative}</p>

                <div className="border-t border-dark-700 pt-2 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <CornerDownRight className="w-3 h-3 text-slate-500" />
                    <span>Prerequisite Findings:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {path.finding_rule_ids.map((rid) => (
                      <span
                        key={rid}
                        className="px-1.5 py-0.5 bg-dark-800 text-[10px] font-mono text-rose-300 rounded border border-rose-500/20"
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

      {/* Findings Table Section with Interactive Filtering */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-dark-600 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-bold text-white text-lg">Compliance Control Evaluations</h3>
            <span className="text-xs text-slate-400">
              Showing {filteredFindings.length} of {findings.length} controls
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Framework */}
            <div className="flex items-center space-x-1 bg-dark-900 p-1 rounded-lg border border-dark-600">
              {['ALL', 'CIS', 'NIST-800-53', 'DISA-STIG'].map((fw) => (
                <button
                  key={fw}
                  onClick={() => setFrameworkFilter(fw)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    frameworkFilter === fw ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>

            {/* Severity */}
            <div className="flex items-center space-x-1 bg-dark-900 p-1 rounded-lg border border-dark-600">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1 rounded-md transition ${
                    severityFilter === sev ? 'bg-dark-700 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Status */}
            <div className="flex items-center space-x-1 bg-dark-900 p-1 rounded-lg border border-dark-600">
              {['ALL', 'FAIL', 'PASS'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded-md transition ${
                    statusFilter === st ? 'bg-dark-700 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Findings List */}
        <div className="divide-y divide-dark-600">
          {filteredFindings.map((f) => {
            const isFailed = f.status === 'fail';
            return (
              <div
                key={f.rule_id}
                className="p-4 hover:bg-dark-700/30 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-blue-400">{f.rule_id}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-dark-900 text-slate-400 border border-dark-600">
                      {f.framework}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        f.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400'
                          : f.severity === 'high'
                          ? 'bg-orange-500/20 text-orange-400'
                          : f.severity === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white">{f.title}</h4>
                  <p className="text-xs text-slate-400">{f.explanation}</p>
                </div>

                <div className="flex items-center space-x-4 flex-shrink-0">
                  {/* Status */}
                  <div className="flex items-center space-x-1.5">
                    {isFailed ? (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold text-rose-400 uppercase">FAILED</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase">PASSED</span>
                      </>
                    )}
                  </div>

                  {/* Evidence Trigger */}
                  {f.evidence && f.evidence.line_start && (
                    <button
                      onClick={() => setSelectedFinding(f)}
                      className="flex items-center space-x-1 text-xs bg-dark-900 hover:bg-dark-700 text-slate-300 px-2.5 py-1.5 rounded border border-dark-600 transition"
                    >
                      <Code className="w-3.5 h-3.5 text-blue-400" />
                      <span>Line {f.evidence.line_start}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence Drawer Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 border border-dark-600 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-lg">Configuration Evidence</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Rule: {selectedFinding.rule_id} &bull; Lines {selectedFinding.evidence?.line_start}-
                  {selectedFinding.evidence?.line_end || selectedFinding.evidence?.line_start}
                </p>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times; Close
              </button>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                Extracted Snippet from Running Config:
              </span>
              <pre className="bg-dark-900 border border-dark-600 rounded-lg p-4 font-mono text-xs text-emerald-400 mt-2 overflow-x-auto">
                {selectedFinding.evidence?.snippet || 'No raw snippet captured.'}
              </pre>
            </div>

            {selectedFinding.remediation && (
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  Remediation Fix:
                </span>
                <pre className="bg-dark-900 border border-dark-600 rounded-lg p-3 font-mono text-xs text-blue-300 mt-2 overflow-x-auto">
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
