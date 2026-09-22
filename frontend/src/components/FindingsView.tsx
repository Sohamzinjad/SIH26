import React, { useState, useEffect } from 'react';
import { fetchFleetSummary, fetchDashboardOverview } from '../api/client';
import { FleetSummary, DashboardOverview } from '../types';
import { Reveal } from './Reveal';
import { ShieldAlert, Search } from 'lucide-react';

interface FindingsViewProps {
  onSelectAudit?: (auditId: number) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({ onSelectAudit }) => {
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, ovData] = await Promise.all([
        fetchFleetSummary().catch(() => null),
        fetchDashboardOverview().catch(() => null),
      ]);
      if (sumData) setSummary(sumData);
      if (ovData) setOverview(ovData);
    } finally {
      setLoading(false);
    }
  };

  const failingRules = summary?.by_rule || [];

  const filteredRules = failingRules.filter((r) => {
    const matchesSearch =
      r.rule_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || r.severity.toLowerCase() === severityFilter.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
        <p className="font-mono text-xs text-faint tracking-[0.18em] uppercase">Correlating global findings…</p>
      </div>
    );
  }

  const sevBadge = (sev: string) => {
    if (sev.toLowerCase() === 'critical') return <span className="badge badge-critical">Critical</span>;
    if (sev.toLowerCase() === 'high') return <span className="badge badge-high">High</span>;
    if (sev.toLowerCase() === 'medium') return <span className="badge badge-medium">Medium</span>;
    return <span className="badge badge-low">Low</span>;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="kicker mb-3">Global findings explorer</div>
            <h1 className="font-display font-bold text-h1 tracking-tight text-ink">
              Rule violations &amp; vulnerabilities
              <span className="ml-4 align-middle badge badge-critical">{failingRules.length} active rules</span>
            </h1>
            <p className="mt-3 max-w-2xl text-body text-muted">
              Aggregated compliance findings across CIS Cisco, FortiOS, NIST SP 800-53, and DISA STIG benchmarks.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Controls */}
      <Reveal delayMs={40}>
        <div className="card p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule ID or title..."
                className="field pl-9"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="field !w-auto"
            >
              <option value="ALL">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Rule Aggregates Table */}
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Rule Identifier</th>
                  <th>Benchmark Framework</th>
                  <th>Severity</th>
                  <th>Devices Failing</th>
                  <th>Compliance Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((r, idx) => (
                  <tr key={idx} className="row-hover">
                    <td className="py-3 px-3">
                      <div className="font-bold font-mono text-[12px] text-ink">{r.rule_id}</div>
                      <div className="text-caption text-muted">{r.title}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral uppercase">{r.framework}</span>
                    </td>
                    <td>{sevBadge(r.severity)}</td>
                    <td className="font-bold text-crit">
                      {r.devices_failing} / {r.devices_present} Devices
                    </td>
                    <td className="font-bold text-ink">{r.compliance_pct.toFixed(1)}%</td>
                  </tr>
                ))}

                {filteredRules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      No security rule findings match current search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </div>
  );
};