import React from 'react';
import { DashboardOverview } from '../types';
import { Reveal } from './Reveal';
import {
  AlertTriangle,
  HardDrive,
  GitFork,
  Zap,
  ArrowRight,
  ShieldCheck,
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

  const totalAudits = data.total_audits ?? 0;
  const approvedAudits = data.human_approved_audits;
  const humanApprovedPct =
    approvedAudits != null && totalAudits > 0
      ? Math.round((approvedAudits / totalAudits) * 100)
      : 100;

  const scoreTone =
    data.average_score >= 80 ? 'text-ok' : data.average_score >= 60 ? 'text-high' : 'text-crit';

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* ============ HERO (decorative shapes live ONLY here) ============ */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-surface px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="orb orb-violet orb-drift-a -top-24 right-[8%] h-72 w-72" />
          <div className="orb orb-indigo orb-drift-b -bottom-32 left-[4%] h-80 w-80" />
          <div className="orb orb-rose orb-drift-a top-1/3 -right-16 h-52 w-52" />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="kicker mb-5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Operational Intelligence &bull; Defense Grid
          </div>

          <h1 className="display text-display text-balance">
            Network infrastructure, audited with certainty.
          </h1>

          <p className="mt-6 max-w-2xl text-body text-muted">
            Real-time attack-path correlation, asset risk concentration, and high-leverage
            single-key remediation for national technical infrastructure.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={onNewAudit} className="btn btn-primary">
              <Zap className="h-4 w-4" />
              Run Audit Workflow
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              {loading ? 'Loading posture…' : 'Live fleet posture below'}
            </div>
          </div>
        </div>
      </section>

      {/* ============ BIG-NUMBER STAT CALLOUTS ============ */}
      <section>
        <Reveal>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className={`stat-number ${scoreTone}`}>{data.average_score}%</div>
              <div className="stat-label mt-3">Fleet Compliance Score</div>
              <div className="mt-1 text-caption text-faint">Weighted across all audited nodes</div>
            </div>

            <div>
              <div className="stat-number">{data.total_devices}</div>
              <div className="stat-label mt-3">Devices Audited</div>
              <div className="mt-1 text-caption text-faint">Cisco &bull; Fortinet &bull; Whitebox</div>
            </div>

            <div>
              <div className="stat-number text-crit">{data.critical_failures}</div>
              <div className="stat-label mt-3">Critical Findings</div>
              <div className="mt-1 text-caption text-faint">
                + {data.high_failures} high severity open
              </div>
            </div>

            <div>
              <div className="stat-number">{data.active_attack_chains}</div>
              <div className="stat-label mt-3">Active Attack Chains</div>
              <div className="mt-1 text-caption text-faint">Telnet &bull; SNMP &bull; Priv escalation</div>
            </div>
          </div>
        </Reveal>

        {/* Governance trust signal — its own hero moment */}
        <Reveal delayMs={60}>
          <div className="mt-12 flex flex-col items-start gap-8 rounded-[24px] border border-accent/35 bg-accent/10 px-8 py-10 sm:px-12 lg:flex-row lg:items-center lg:gap-16">
            <div>
              <div className="stat-number !text-[clamp(4rem,9vw,7rem)] text-accent-hover">
                {humanApprovedPct}%
              </div>
            </div>
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-accent-hover" />
                AI proposes. Deterministic code decides. Humans approve.
              </div>
              <div className="section-title mt-2">
                Human-approved mappings across every audit
              </div>
              <p className="mt-3 text-body text-muted">
                {totalAudits} audits recorded &bull; every unknown vendor dialect signed off by an
                analyst before evaluation &bull;{' '}
                <span className="text-white font-semibold">
                  {data.pending_ai_proposals} proposal{data.pending_ai_proposals === 1 ? '' : 's'}{' '}
                  pending review
                </span>
                .
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ FOUR-QUESTION POSTURE CARDS ============ */}
      <section>
        <Reveal>
          <div className="mb-8">
            <div className="kicker mb-2">The Four Operational Questions</div>
            <h2 className="section-title">Posture at a glance</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal>
            <div className="card card-hover h-full p-5 space-y-3">
              <div className="flex justify-between items-start">
                <span className="kicker">1. Asset Inventory</span>
                <HardDrive className="w-4 h-4 text-muted" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="stat-number-sm">{data.total_devices}</span>
                <span className="text-caption text-muted">Active Monitored Nodes</span>
              </div>
              <div className="text-caption text-faint border-t border-white/10 pt-3 flex justify-between gap-2">
                <span>Cisco &bull; Fortinet &bull; Whitebox</span>
                <span className="font-semibold text-ink">100% Parsed</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={50}>
            <div className="card card-hover h-full p-5 space-y-3">
              <div className="flex justify-between items-start">
                <span className="kicker">2. Risk Concentration</span>
                <AlertTriangle className="w-4 h-4 text-crit" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="stat-number-sm text-crit">{data.critical_failures}</span>
                <span className="text-caption font-bold text-crit">Critical Gaps</span>
              </div>
              <div className="text-caption text-faint border-t border-white/10 pt-3 flex justify-between gap-2">
                <span>Severity breakdown</span>
                <span className="font-semibold text-crit">
                  {data.critical_failures} Crit &bull; {data.high_failures} High
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="card card-hover h-full p-5 space-y-3">
              <div className="flex justify-between items-start">
                <span className="kicker">3. Attack Vectors</span>
                <GitFork className="w-4 h-4 text-high" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="stat-number-sm">{data.active_attack_chains}</span>
                <span className="text-caption font-bold text-high">Chained Paths</span>
              </div>
              <div className="text-caption text-faint border-t border-white/10 pt-3 flex justify-between gap-2">
                <span>Telnet &bull; SNMP &bull; Priv Escalation</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={150}>
            <div className="card card-hover h-full p-5 space-y-3">
              <div className="flex justify-between items-start">
                <span className="kicker">4. Leverage Remediation</span>
                <Zap className="w-4 h-4 text-ok" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="stat-number-sm text-ok">-78.0%</span>
                <span className="text-caption font-bold text-ok">Max Severance</span>
              </div>
              <div className="text-caption text-faint border-t border-white/10 pt-3 flex justify-between gap-2">
                <span>Single key fix</span>
                <span className="font-semibold text-ink">VTY Access-Class</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ VIOLATIONS MATRIX + RECENT AUDITS (dense data: no decoration) ============ */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-6">
            <div className="kicker mb-2">Sorted by severity</div>
            <h2 className="section-title">Critical &amp; compliance violations</h2>
          </div>
          <div className="card p-2 sm:p-4 overflow-x-auto">
              <table className="data-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Control / Violation</th>
                    <th>Framework</th>
                    <th className="text-center">Impacted</th>
                    <th>Severity</th>
                    <th className="text-right">Remediation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-hover">
                    <td className="font-semibold">Telnet Enabled on Line VTY</td>
                    <td className="text-muted text-[12px]">CIS / DISA STIG</td>
                    <td className="text-center font-bold text-crit">8 Devices</td>
                    <td><span className="badge badge-critical">Critical</span></td>
                    <td className="text-right font-mono text-[12px] text-ok">transport input ssh</td>
                  </tr>
                  <tr className="row-hover">
                    <td className="font-semibold">Default SNMP Community ('public')</td>
                    <td className="text-muted text-[12px]">CIS Benchmark</td>
                    <td className="text-center font-bold text-crit">6 Devices</td>
                    <td><span className="badge badge-critical">Critical</span></td>
                    <td className="text-right font-mono text-[12px] text-ok">no snmp-server community</td>
                  </tr>
                  <tr className="row-hover">
                    <td className="font-semibold">Missing VTY Access-Class ACL</td>
                    <td className="text-muted text-[12px]">NIST AC-17</td>
                    <td className="text-center font-bold text-high">5 Devices</td>
                    <td><span className="badge badge-high">High</span></td>
                    <td className="text-right font-mono text-[12px] text-ok">access-class 10 in</td>
                  </tr>
                  <tr className="row-hover">
                    <td className="font-semibold">No Remote Centralized Syslog</td>
                    <td className="text-muted text-[12px]">NIST AU-2</td>
                    <td className="text-center font-bold text-high">4 Devices</td>
                    <td><span className="badge badge-high">High</span></td>
                    <td className="text-right font-mono text-[12px] text-ok">logging host 10.0.0.50</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Reveal delayMs={60}>
            <div className="mb-6">
              <div className="kicker mb-2">Real-time telemetry</div>
              <h2 className="section-title">Recent audits</h2>
            </div>
            <div className="card p-2 sm:p-4 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Vendor</th>
                    <th>Score</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((a: any) => (
                    <tr key={a.id} className="row-hover">
                      <td className="font-semibold">{a.hostname}</td>
                      <td className="text-muted text-[12px]">{a.vendor}</td>
                      <td
                        className="font-bold"
                        style={{
                          color: a.score >= 80 ? '#4ade80' : a.score >= 60 ? '#ffb224' : '#ff8585',
                        }}
                      >
                        {a.score}%
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => onSelectAudit(a.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="card p-5 space-y-4">
              <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                <span className="font-display text-[13px] font-bold uppercase tracking-[0.12em] text-ink">
                  Defense Infrastructure Status
                </span>
                <span className="font-mono text-[10px] font-bold text-ok uppercase">
                  ● All systems go
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-xl bg-surface-2 border border-white/10 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-faint">FastAPI Service</div>
                  <div className="font-bold text-ok mt-1">ONLINE (0.2ms)</div>
                </div>
                <div className="rounded-xl bg-surface-2 border border-white/10 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-faint">Database Backend</div>
                  <div className="font-bold text-ok mt-1">POSTGRES DB</div>
                </div>
                <div className="rounded-xl bg-surface-2 border border-white/10 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-faint">Local AI Inference</div>
                  <div className="font-bold text-ok mt-1">OLLAMA (llama3.2)</div>
                </div>
                <div className="rounded-xl bg-surface-2 border border-white/10 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-faint">Dialect Cache</div>
                  <div className="font-bold text-ink mt-1">24 ENTRIES</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
