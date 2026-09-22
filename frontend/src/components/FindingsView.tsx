import React, { useState, useEffect } from 'react';
import { fetchFleetSummary, fetchDashboardOverview } from '../api/client';
import { FleetSummary, DashboardOverview } from '../types';
import { ShieldAlert, Search, AlertTriangle, ShieldCheck, Filter, FileText } from 'lucide-react';

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
      <div className="flex flex-col justify-center items-center h-96 space-y-3 font-mono">
        <div className="w-10 h-10 border-4 border-[#171717] border-t-transparent animate-spin"></div>
        <p className="text-xs text-[#5E5E5E] tracking-widest uppercase">CORRELATING GLOBAL FINDINGS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-[#B9B9B4] pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
            GLOBAL FINDINGS EXPLORER
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5 flex items-center space-x-3">
            <span>RULE VIOLATIONS & VULNERABILITIES</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#D64545] text-white">
              {failingRules.length} ACTIVE RULES
            </span>
          </h1>
          <p className="text-xs text-[#5E5E5E] font-sans mt-1">
            Aggregated compliance findings across CIS Cisco, FortiOS, NIST SP 800-53, and DISA STIG benchmarks.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-4 shadow-sm font-mono text-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E5E5E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rule ID or title..."
              className="w-full bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] pl-8 pr-3 py-1.5 focus:outline-none"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] px-3 py-1.5 focus:outline-none font-mono"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
        </div>

        {/* Rule Aggregates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-[10px] text-[#5E5E5E] border-b border-[#B9B9B4] uppercase bg-[#EAEAE7]">
              <tr>
                <th className="py-2.5 px-3">Rule Identifier</th>
                <th className="py-2.5 px-3">Benchmark Framework</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Devices Failing</th>
                <th className="py-2.5 px-3">Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B9B4]/40">
              {filteredRules.map((r, idx) => (
                <tr key={idx} className="hover:bg-[#EAEAE7] transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-[#171717]">{r.rule_id}</div>
                    <div className="text-[11px] text-[#5E5E5E]">{r.title}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#171717] text-white uppercase">
                      {r.framework}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                      r.severity === 'critical' || r.severity === 'high' ? 'bg-[#D64545] text-white' : 'bg-[#D4A017] text-white'
                    }`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#D64545] font-bold">
                    {r.devices_failing} / {r.devices_present} Devices
                  </td>
                  <td className="py-3 px-3 font-bold text-[#171717]">
                    {r.compliance_pct.toFixed(1)}%
                  </td>
                </tr>
              ))}

              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5E5E5E]">
                    No security rule findings match current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
