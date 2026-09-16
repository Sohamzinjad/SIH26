import React, { useState } from 'react';
import { DashboardOverview } from '../types';
import { 
  Boxes, 
  ShieldCheck, 
  AlertTriangle, 
  Network, 
  Server, 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowUpRight,
  Filter,
  Sparkles,
  Terminal,
  Activity,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { getReportUrl } from '../api/client';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  loading: boolean;
  onSelectAudit: (auditId: number) => void;
  onNewAudit: () => void;
}

const FALLBACK_OVERVIEW: DashboardOverview = {
  total_devices: 0,
  total_audits: 0,
  average_score: 100,
  critical_failures: 0,
  high_failures: 0,
  active_attack_chains: 0,
  pending_ai_proposals: 0,
  devices: [],
  recent_audits: []
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  loading,
  onSelectAudit,
  onNewAudit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-xl bg-blue-500/20 animate-ping"></div>
          <div className="relative rounded-xl bg-[#161924] border border-blue-500/50 p-3 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading Indexes & Fleet Posture...</p>
      </div>
    );
  }

  const data = overview || FALLBACK_OVERVIEW;
  const devices = Array.isArray(data?.devices) ? data.devices : [];
  const recentAudits = Array.isArray(data?.recent_audits) ? data.recent_audits : [];
  const averageScore = typeof data?.average_score === 'number' ? data.average_score : 100;
  const totalDevices = data?.total_devices ?? devices.length;
  const totalAudits = data?.total_audits ?? recentAudits.length;
  const criticalFailures = data?.critical_failures ?? 0;
  const highFailures = data?.high_failures ?? 0;
  const activeAttackChains = data?.active_attack_chains ?? 0;
  const pendingAiProposals = data?.pending_ai_proposals ?? 0;

  const handleCopyHost = (hostname: string) => {
    navigator.clipboard.writeText(hostname);
    setCopiedHost(hostname);
    setTimeout(() => setCopiedHost(null), 1500);
  };

  const filteredDevices = devices.filter((device) => {
    const hostname = device?.hostname || '';
    const vendor = device?.vendor || '';
    const matchesSearch = hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendor = vendorFilter === 'ALL' || vendor.toLowerCase().includes(vendorFilter.toLowerCase());
    return matchesSearch && matchesVendor;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Pinecone Breadcrumbs & Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#22262F] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1 font-mono">
            <span>Indexes</span>
            <span>/</span>
            <span className="text-slate-200">Production Fleet</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Fleet Indexes & Compliance</span>
            <span className="text-xs font-normal font-mono px-2 py-0.5 rounded-full bg-[#1F222E] text-slate-400 border border-[#2D3245]">
              {devices.length} Total
            </span>
          </h1>
          <p className="text-xs text-[#9AA2B0] mt-1 max-w-2xl">
            Deterministic security compliance auditing for multi-vendor network devices. Evaluates running configs against CIS, NIST SP 800-53, and DISA STIG controls.
          </p>
        </div>

        {/* Primary Pinecone Create Index CTA */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewAudit}
            className="flex items-center space-x-2 bg-white hover:bg-neutral-200 text-neutral-900 font-semibold px-4 py-2 rounded-lg text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-black stroke-[2.5]" />
            <span>+ Create Index / Run Audit</span>
          </button>
        </div>
      </div>

      {/* Pinecone Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Fleet Compliance Score */}
        <div className="bg-[#12141A] border border-[#22262F] hover:border-[#2E3347] rounded-xl p-4 transition-all flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA2B0]">
              Fleet Compliance
            </span>
            <div className={`p-1 rounded-md ${
              averageScore >= 80 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : averageScore >= 60 
                ? 'bg-amber-500/10 text-amber-400' 
                : 'bg-rose-500/10 text-rose-400'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white tracking-tight font-sans">
                {averageScore}%
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                averageScore >= 80
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {averageScore >= 80 ? 'HEALTHY' : 'WARNING'}
              </span>
            </div>
            {/* Micro Progress Bar */}
            <div className="w-full bg-[#1F2330] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  averageScore >= 80 
                    ? 'bg-emerald-400' 
                    : averageScore >= 60 
                    ? 'bg-amber-400' 
                    : 'bg-rose-400'
                }`}
                style={{ width: `${averageScore}%` }}
              />
            </div>
            <p className="text-[11px] text-[#9AA2B0] mt-2">Weighted pass across fleet</p>
          </div>
        </div>

        {/* Metric 2: Active Devices */}
        <div className="bg-[#12141A] border border-[#22262F] hover:border-[#2E3347] rounded-xl p-4 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA2B0]">
              Active Devices
            </span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {totalDevices}
            </span>
            <p className="text-[11px] text-[#9AA2B0] mt-2">
              <span className="font-mono text-slate-300">{totalAudits}</span> audit executions logged
            </p>
          </div>
        </div>

        {/* Metric 3: Critical Security Gaps */}
        <div className="bg-[#12141A] border border-[#22262F] hover:border-[#2E3347] rounded-xl p-4 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA2B0]">
              Critical Gaps
            </span>
            <div className="p-1 rounded-md bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-rose-400 tracking-tight">
                {criticalFailures}
              </span>
              <span className="text-[10px] font-mono text-rose-400/80 uppercase">Severe</span>
            </div>
            <p className="text-[11px] text-[#9AA2B0] mt-2">
              +{highFailures} high severity findings
            </p>
          </div>
        </div>

        {/* Metric 4: Attack Chains */}
        <div className="bg-[#12141A] border border-[#22262F] hover:border-[#2E3347] rounded-xl p-4 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA2B0]">
              Attack Chains
            </span>
            <div className="p-1 rounded-md bg-orange-500/10 text-orange-400">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-orange-400 tracking-tight">
                {activeAttackChains}
              </span>
              <span className="text-[10px] font-mono text-orange-400/80 uppercase">Active</span>
            </div>
            <p className="text-[11px] text-[#9AA2B0] mt-2">Correlated multi-stage vectors</p>
          </div>
        </div>

        {/* Metric 5: AI Dialect Governance */}
        <div className="bg-[#12141A] border border-[#22262F] hover:border-[#2E3347] rounded-xl p-4 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA2B0]">
              AI Dialects
            </span>
            <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-cyan-400 tracking-tight">
                {pendingAiProposals}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Pending</span>
            </div>
            <p className="text-[11px] text-[#9AA2B0] mt-2">Human-in-the-loop sign-off</p>
          </div>
        </div>
      </div>

      {/* Pinecone Indexes Section */}
      <div className="bg-[#12141A] border border-[#22262F] rounded-xl overflow-hidden shadow-pinecone">
        {/* Controls Bar: Search & Filter */}
        <div className="p-4 border-b border-[#22262F] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search indexes by hostname, vendor, or dialect..."
                className="w-full bg-[#0A0C0F] border border-[#22262F] focus:border-emerald-500 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            {/* Vendor Filter Pills */}
            <div className="hidden md:flex items-center space-x-1 bg-[#0A0C0F] p-0.5 rounded-lg border border-[#22262F]">
              {['ALL', 'CISCO', 'FORTINET', 'WHITEBOX'].map((vendor) => (
                <button
                  key={vendor}
                  onClick={() => setVendorFilter(vendor)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    vendorFilter === vendor
                      ? 'bg-[#22262F] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {vendor}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-mono">{filteredDevices.length}</span>
            <span>of {devices.length} indexes</span>
          </div>
        </div>

        {/* Pinecone Index Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111319] text-[11px] font-semibold uppercase tracking-wider text-[#9AA2B0] border-b border-[#22262F]">
              <tr>
                <th className="px-6 py-3.5">Index Name / Hostname</th>
                <th className="px-6 py-3.5">Vendor & Architecture</th>
                <th className="px-6 py-3.5">Compliance Score</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262F]/60">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#9AA2B0]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Boxes className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No indexes registered yet</p>
                      <p className="text-xs text-slate-500">Run a new configuration audit to register an index.</p>
                      <button
                        onClick={onNewAudit}
                        className="mt-2 text-xs bg-white text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition"
                      >
                        + Run Config Audit
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const devScore = device.score !== null && device.score !== undefined ? device.score : null;
                  const isReady = device.status === 'COMPLETED';

                  return (
                    <tr 
                      key={device.id} 
                      className="hover:bg-[#1A1D24]/80 transition group"
                    >
                      {/* Hostname Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="flex h-2 w-2 relative">
                              {isReady && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                isReady ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}></span>
                            </span>
                            <span 
                              onClick={() => device.latest_audit_id && onSelectAudit(device.latest_audit_id)}
                              className="font-mono font-medium text-white hover:text-blue-400 cursor-pointer transition text-sm"
                            >
                              {device.hostname}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopyHost(device.hostname)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition"
                            title="Copy hostname"
                          >
                            {copiedHost === device.hostname ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Index ID: idx-{device.id?.toString().padStart(4, '0')} &bull; Deterministic
                        </div>
                      </td>

                      {/* Vendor Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#1F222E] text-slate-300 font-mono text-[11px] border border-[#2D3245]">
                            {device.vendor}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">Serverless</span>
                        </div>
                      </td>

                      {/* Compliance Score Column */}
                      <td className="px-6 py-4">
                        {devScore !== null ? (
                          <div className="space-y-1 max-w-[140px]">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-white font-mono">{devScore}%</span>
                              <span className={`text-[10px] font-mono ${
                                devScore >= 80 ? 'text-emerald-400' : devScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {devScore >= 80 ? 'PASS' : devScore >= 60 ? 'MED' : 'HIGH RISK'}
                              </span>
                            </div>
                            <div className="w-full bg-[#1F2330] rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  devScore >= 80 ? 'bg-emerald-400' : devScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                                }`}
                                style={{ width: `${devScore}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">N/A</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium ${
                            isReady
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : device.status === 'PENDING_AI_MAPPING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isReady ? 'Ready' : device.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right space-x-2">
                        {device.latest_audit_id && (
                          <>
                            <button
                              onClick={() => onSelectAudit(device.latest_audit_id!)}
                              className="text-xs font-medium text-blue-400 hover:text-white px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-600 transition"
                            >
                              Audit Findings
                            </button>
                            <a
                              href={getReportUrl(device.latest_audit_id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-[#22262F] transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Report</span>
                            </a>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pinecone Recent Audits / Execution Runs */}
      <div className="bg-[#12141A] border border-[#22262F] rounded-xl overflow-hidden shadow-pinecone">
        <div className="px-6 py-4 border-b border-[#22262F] flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-white text-sm">Recent Audit Executions</h3>
            <p className="text-[11px] text-[#9AA2B0]">Deterministic rule runs recorded against CIS and NIST baselines</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {recentAudits.length} runs recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111319] text-[11px] font-semibold uppercase tracking-wider text-[#9AA2B0] border-b border-[#22262F]">
              <tr>
                <th className="px-6 py-3">Audit ID</th>
                <th className="px-6 py-3">Target Hostname</th>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Compliance Score</th>
                <th className="px-6 py-3">Gaps Identified</th>
                <th className="px-6 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262F]/60">
              {recentAudits.map((a) => (
                <tr key={a.id} className="hover:bg-[#1A1D24]/80 transition">
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">
                    audit-{a.id?.toString().padStart(3, '0')}
                  </td>
                  <td className="px-6 py-3.5 font-medium text-white font-mono">{a.hostname}</td>
                  <td className="px-6 py-3.5 text-slate-300 font-mono text-[11px]">{a.vendor}</td>
                  <td className="px-6 py-3.5">
                    <span className={`font-mono font-bold ${
                      a.score >= 80 ? 'text-emerald-400' : a.score >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {a.score}%
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                      {a.fail_count} failed controls
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => onSelectAudit(a.id)}
                      className="text-xs bg-[#1F222E] hover:bg-[#2A2F40] text-slate-200 border border-[#2D3245] px-2.5 py-1 rounded transition"
                    >
                      Inspect Findings &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
