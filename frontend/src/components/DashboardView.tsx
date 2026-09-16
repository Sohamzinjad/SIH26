import React from 'react';
import { DashboardOverview } from '../types';
import { ShieldCheck, AlertTriangle, Network, Server, ArrowRight, FileCheck, ExternalLink } from 'lucide-react';
import { getReportUrl } from '../api/client';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  loading: boolean;
  onSelectAudit: (auditId: number) => void;
  onNewAudit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  loading,
  onSelectAudit,
  onNewAudit,
}) => {
  if (loading || !overview) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const scoreColor =
    overview.average_score >= 80
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : overview.average_score >= 60
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-dark-800 to-dark-800 border border-dark-600 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            National Network Security Posture
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic CIS / NIST SP 800-53 / DISA STIG controls evaluated against enterprise multi-vendor fleet.
          </p>
        </div>
        <button
          onClick={onNewAudit}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition"
        >
          <span>Run New Config Audit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-5 rounded-xl border ${scoreColor} flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Compliance</span>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold">{overview.average_score}%</span>
            <p className="text-xs text-slate-400 mt-1">Weighted passing score</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Devices</span>
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{overview.total_devices}</span>
            <p className="text-xs text-slate-400 mt-1">{overview.total_audits} total audit runs</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Failures</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-400">{overview.critical_failures}</span>
            <p className="text-xs text-slate-400 mt-1">{overview.high_failures} high severity gaps</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Attack Chains</span>
            <Network className="w-5 h-5 text-orange-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-orange-400">{overview.active_attack_chains}</span>
            <p className="text-xs text-slate-400 mt-1">Correlated exploit paths</p>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Proposals</span>
            <FileCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-cyan-400">{overview.pending_ai_proposals}</span>
            <p className="text-xs text-slate-400 mt-1">Pending analyst sign-off</p>
          </div>
        </div>
      </div>

      {/* Device Fleet Section */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-600 flex justify-between items-center">
          <h3 className="font-semibold text-white">Monitored Network Infrastructure</h3>
          <span className="text-xs text-slate-400">{overview.devices.length} devices configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-dark-900/50 text-xs uppercase text-slate-400 border-b border-dark-600">
              <tr>
                <th className="px-6 py-3">Hostname</th>
                <th className="px-6 py-3">Vendor / OS</th>
                <th className="px-6 py-3">Compliance Score</th>
                <th className="px-6 py-3">Audit Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {overview.devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No devices registered yet. Upload a configuration file to start auditing.
                  </td>
                </tr>
              ) : (
                overview.devices.map((device) => {
                  const devScore = device.score !== null && device.score !== undefined ? device.score : null;
                  return (
                    <tr key={device.id} className="hover:bg-dark-700/50 transition">
                      <td className="px-6 py-4 font-mono font-medium text-white">{device.hostname}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                          {device.vendor}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {devScore !== null ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-dark-900 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  devScore >= 80 ? 'bg-emerald-500' : devScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${devScore}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs">{devScore}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                            device.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : device.status === 'PENDING_AI_MAPPING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {device.latest_audit_id && (
                          <>
                            <button
                              onClick={() => onSelectAudit(device.latest_audit_id!)}
                              className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
                            >
                              View Findings
                            </button>
                            <a
                              href={getReportUrl(device.latest_audit_id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
                            >
                              <ExternalLink className="w-3 h-3" />
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

      {/* Recent Audits Table */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-600 flex justify-between items-center">
          <h3 className="font-semibold text-white">Recent Compliance Audit Runs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-dark-900/50 text-xs uppercase text-slate-400 border-b border-dark-600">
              <tr>
                <th className="px-6 py-3">Audit ID</th>
                <th className="px-6 py-3">Device Hostname</th>
                <th className="px-6 py-3">Vendor</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Failures</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {overview.recent_audits.map((a) => (
                <tr key={a.id} className="hover:bg-dark-700/50 transition">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{a.id}</td>
                  <td className="px-6 py-4 font-medium text-white">{a.hostname}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{a.vendor}</td>
                  <td className="px-6 py-4 font-bold text-xs">{a.score}%</td>
                  <td className="px-6 py-4 text-xs text-rose-400 font-semibold">{a.fail_count} gaps</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectAudit(a.id)}
                      className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded hover:bg-blue-600/40 transition"
                    >
                      Audit Details
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
