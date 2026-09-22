import React, { useState } from 'react';
import { Reveal } from './Reveal';
import {
  ShieldCheck,
  Zap,
  GitFork,
  HardDrive,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  Workflow,
  History,
} from 'lucide-react';

interface LandingViewProps {
  onEnterDashboard: () => void;
  onNewAudit: () => void;
  onExploreFleet: () => void;
  onOpenMappings: () => void;
  onOpenAuditTrail: () => void;
}

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How does TRINETRA eliminate LLM hallucinations in compliance audits?',
    a: 'Unlike naive AI scanners that feed sensitive configs into external cloud LLMs, TRINETRA uses local offline LLMs solely to propose white-box grammar mappings for unknown vendor dialects. All actual compliance checks execute against a 100% deterministic AST parser using verifiable code and line-numbered evidence.',
  },
  {
    q: 'Is TRINETRA certified for 100% air-gapped, offline defense networks?',
    a: 'Yes. TRINETRA operates completely self-contained with no telemetry, no outbound API calls, and no cloud dependencies. All benchmarks (CIS Cisco, FortiOS, NIST SP 800-53 Rev 5, DISA STIG) and graph algorithms run entirely on local operational infrastructure.',
  },
  {
    q: 'How does Single-Key Bottleneck Severance calculate the highest-leverage CLI fix?',
    a: 'TRINETRA models isolated findings as an attack graph representing multi-hop adversary pivot chains. The severance engine runs bridge-finding graph algorithms to pinpoint the single CLI configuration change that breaks the maximum number of exploit paths simultaneously.',
  },
  {
    q: 'How does the cryptographic audit ledger provide non-repudiation?',
    a: 'Every audit execution, AI grammar approval, and governance waiver is stamped with a SHA-256 Merkle forward hash linking directly to the previous block. The chain cannot be backdated or modified without invalidating subsequent block hashes.',
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onEnterDashboard,
  onNewAudit,
  onExploreFleet,
  onOpenMappings,
  onOpenAuditTrail,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'audit' | 'attack-path' | 'governance'>('audit');
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-24 lg:space-y-36 pb-24">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-surface px-6 py-16 sm:px-12 lg:px-20 lg:py-28">
        {/* Floating Ambient Decorative Orbs (Agency Style - Strictly Low-Density Hero) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="orb orb-violet orb-drift-a -top-20 right-[5%] h-64 w-64 sm:h-96 sm:w-96 opacity-50 sm:opacity-60" />
          <div className="orb orb-indigo orb-drift-b -bottom-28 left-[2%] h-72 w-72 sm:h-[420px] sm:w-[420px] opacity-40 sm:opacity-50" />
          <div className="orb orb-rose orb-drift-a top-1/2 right-[25%] h-48 w-48 sm:h-64 sm:w-64 opacity-25 sm:opacity-30" />
        </div>

        <div className="relative z-10 max-w-5xl">
          {/* Kicker with live beacon */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-surface-2/90 px-4 py-1.5 backdrop-blur-md mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              TRINETRA &bull; High Assurance Defense Intelligence
            </span>
          </div>

          {/* Bold Display Headline */}
          <h1 className="font-display font-bold text-display tracking-tight text-balance text-ink">
            Deterministic security compliance.
            <span className="block text-accent-hover mt-1">Zero guesswork.</span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg sm:text-xl text-muted font-normal leading-relaxed">
            Audit critical enterprise routers, firewalls, and air-gapped switches against national technical benchmarks. 
            Real-time attack-path correlation, multi-vendor dialect parsing, and high-leverage single-key remediation.
          </p>

          {/* Action CTAs — singular dominant primary action */}
          <div className="mt-12 flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={onEnterDashboard}
              className="btn btn-primary !px-8 !py-4 !text-[13px] shadow-glow-accent group text-white"
            >
              <span>Launch Audit Console</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <button
              onClick={onNewAudit}
              className="btn btn-ghost !px-6 !py-4 !text-[13px] text-muted hover:text-ink"
            >
              <Zap className="w-4 h-4 text-accent-hover" />
              <span>Upload Config</span>
            </button>

            <button
              onClick={onExploreFleet}
              className="btn btn-ghost !px-6 !py-4 !text-[13px] text-muted hover:text-ink"
            >
              <FileSpreadsheet className="w-4 h-4 text-faint" />
              <span>Explore Fleet</span>
            </button>
          </div>

          {/* Mini trust markers */}
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center gap-6 sm:gap-10 text-caption font-mono text-faint uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
              <span>CIS Benchmarks</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
              <span>NIST SP 800-53 Rev 5</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
              <span>DISA STIG</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
              <span>100% Air-Gapped Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HERO STATS CALLOUTS (Big Number Treatment) ================= */}
      <section>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 border-b border-white/10 pb-16">
          <Reveal delayMs={0}>
            <div className="space-y-2">
              <div className="stat-number text-accent-hover">100%</div>
              <div className="stat-label">Human-Approved AI</div>
              <p className="text-caption text-faint">
                Every unknown vendor syntax proposal is strictly approved by an analyst before rule evaluation.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={60}>
            <div className="space-y-2">
              <div className="stat-number text-ink">240+</div>
              <div className="stat-label">Benchmark Controls</div>
              <p className="text-caption text-faint">
                Comprehensive rules across CIS Cisco, FortiOS, NIST SP 800-53, and DISA STIG frameworks.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <div className="space-y-2">
              <div className="stat-number text-ink">0%</div>
              <div className="stat-label">Model Hallucination</div>
              <p className="text-caption text-faint">
                Audits run on a 100% deterministic rule engine with verifiable AST logic and line-numbered evidence.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={180}>
            <div className="space-y-2">
              <div className="stat-number text-ok">-78%</div>
              <div className="stat-label">Vector Severance</div>
              <p className="text-caption text-faint">
                Single-key remediation identifies the single highest-leverage CLI command to dismantle chained exploits.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= THE 4 OPERATIONAL QUESTIONS (Interactive Card Grid) ================= */}
      <section className="space-y-10">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-3">The Architectural Philosophy</div>
              <h2 className="section-title">The Four Questions of Operational Defense</h2>
            </div>
            <p className="max-w-md text-body text-muted">
              Rather than generic vulnerability lists, TRINETRA answers the fundamental questions operational commanders ask during incidents.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delayMs={40}>
            <div className="card card-hover p-7 h-full flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-surface-2 border border-white/10 flex items-center justify-center text-accent-hover">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div className="kicker">Question 01</div>
                <h3 className="font-display text-xl font-bold text-ink">
                  What do we actually have?
                </h3>
                <p className="text-body text-muted text-sm leading-relaxed">
                  Automated dialect detection across Cisco IOS, IOS-XE, FortiOS, Juniper JunOS, and white-box network equipment.
                </p>
              </div>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-caption font-mono text-faint">
                <span>Multi-vendor AST</span>
                <span className="text-accent-hover font-semibold">100% Parsed</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="card card-hover p-7 h-full flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-surface-2 border border-white/10 flex items-center justify-center text-crit">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="kicker">Question 02</div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Where is the risk concentrated?
                </h3>
                <p className="text-body text-muted text-sm leading-relaxed">
                  Instant mapping against CIS Cisco Benchmarks and DISA STIGs with line-level config evidence for every finding.
                </p>
              </div>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-caption font-mono text-faint">
                <span>Severity weighted</span>
                <span className="text-crit font-semibold">Zero False Positives</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <div className="card card-hover p-7 h-full flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-surface-2 border border-white/10 flex items-center justify-center text-high">
                  <GitFork className="w-6 h-6" />
                </div>
                <div className="kicker">Question 03</div>
                <h3 className="font-display text-xl font-bold text-ink">
                  How can an adversary chain them?
                </h3>
                <p className="text-body text-muted text-sm leading-relaxed">
                  Graph-based attack chain modeling correlates isolated findings (e.g. unencrypted Telnet + default SNMP + weak privilege) into full compromise paths.
                </p>
              </div>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-caption font-mono text-faint">
                <span>Attack path graph</span>
                <span className="text-high font-semibold">Step-by-step Sim</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={160}>
            <div className="card card-hover p-7 h-full flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-surface-2 border border-white/10 flex items-center justify-center text-ok">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="kicker">Question 04</div>
                <h3 className="font-display text-xl font-bold text-ink">
                  What single fix yields max impact?
                </h3>
                <p className="text-body text-muted text-sm leading-relaxed">
                  Algorithmic bottleneck analysis pinpoints the exact CLI command that severs the maximum number of attack paths at once.
                </p>
              </div>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-caption font-mono text-faint">
                <span>High leverage</span>
                <span className="text-ok font-semibold">Instant Remediation</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= INTERACTIVE ENGINE PREVIEW SHOWCASE ================= */}
      <section className="space-y-8">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-3">Live Platform Preview</div>
              <h2 className="section-title">Engine in Action</h2>
            </div>

            {/* Selector Tabs */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setActivePreviewTab('audit')}
                className={`px-4 py-1.5 rounded-full font-mono text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                  activePreviewTab === 'audit' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                1. Rule Evaluation
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('attack-path')}
                className={`px-4 py-1.5 rounded-full font-mono text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                  activePreviewTab === 'attack-path' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                2. Attack Path Severance
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('governance')}
                className={`px-4 py-1.5 rounded-full font-mono text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                  activePreviewTab === 'governance' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                3. Immutable Chain
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={60}>
          {/* Keyed container with tab-crossfade for smooth switching */}
          <div key={activePreviewTab} className="card overflow-hidden border border-white/10 bg-surface tab-crossfade">
            {activePreviewTab === 'audit' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                {/* Left: Input configuration */}
                <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs text-faint uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-accent-hover" />
                      <span>Device Payload Excerpt (Cisco IOS)</span>
                    </div>
                    <span className="badge badge-neutral">Raw AST Input</span>
                  </div>

                  <pre className="code-surface p-5 text-[12px] text-muted overflow-x-auto leading-relaxed">
{`line vty 0 4
 transport input telnet ssh
 login
!
snmp-server community public ro
!
no ip http secure-server
ip http server`}
                  </pre>

                  <div className="text-caption text-faint">
                    Parsed deterministically into normalized token structures with exact line bindings.
                  </div>
                </div>

                {/* Right: Engine verdict */}
                <div className="lg:col-span-6 p-6 sm:p-8 space-y-5 bg-surface-2/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs text-ok uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Deterministic Audit Findings</span>
                    </div>
                    <span className="badge badge-critical">3 Violations Found</span>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-surface-3 p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[11px] text-faint font-bold">CIS-CISCO-2.1.1</div>
                        <div className="font-semibold text-ink text-sm mt-0.5">Telnet cleartext enabled on VTY lines</div>
                        <div className="text-caption text-muted mt-1">Line #2: transport input telnet ssh</div>
                      </div>
                      <span className="badge badge-critical">Critical</span>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-surface-3 p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[11px] text-faint font-bold">CIS-CISCO-1.3.4</div>
                        <div className="font-semibold text-ink text-sm mt-0.5">Default SNMP community string 'public'</div>
                        <div className="text-caption text-muted mt-1">Line #5: snmp-server community public ro</div>
                      </div>
                      <span className="badge badge-critical">Critical</span>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-surface-3 p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[11px] text-faint font-bold">DISA-STIG-NET-004</div>
                        <div className="font-semibold text-ink text-sm mt-0.5">HTTP server enabled without TLS encryption</div>
                        <div className="text-caption text-muted mt-1">Line #8: ip http server</div>
                      </div>
                      <span className="badge badge-high">High</span>
                    </div>
                  </div>

                  <button
                    onClick={onEnterDashboard}
                    className="btn btn-solid btn-sm w-full mt-2"
                  >
                    <span>View Full Audit Inspector in Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activePreviewTab === 'attack-path' && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="kicker">Correlation Engine</span>
                    <h3 className="font-display font-bold text-xl text-ink mt-1">
                      Multi-Stage Chained Compromise Path
                    </h3>
                  </div>
                  <span className="badge badge-critical">Path Score: 94 / 100 High Risk</span>
                </div>

                {/* Path Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-crit/40 bg-crit/10 p-5 space-y-3">
                    <div className="font-mono text-[11px] font-bold text-crit uppercase">Step 1: Ingress</div>
                    <div className="font-semibold text-ink text-[14px]">Telnet Interception</div>
                    <p className="text-caption text-muted">
                      Attacker sniffs cleartext transport credentials across untrusted network hop (Port 23).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-high/40 bg-high/10 p-5 space-y-3">
                    <div className="font-mono text-[11px] font-bold text-high uppercase">Step 2: Enumeration</div>
                    <div className="font-semibold text-ink text-[14px]">SNMP Tree Traversal</div>
                    <p className="text-caption text-muted">
                      'public' community string allows extracting routing tables and neighbor topology.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 space-y-3">
                    <div className="font-mono text-[11px] font-bold text-accent-hover uppercase">Step 3: Escalation</div>
                    <div className="font-semibold text-ink text-[14px]">Privilege 15 Elevation</div>
                    <p className="text-caption text-muted">
                      Weak secret hashing yields complete administrative control over core configuration.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-crit/40 bg-crit/10 p-5 space-y-3">
                    <div className="font-mono text-[11px] font-bold text-crit uppercase">Step 4: Takeover</div>
                    <div className="font-semibold text-ink text-[14px]">Core Route Hijack</div>
                    <p className="text-caption text-muted">
                      Full infrastructure compromise routing internal defense traffic to adversary mirror.
                    </p>
                  </div>
                </div>

                {/* Single Fix Box */}
                <div className="rounded-2xl border border-ok/40 bg-ok/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-ok flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Single Key Fix (High-Leverage Remediation)
                    </div>
                    <div className="font-mono text-ink text-[13px]">
                      line vty 0 15 &bull; transport input ssh
                    </div>
                    <p className="text-caption text-muted">
                      Applying this single line severs 100% of the active attack chain by closing cleartext ingress at Step 1.
                    </p>
                  </div>
                  <button onClick={onEnterDashboard} className="btn btn-primary btn-sm">
                    Inspect in Graph Mode &rarr;
                  </button>
                </div>
              </div>
            )}

            {activePreviewTab === 'governance' && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="kicker">Non-Repudiation Architecture</span>
                    <h3 className="font-display font-bold text-xl text-ink mt-1">
                      Cryptographic SHA-256 Tamper-Evident Ledger
                    </h3>
                  </div>
                  <button onClick={onOpenAuditTrail} className="btn btn-ghost btn-sm">
                    <Lock className="w-3.5 h-3.5 text-ok" />
                    Verify Chain Live
                  </button>
                </div>

                <div className="space-y-3 font-mono text-[12px]">
                  <div className="rounded-xl border border-white/10 bg-surface-2 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-pass">Block #104</span>
                      <span className="text-ink">AUDIT_EVENT: FW-MUM-CORE-01</span>
                    </div>
                    <span className="text-faint">Prev: 0x9f4a...81e2 &bull; Hash: 0x3d1c...b018 &bull; Verified</span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-surface-2 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-pass">Block #105</span>
                      <span className="text-ink">AI_DIALECT_APPROVAL: FortiOS-7.2-AST</span>
                    </div>
                    <span className="text-faint">Prev: 0x3d1c...b018 &bull; Hash: 0x7c49...f290 &bull; Actor: lead_analyst</span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-surface-2 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-pass">Block #106</span>
                      <span className="text-ink">GOVERNANCE_WAIVER: CIS-CISCO-2.1.1</span>
                    </div>
                    <span className="text-faint">Prev: 0x7c49...f290 &bull; Hash: 0xa841...cc12 &bull; Actor: SecOps-Lead</span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-surface-2 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-pass">Block #107</span>
                      <span className="text-ink">FLEET_BATCH: 42 Devices Audited</span>
                    </div>
                    <span className="text-faint">Prev: 0xa841...cc12 &bull; Hash: 0xd512...8e21 &bull; Actor: automated_cron</span>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-3 p-4 border border-ok/30 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-ok font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SHA-256 Merkle Chain Integrity: 100% Unbroken &bull; Non-Repudiation Verified</span>
                  </div>
                  <span className="font-mono text-faint text-[11px] hidden sm:inline">Genesis: 0x1102...49a1</span>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* ================= GOVERNANCE TRUST MOMENT ================= */}
      <section>
        <Reveal delayMs={80}>
          <div className="relative overflow-hidden rounded-[28px] border border-accent/40 bg-accent/10 px-8 py-12 sm:px-14 sm:py-16">
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent-hover">
                  <ShieldCheck className="w-4 h-4" />
                  <span>The Human-in-the-Loop Standard</span>
                </div>
                <h2 className="font-display font-bold text-h1 text-ink">
                  AI proposes. Deterministic code decides. Humans approve.
                </h2>
                <p className="text-body text-muted text-base leading-relaxed">
                  Unlike brittle black-box scanners that hallucinate compliance false positives, TRINETRA uses local offline LLMs solely to propose syntax normalizations. 
                  Every unknown dialect is signed off by a human analyst and cached forever as an immutable deterministic parser rule.
                </p>
                <div className="pt-2 flex flex-wrap gap-4">
                  <button onClick={onOpenMappings} className="btn btn-primary">
                    <Sparkles className="w-4 h-4" />
                    <span>Review Dialect Mappings</span>
                  </button>
                  <button onClick={onOpenAuditTrail} className="btn btn-ghost">
                    <History className="w-4 h-4" />
                    <span>Explore Cryptographic Audit Trail</span>
                  </button>
                </div>
              </div>

              <div className="text-center lg:text-right border-l-0 lg:border-l border-white/10 lg:pl-12">
                <div className="stat-number !text-[clamp(4.5rem,10vw,8rem)] text-accent-hover leading-none">
                  100%
                </div>
                <div className="stat-label mt-3">Governance Verification</div>
                <div className="text-caption text-faint mt-1">Zero unauthorized dialect drift</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= TECHNICAL ARCHITECTURE FAQ ACCORDION ================= */}
      <section className="space-y-8">
        <Reveal delayMs={40}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-3">Technical Specifications</div>
              <h2 className="section-title">Architecture &amp; Security Guarantees</h2>
            </div>
            <p className="max-w-md text-body text-muted">
              Deep-dive into TRINETRA's deterministic AST parser, air-gapped deployment model, and cryptographic verification ledger.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndices.includes(idx);
              return (
                <div key={idx} className="card p-5 sm:p-6 transition-colors duration-150">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <span className="font-display font-bold text-base sm:text-lg text-ink">
                      {item.q}
                    </span>
                    <span className="h-8 w-8 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 text-muted transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-accent-hover' : ''
                        }`}
                      />
                    </span>
                  </button>

                  <div className={`collapsible-grid ${isOpen ? 'is-expanded' : ''}`}>
                    <div className="collapsible-inner pt-4">
                      <p className="text-body text-muted text-sm sm:text-base leading-relaxed border-t border-white/10 pt-4">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ================= BOTTOM ACTION CALLOUT ================= */}
      <section className="text-center space-y-8">
        <Reveal delayMs={60}>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="kicker">Ready to evaluate your infrastructure?</div>
            <h2 className="font-display font-bold text-h1 text-ink">
              Run your first compliance audit in seconds.
            </h2>
            <p className="text-body text-muted max-w-xl mx-auto">
              Upload a single router config or drop a fleet .zip archive to instantly generate executive compliance reports and attack path diagrams.
            </p>
            <div className="pt-6 flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={onEnterDashboard}
                className="btn btn-primary !px-8 !py-4 shadow-glow-accent text-white"
              >
                <span>Launch Audit Console &rarr;</span>
              </button>
              <button
                onClick={onNewAudit}
                className="btn btn-ghost !px-7 !py-4 text-muted hover:text-ink"
              >
                <Zap className="w-4 h-4 text-accent-hover" />
                <span>Upload Device Configuration</span>
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default LandingView;
