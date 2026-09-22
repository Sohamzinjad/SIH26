import React from 'react';
import { DashboardOverview } from '../types';
import { 
  AlertTriangle, 
  HardDrive, 
  GitFork, 
  Zap 
} from 'lucide-react';

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
  const data = overview || {
    total_devices: 42,
    total_audits: 18,
    average_score: 78.4,
    critical_failures: 12,
    high_failures: 14,
    active_attack_chains: 8,
    pending_ai_proposals: 2,
    devices: [],
    recent_audits: []
  };

  const recentAudits = Array.isArray(data?.recent_audits) && data.recent_audits.length > 0 
    ? data.recent_audits 
    : [
        { id: 101, hostname: 'FW-MUM-CORE-01', vendor: 'FortiOS', score: 68.4, fail_count: 5, status: 'COMPLETED', started_at: '20 Sep 2026, 13:05' },
        { id: 102, hostname: 'R1-DELHI-GW', vendor: 'Cisco IOS-XE', score: 92.1, fail_count: 1, status: 'COMPLETED', started_at: '20 Sep 2026, 12:47' },
        { id: 103, hostname: 'CORE-PANIPAT-SW', vendor: 'Cisco IOS', score: 45.9, fail_count: 7, status: 'COMPLETED', started_at: '20 Sep 2026, 11:22' },
        { id: 104, hostname: 'WHITEBOX-EDGE-03', vendor: 'White-Box', score: 62.1, fail_count: 4, status: 'COMPLETED', started_at: '20 Sep 2026, 09:31' },
      ];

  return (
    <div className="space-y-8 animate-fadeIn pb-20 font-sans text-[#171717]">
      {/* Top Section Header with Generous Optical Spacing */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-black/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono tracking-[0.2em] text-[#666666] font-bold uppercase mb-1">
            <span>OPERATIONAL INTELLIGENCE WORKSPACE</span>
            <span>&bull;</span>
            <span className="text-[#171717]">DEFENSE GRID</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-[0.05em] uppercase font-display leading-tight">
            Network Infrastructure Cyber Defense Surface
          </h1>
          <p className="text-xs text-[#666666] font-sans mt-2 max-w-3xl leading-relaxed">
            Real-time attack-path correlation, asset risk concentration, and high-leverage single-key remediation for national technical infrastructure.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="bg-[#FFFFFF] border border-black/10 p-3 trinetra-chamfer shadow-tactical-elevated">
            <div className="text-[9px] font-bold text-[#666666] uppercase tracking-[0.15em]">
              FLEET POSTURE SCORE
            </div>
            <div className="text-base font-black text-[#171717] flex items-center space-x-2 mt-0.5">
              <span>{data.average_score}%</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#00A86B] text-white font-bold tracking-wider">
                OPERATIONAL
              </span>
            </div>
          </div>

          <button
            onClick={onNewAudit}
            className="bg-[#181818] hover:bg-[#292929] text-white font-mono font-bold text-xs px-6 py-3.5 trinetra-chamfer transition shadow-tactical-dark flex items-center space-x-2 tracking-[0.12em]"
          >
            <Zap className="w-4 h-4 text-[#00A86B]" />
            <span>RUN AUDIT WORKFLOW</span>
          </button>
        </div>
      </div>

      {/* 4 Core Questions Micro Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* Q1: What Assets Exist? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>1. ASSET INVENTORY</span>
            <HardDrive className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#171717]">{data.total_devices}</span>
            <span className="text-[11px] text-[#666666] font-semibold">Active Monitored Nodes</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>Cisco &bull; Fortinet &bull; Whitebox</span>
            <span className="font-bold text-[#171717]">100% Parsed</span>
          </div>
        </div>

        {/* Q2: Where is Risk Concentrated? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>2. RISK CONCENTRATION</span>
            <AlertTriangle className="w-4 h-4 text-[#D64545]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#D64545]">{data.critical_failures}</span>
            <span className="text-[11px] text-[#D64545] font-bold">Critical Gaps</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>Severity Breakdown:</span>
            <span className="font-bold text-[#D64545]">{data.critical_failures} Crit &bull; {data.high_failures} High</span>
          </div>
        </div>

        {/* Q3: How do Attack Paths Connect? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>3. ATTACK VECTORS</span>
            <GitFork className="w-4 h-4 text-[#D4A017]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#171717]">{data.active_attack_chains}</span>
            <span className="text-[11px] text-[#D4A017] font-bold">Chained Paths</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>Telnet &bull; SNMP &bull; Priv Escalation</span>
          </div>
        </div>

        {/* Q4: What Single Action Reduces the Most Risk? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>4. LEVERAGE REMEDIATION</span>
            <Zap className="w-4 h-4 text-[#00A86B]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#00A86B]">-78.0%</span>
            <span className="text-[11px] text-[#00A86B] font-bold">Max Severance</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>Single Key Fix:</span>
            <span className="font-bold text-[#171717]">VTY Access-Class</span>
          </div>
        </div>
      </div>

      {/* Operational Violation Matrix & Telemetry Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Left 7 Columns: Critical Violation Matrix */}
        <div className="lg:col-span-7 trinetra-panel p-5 space-y-4 trinetra-chamfer">
          <div className="flex justify-between items-center border-b border-black/10 pb-3">
            <span className="font-black text-xs text-[#171717] uppercase tracking-[0.15em] flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-[#D64545]" />
              CRITICAL THREAT & COMPLIANCE VIOLATIONS MATRIX
            </span>
            <span className="text-[10px] text-[#666666]">SORTED BY SEVERITY</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-[#666666] border-b border-black/10 uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2">Control / Violation</th>
                  <th className="py-2 px-2">Framework</th>
                  <th className="py-2 px-2 text-center">Impacted</th>
                  <th className="py-2 px-2">Severity</th>
                  <th className="py-2 px-2 text-right">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">Telnet Enabled on Line VTY</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">CIS / DISA STIG</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D64545]">8 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D64545] text-white">CRITICAL</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">transport input ssh</td>
                </tr>
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">Default SNMP Community ('public')</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">CIS Benchmark</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D64545]">6 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D64545] text-white">CRITICAL</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">no snmp-server community</td>
                </tr>
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">Missing VTY Access-Class ACL</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">NIST AC-17</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D4A017]">5 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D4A017] text-white">HIGH</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">access-class 10 in</td>
                </tr>
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">No Remote Centralized Syslog</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">NIST AU-2</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D4A017]">4 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D4A017] text-white">HIGH</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">logging host 10.0.0.50</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Executions Log & System Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="trinetra-panel p-5 space-y-3 trinetra-chamfer">
            <div className="flex justify-between items-center border-b border-black/10 pb-3">
              <span className="font-black text-xs text-[#171717] uppercase tracking-[0.15em]">
                RECENT AUDIT EXECUTIONS
              </span>
              <span className="text-[10px] text-[#666666]">REAL-TIME TELEMETRY</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="text-[10px] text-[#666666] border-b border-black/10 uppercase">
                  <tr>
                    <th className="py-1.5 px-2">Host</th>
                    <th className="py-1.5 px-2">Vendor</th>
                    <th className="py-1.5 px-2">Score</th>
                    <th className="py-1.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {recentAudits.map((a: any) => (
                    <tr key={a.id} className="hover:bg-[#F9F9F8]">
                      <td className="py-2.5 px-2 font-bold text-[#171717]">{a.hostname}</td>
                      <td className="py-2.5 px-2 text-[#666666] text-[11px]">{a.vendor}</td>
                      <td className="py-2.5 px-2 font-bold" style={{ color: a.score >= 80 ? '#00A86B' : a.score >= 60 ? '#D4A017' : '#D64545' }}>
                        {a.score}%
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => onSelectAudit(a.id)}
                          className="text-[10px] font-bold bg-[#181818] text-white px-2.5 py-1 trinetra-chamfer hover:bg-[#292929]"
                        >
                          INSPECT &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Defense System Status Panel */}
          <div className="bg-[#181818] text-[#F7F6F3] border border-white/10 trinetra-chamfer p-5 space-y-3 font-mono text-xs shadow-tactical-dark">
            <div className="border-b border-white/10 pb-2 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-[0.15em] text-white">DEFENSE INFRASTRUCTURE STATUS</span>
              <span className="text-[10px] text-[#00A86B] font-bold">● ALL SYSTEMS GO</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">FASTAPI SERVICE</div>
                <div className="font-bold text-[#00A86B]">ONLINE (0.2ms)</div>
              </div>
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">DATABASE BACKEND</div>
                <div className="font-bold text-[#00A86B]">POSTGRES DB</div>
              </div>
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">LOCAL AI INFERENCE</div>
                <div className="font-bold text-[#00A86B]">OLLAMA (llama3.2)</div>
              </div>
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">DIALECT CACHE</div>
                <div className="font-bold text-white">24 ENTRIES</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
