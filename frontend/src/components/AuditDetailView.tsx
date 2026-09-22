import React, { useState, useEffect } from 'react';
import { AuditDetail, Finding } from '../types';
import { fetchAuditDetail, getReportUrl } from '../api/client';
import {
  ExternalLink,
  Zap,
  GitFork,
  Copy,
  Check,
  Search,
  Code,
  ArrowLeft,
  Workflow,
} from 'lucide-react';

interface AuditDetailViewProps {
  auditId: number;
  onViewDeviceHistory?: (deviceId: number) => void;
  onViewAttackPath?: (auditId: number) => void;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AuditDetailView: React.FC<AuditDetailViewProps> = ({ auditId, onViewDeviceHistory, onViewAttackPath, onBack, onNavigateTab }) => {
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
        <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
        <p className="font-mono text-xs text-faint tracking-[0.18em] uppercase">Loading audit #{auditId}…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="banner banner-error space-y-2">
        <div className="font-bold uppercase text-sm">Audit load error</div>
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

  const severityBadge = (sev: string) => {
    if (sev === 'critical') return <span className="badge badge-critical">{sev}</span>;
    if (sev === 'high') return <span className="badge badge-high">{sev}</span>;
    if (sev === 'medium') return <span className="badge badge-medium">{sev}</span>;
    return <span className="badge badge-low">{sev}</span>;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Top Back Navigation Bar */}
      {onBack && (
        <div>
          <button onClick={onBack} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to previous module
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="kicker mb-3">Audit inspector &bull; #{audit.id}</div>
          <h1 className="font-display font-bold text-h1 tracking-tight text-ink flex flex-wrap items-center gap-3">
            <span>{audit.hostname}</span>
            <span className="badge badge-neutral uppercase">{audit.vendor}</span>
          </h1>
          <p className="mt-3 text-body text-muted">
            Executed on {audit.started_at} &bull; Score:{' '}
            <strong className="font-mono text-ink">{audit.score}%</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onViewAttackPath && (
            <button
              onClick={() => onViewAttackPath(audit.id)}
              className="btn btn-ghost"
            >
              <GitFork className="w-4 h-4" />
              Attack Paths ({attack_paths?.length || 0})
            </button>
          )}

          <a
            href={getReportUrl(audit.id)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-solid"
          >
            <ExternalLink className="w-4 h-4" />
            Export Report
          </a>
        </div>
      </div>

      {/* Pending AI Mapping Banner (if unknown dialect file) */}
      {audit.status === 'PENDING_AI_MAPPING' && (
        <div className="banner border-2 !border-high/70 bg-high/10 space-y-4">
          <div className="flex items-center gap-2 font-bold text-high">
            <Zap className="w-4 h-4" />
            Unknown vendor dialect &bull; pending AI mapping approval
          </div>
          <p className="text-caption text-muted">
            This configuration file (<strong className="text-ink">{audit.hostname}</strong>) belongs
            to an unmapped vendor dialect. Compliance rules cannot be evaluated until an analyst
            approves the AI proposal in the Mappings module.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('mappings')}
                className="btn btn-primary btn-sm"
              >
                <Workflow className="w-4 h-4" />
                Review &amp; approve in Mappings
              </button>
            )}
            {onBack && (
              <button onClick={onBack} className="btn btn-ghost btn-sm">
                &larr; Back to Fleet Audit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Single Key Fix Hero Banner (if present) */}
      {single_fix_recommendation && (
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-widest text-ok">
              <Zap className="w-4 h-4" />
              Single key fix &bull; maximum leverage remediation
            </div>
            <button
              onClick={() => handleCopyRemediation(single_fix_recommendation.remediation)}
              className="btn btn-ghost btn-sm"
            >
              {copiedRemediation ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedRemediation ? 'Copied' : 'Copy command'}
            </button>
          </div>

          <code className="block code-surface p-4 text-sm text-ok font-mono">
            {single_fix_recommendation.remediation}
          </code>

          <div className="text-caption text-muted flex items-center gap-4">
            <span>
              Dismantles <strong className="text-ink">{single_fix_recommendation.paths_broken_count}</strong> attack paths
            </span>
            <span className="text-faint">&bull;</span>
            <span>
              Rule: <strong className="text-ink">{single_fix_recommendation.rule_id}</strong> ({single_fix_recommendation.rule_title})
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Findings Table + Config Evidence Drawer
          NOTE: dense read area — decorative shapes and entrance motion are intentionally absent. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Findings Table */}
        <div className="lg:col-span-7 card p-4 sm:p-5 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings..."
                className="field pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="field !w-auto"
              >
                <option value="ALL">All Status</option>
                <option value="FAIL">Fail</option>
                <option value="PASS">Pass</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="field !w-auto"
              >
                <option value="ALL">All Severity</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value)}
                className="field !w-auto hidden xl:block"
              >
                <option value="ALL">All Frameworks</option>
                {Array.from(new Set(findings.map((f) => f.framework))).map((fw) => (
                  <option key={fw} value={fw}>{fw}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Title / Control</th>
                  <th>Framework</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th className="text-right">Line</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((f) => {
                  const isSelected = selectedFinding?.rule_id === f.rule_id;
                  return (
                    <tr
                      key={f.rule_id}
                      onClick={() => setSelectedFinding(f)}
                      className={`row-hover cursor-pointer transition-colors duration-100 ${
                        isSelected ? '!bg-accent-soft' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold font-mono text-[12px] text-ink">{f.rule_id}</td>
                      <td className="py-2.5 px-3 font-medium truncate max-w-[200px] text-ink">{f.title}</td>
                      <td className={`py-2.5 px-3 text-[12px] ${isSelected ? 'text-muted' : 'text-faint'}`}>{f.framework}</td>
                      <td className="py-2.5 px-3">{severityBadge(f.severity)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold text-[11px] uppercase ${f.status === 'pass' ? 'text-ok' : 'text-crit'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-muted">
                        {f.evidence?.line_start ? `#${f.evidence.line_start}` : '-'}
                      </td>
                    </tr>
                  );
                })}

                {filteredFindings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      No findings match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Config Evidence Viewer */}
        <div className="lg:col-span-5 card p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-center py-1 font-mono text-[12px] font-bold text-ink">
            <span>Line evidence &amp; code viewer</span>
            {selectedFinding && (
              <span className="badge badge-accent">Rule #{selectedFinding.rule_id}</span>
            )}
          </div>

          {selectedFinding ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-surface-2 border border-white/10 p-4 space-y-1.5">
                <div className="text-[15px] font-semibold text-ink">{selectedFinding.title}</div>
                <div className="text-caption text-muted">{selectedFinding.explanation || selectedFinding.rule_id}</div>
              </div>

              {/* Code Snippet */}
              {selectedFinding.evidence?.snippet ? (
                <div className="code-surface h-64 overflow-y-auto p-4 text-ok">
                  <pre>{selectedFinding.evidence.snippet}</pre>
                </div>
              ) : (
                <div className="code-surface p-4 text-muted">
                  No direct line snippet returned for this rule check.
                </div>
              )}

              {/* Remediation Snippet */}
              {selectedFinding.remediation && (
                <div className="card-raise p-4 space-y-2">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-ok">Remediation command</div>
                  <code className="block code-surface p-3 text-[13px] font-mono text-ok">{selectedFinding.remediation}</code>
                </div>
              )}
            </div>
          ) : (
            <div className="h-80 flex flex-col justify-center items-center text-center p-6 text-muted">
              <Code className="w-8 h-8 mb-3 text-faint" />
              <p className="font-semibold text-ink">Select a finding on the left</p>
              <p className="text-caption text-faint mt-1">to view exact line-level evidence</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};