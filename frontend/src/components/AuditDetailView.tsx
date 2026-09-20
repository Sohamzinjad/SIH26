import React, { useState, useEffect } from 'react';
import { AuditDetail, Finding } from '../types';
import { fetchAuditDetail, getReportUrl, waiveFinding, unwaiveFinding } from '../api/client';
import {
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Zap, 
  GitFork,
  CheckCircle, 
  XCircle, 
  Code, 
  Copy,
  Check,
  Search,
  Terminal,
  FileCheck,
  History,
  Shield,
  Info
} from 'lucide-react';

interface AuditDetailViewProps {
  auditId: number;
  onViewDeviceHistory?: (deviceId: number) => void;
  onViewAttackPath?: (auditId: number) => void;
}

export const AuditDetailView: React.FC<AuditDetailViewProps> = ({ auditId, onViewDeviceHistory, onViewAttackPath }) => {
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
    } fontally: {
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
      <div className="flex flex-col justify-center items-center h-96 space-y-3 font-mono">
        <div className="w-10 h-10 border-4 border-[#171717] border-t-transparent animate-spin"></div>
        <p className="text-xs text-[#5E5E5E] tracking-widest uppercase">LOADING AUDIT #{auditId}...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 bg-[#D64545] text-white font-mono text-xs trinetra-chamfer space-y-3">
        <div className="font-bold uppercase text-sm">AUDIT LOAD ERROR</div>
        <div>{error || 'Audit not found'}</div>
      </div>
    );
  }

  const { audit, findings, single_fix_recommendation, attack_paths } = detail;

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.rule_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = frameworkFilter === 'ALL' || f.framework === frameworkFilter;
    const matchesSeverity = severityFilter === 'ALL' || f.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'FAIL' && f.status === 'fail') ||
      (statusFilter === 'PASS' && f.status === 'pass');

    return matchesSearch && matchesFramework && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#B9B9B4] pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
            AUDIT INSPECTOR &bull; #{audit.id}
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5 flex items-center space-x-3">
            <span>{audit.hostname}</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#171717] text-white">
              {audit.vendor}
            </span>
          </h1>
          <p className="text-xs text-[#5E5E5E] font-sans mt-1">
            Executed on {audit.started_at} &bull; Score: <strong className="text-[#171717] font-mono">{audit.score}%</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          {onViewAttackPath && (
            <button
              onClick={() => onViewAttackPath(audit.id)}
              className="bg-[#D4A017] text-white font-bold px-4 py-2 trinetra-chamfer hover:bg-[#b58711] transition flex items-center space-x-2"
            >
              <GitFork className="w-4 h-4" />
              <span>ATTACK PATHS ({attack_paths?.length || 0})</span>
            </button>
          )}

          <a
            href={getReportUrl(audit.id)}
            target="_blank"
            rel="noreferrer"
            className="bg-[#171717] text-white font-bold px-4 py-2 trinetra-chamfer hover:bg-[#232323] transition flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>EXPORT REPORT</span>
          </a>
        </div>
      </div>

      {/* Single Key Fix Hero Banner (if present) */}
      {single_fix_recommendation && (
        <div className="bg-[#171717] text-[#F1F1EF] border border-[#232323] trinetra-chamfer p-5 space-y-2 shadow-sm font-mono">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2 text-xs text-[#00A86B] font-bold tracking-widest uppercase">
              <Zap className="w-4 h-4 text-[#00A86B]" />
              <span>SINGLE KEY FIX (MAXIMUM LEVERAGE REMEDIATION)</span>
            </div>
            <button
              onClick={() => handleCopyRemediation(single_fix_recommendation.remediation)}
              className="text-[11px] bg-[#232323] hover:bg-[#3A3A3A] text-white px-2.5 py-1 border border-[#3A3A3A] flex items-center space-x-1"
            >
              {copiedRemediation ? <Check className="w-3.5 h-3.5 text-[#00A86B]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRemediation ? 'COPIED' : 'COPY COMMAND'}</span>
            </button>
          </div>

          <code className="block bg-[#000000] p-3 text-sm text-[#00A86B] border border-[#232323] overflow-x-auto">
            {single_fix_recommendation.remediation}
          </code>

          <div className="text-[11px] text-[#B9B9B4] flex items-center space-x-4 pt-1">
            <span>Dismantles <strong className="text-white">{single_fix_recommendation.paths_broken_count}</strong> attack paths</span>
            <span>&bull;</span>
            <span>Rule: <strong className="text-white">{single_fix_recommendation.rule_id}</strong> ({single_fix_recommendation.rule_title})</span>
          </div>
        </div>
      )}

      {/* Main Grid: Findings Table + Config Evidence Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Findings Table */}
        <div className="lg:col-span-7 bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-4 shadow-sm">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-[#B9B9B4] pb-3 font-mono text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E5E5E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings..."
                className="w-full bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] pl-8 pr-3 py-1 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] px-2 py-1 focus:outline-none"
              >
                <option value="ALL">ALL STATUS</option>
                <option value="FAIL">FAIL</option>
                <option value="PASS">PASS</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] px-2 py-1 focus:outline-none"
              >
                <option value="ALL">ALL SEVERITY</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-[#5E5E5E] border-b border-[#B9B9B4] uppercase">
                <tr>
                  <th className="py-2 px-3">Rule ID</th>
                  <th className="py-2 px-3">Title / Control</th>
                  <th className="py-2 px-3">Framework</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9B9B4]/40">
                {filteredFindings.map((f) => {
                  const isSelected = selectedFinding?.rule_id === f.rule_id;
                  return (
                    <tr
                      key={f.rule_id}
                      onClick={() => setSelectedFinding(f)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-[#171717] text-white' : 'hover:bg-[#EAEAE7] text-[#171717]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[11px]">{f.rule_id}</td>
                      <td className="py-2.5 px-3 font-medium truncate max-w-[200px]">{f.title}</td>
                      <td className={`py-2.5 px-3 text-[11px] ${isSelected ? 'text-[#B9B9B4]' : 'text-[#5E5E5E]'}`}>{f.framework}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                          f.severity === 'critical' ? 'bg-[#D64545] text-white' : f.severity === 'high' ? 'bg-[#D4A017] text-white' : 'bg-[#0057B8] text-white'
                        }`}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold text-[10px] uppercase ${
                          f.status === 'pass' ? 'text-[#00A86B]' : 'text-[#D64545]'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {f.evidence?.line_start ? `#${f.evidence.line_start}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Config Evidence Viewer */}
        <div className="lg:col-span-5 bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-3 shadow-sm font-mono">
          <div className="flex justify-between items-center border-b border-[#B9B9B4] pb-2 text-xs font-bold text-[#171717]">
            <span>LINE EVIDENCE & CODE VIEWER</span>
            {selectedFinding && (
              <span className="text-[#00A86B]">RULE #{selectedFinding.rule_id}</span>
            )}
          </div>

          {selectedFinding ? (
            <div className="space-y-3">
              <div className="bg-[#EAEAE7] border border-[#B9B9B4] p-3 text-xs space-y-1">
                <div className="font-bold text-[#171717]">{selectedFinding.title}</div>
                <div className="text-[11px] text-[#5E5E5E]">{selectedFinding.explanation || selectedFinding.rule_id}</div>
              </div>

              {/* Code Snippet */}
              {selectedFinding.evidence?.snippet ? (
                <div className="bg-[#171717] text-[#00A86B] p-3 border border-[#232323] h-64 overflow-y-auto text-xs leading-relaxed font-mono">
                  <pre>{selectedFinding.evidence.snippet}</pre>
                </div>
              ) : (
                <div className="bg-[#171717] text-[#B9B9B4] p-4 border border-[#232323] text-xs">
                  No direct line snippet returned for this rule check.
                </div>
              )}

              {/* Remediation Snippet */}
              {selectedFinding.remediation && (
                <div className="bg-[#171717] text-white p-3 border border-[#232323] space-y-1">
                  <div className="text-[10px] text-[#00A86B] font-bold uppercase">REMEDIATION COMMAND:</div>
                  <code className="text-xs text-[#00A86B] block">{selectedFinding.remediation}</code>
                </div>
              )}
            </div>
          ) : (
            <div className="h-80 flex flex-col justify-center items-center text-center p-6 text-[#5E5E5E] text-xs">
              <Code className="w-8 h-8 mb-2 text-[#5E5E5E]" />
              <p className="font-bold">Select a finding on the left to view exact line-level evidence</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
