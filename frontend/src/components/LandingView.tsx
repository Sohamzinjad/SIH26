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
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden rounded-lg border border-white/15 bg-[#121215] px-6 py-12 sm:px-10 lg:px-16 lg:py-20">
        <div className="relative z-10 max-w-4xl">
          {/* Kicker with beacon */}
          <div className="inline-flex items-center gap-2 rounded border border-white/20 bg-[#18181c] px-3 py-1 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a1aa]">
              TRINETRA &bull; High Assurance Defense Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-sans text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-none">
            Deterministic security compliance.
            <span className="block text-[#a1a1aa] mt-2 font-normal">Zero guesswork.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-sm sm:text-base text-[#a1a1aa] font-normal leading-relaxed">
            Audit critical enterprise routers, firewalls, and air-gapped switches against national technical benchmarks. 
            Real-time attack-path correlation, multi-vendor dialect parsing, and high-leverage single-key remediation.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onEnterDashboard}
              className="btn btn-primary !px-6 !py-3 !text-[12px]"
            >
              <span>Launch Audit Console</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onNewAudit}
              className="btn btn-ghost !px-5 !py-3 !text-[12px]"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Upload Config</span>
            </button>

            <button
              onClick={onExploreFleet}
              className="btn btn-ghost !px-5 !py-3 !text-[12px]"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#71717a]" />
              <span>Explore Fleet</span>
            </button>
          </div>

          {/* Trust markers */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 font-mono text-[10px] text-[#71717a] uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CIS Benchmarks</span>
            </div>
            <div className="flex items-center gap-1.5 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>NIST SP 800-53 Rev 5</span>
            </div>
            <div className="flex items-center gap-1.5 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DISA STIG</span>
            </div>
            <div className="flex items-center gap-1.5 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Air-Gapped Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HERO STATS CALLOUTS ================= */}
      <section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 border-b border-white/10 pb-12">
          <Reveal delayMs={0}>
            <div className="space-y-1">
              <div className="stat-number text-white">100%</div>
              <div className="stat-label">Human-Approved AI</div>
              <p className="text-xs text-[#71717a] mt-1">
                Every unknown vendor syntax proposal is strictly approved by an analyst before rule evaluation.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={40}>
            <div className="space-y-1">
              <div className="stat-number text-white">240+</div>
              <div className="stat-label">Benchmark Controls</div>
              <p className="text-xs text-[#71717a] mt-1">
                Comprehensive rules across CIS Cisco, FortiOS, NIST SP 800-53, and DISA STIG frameworks.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="space-y-1">
              <div className="stat-number text-white">0%</div>
              <div className="stat-label">Model Hallucination</div>
              <p className="text-xs text-[#71717a] mt-1">
                Audits run on a 100% deterministic rule engine with verifiable AST logic and line-numbered evidence.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <div className="space-y-1">
              <div className="stat-number text-white">-78%</div>
              <div className="stat-label">Vector Severance</div>
              <p className="text-xs text-[#71717a] mt-1">
                Single-key remediation identifies the single highest-leverage CLI command to dismantle chained exploits.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= THE 4 OPERATIONAL QUESTIONS ================= */}
      <section className="space-y-8">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-2">The Architectural Philosophy</div>
              <h2 className="section-title">The Four Questions of Operational Defense</h2>
            </div>
            <p className="max-w-md text-xs text-[#a1a1aa] leading-relaxed">
              Rather than generic vulnerability lists, TRINETRA answers the fundamental questions operational commanders ask during incidents.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delayMs={20}>
            <div className="card p-6 h-full flex flex-col justify-between space-y-4 border border-white/10 bg-[#121215]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="kicker">Question 01</div>
                <h3 className="font-sans text-base font-bold text-white">
                  What do we actually have?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Automated dialect detection across Cisco IOS, IOS-XE, FortiOS, Juniper JunOS, and white-box network equipment.
                </p>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>Multi-vendor AST</span>
                <span className="text-white font-bold">100% Parsed</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={40}>
            <div className="card p-6 h-full flex flex-col justify-between space-y-4 border border-white/10 bg-[#121215]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="kicker">Question 02</div>
                <h3 className="font-sans text-base font-bold text-white">
                  Where is the risk concentrated?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Instant mapping against CIS Cisco Benchmarks and DISA STIGs with line-level config evidence for every finding.
                </p>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>Severity weighted</span>
                <span className="text-white font-bold">Zero False Positives</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={60}>
            <div className="card p-6 h-full flex flex-col justify-between space-y-4 border border-white/10 bg-[#121215]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <GitFork className="w-5 h-5" />
                </div>
                <div className="kicker">Question 03</div>
                <h3 className="font-sans text-base font-bold text-white">
                  How can an adversary chain them?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Graph-based attack chain modeling correlates isolated findings (e.g. unencrypted Telnet + default SNMP + weak privilege) into full compromise paths.
                </p>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>Attack path graph</span>
                <span className="text-white font-bold">Step-by-step Sim</span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="card p-6 h-full flex flex-col justify-between space-y-4 border border-white/10 bg-[#121215]">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="kicker">Question 04</div>
                <h3 className="font-sans text-base font-bold text-white">
                  What single fix yields max impact?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Algorithmic bottleneck analysis pinpoints the exact CLI command that severs the maximum number of attack paths at once.
                </p>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>High leverage</span>
                <span className="text-white font-bold">Instant Remediation</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= INTERACTIVE ENGINE PREVIEW SHOWCASE ================= */}
      <section className="space-y-6">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-2">Live Platform Preview</div>
              <h2 className="section-title">Engine in Action</h2>
            </div>

            {/* Selector Tabs */}
            <div className="flex items-center gap-1 rounded border border-white/15 bg-[#121215] p-1">
              <button
                type="button"
                onClick={() => setActivePreviewTab('audit')}
                className={`px-3 py-1 rounded font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'audit' ? 'bg-white text-black' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                1. Rule Evaluation
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('attack-path')}
                className={`px-3 py-1 rounded font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'attack-path' ? 'bg-white text-black' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                2. Attack Path Severance
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('governance')}
                className={`px-3 py-1 rounded font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'governance' ? 'bg-white text-black' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                3. Immutable Chain
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={40}>
          <div key={activePreviewTab} className="card overflow-hidden border border-white/15 bg-[#121215] view-transition">
            {activePreviewTab === 'audit' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                {/* Left: Input configuration */}
                <div className="lg:col-span-6 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs text-[#a1a1aa] uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-white" />
                      <span>Device Payload Excerpt (Cisco IOS)</span>
                    </div>
                    <span className="badge badge-neutral">Raw AST Input</span>
                  </div>

                  <pre className="code-surface p-4 text-[11.5px] text-[#cccccc] overflow-x-auto leading-relaxed border border-white/10 bg-black">
{`line vty 0 4
 transport input telnet ssh
 login
!
snmp-server community public ro
!
no ip http secure-server
ip http server`}
                  </pre>

                  <div className="text-xs text-[#71717a]">
                    Parsed deterministically into normalized token structures with exact line bindings.
                  </div>
                </div>

                {/* Right: Engine verdict */}
                <div className="lg:col-span-6 p-6 space-y-4 bg-[#18181c]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs text-white uppercase tracking-wider font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Deterministic Audit Findings</span>
                    </div>
                    <span className="badge badge-fail">3 Violations Found</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="rounded border border-white/15 bg-black p-3.5 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[10px] text-[#71717a] font-bold">CIS-CISCO-2.1.1</div>
                        <div className="font-semibold text-white text-xs mt-0.5">Telnet cleartext enabled on VTY lines</div>
                        <div className="text-[11px] text-[#a1a1aa] mt-1 font-mono">Line #2: transport input telnet ssh</div>
                      </div>
                      <span className="badge badge-fail">Critical</span>
                    </div>

                    <div className="rounded border border-white/15 bg-black p-3.5 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[10px] text-[#71717a] font-bold">CIS-CISCO-1.3.4</div>
                        <div className="font-semibold text-white text-xs mt-0.5">Default SNMP community string 'public'</div>
                        <div className="text-[11px] text-[#a1a1aa] mt-1 font-mono">Line #5: snmp-server community public ro</div>
                      </div>
                      <span className="badge badge-fail">Critical</span>
                    </div>

                    <div className="rounded border border-white/15 bg-black p-3.5 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[10px] text-[#71717a] font-bold">DISA-STIG-NET-004</div>
                        <div className="font-semibold text-white text-xs mt-0.5">HTTP server enabled without TLS encryption</div>
                        <div className="text-[11px] text-[#a1a1aa] mt-1 font-mono">Line #8: ip http server</div>
                      </div>
                      <span className="badge badge-high">High</span>
                    </div>
                  </div>

                  <button
                    onClick={onEnterDashboard}
                    className="btn btn-primary btn-sm w-full mt-2"
                  >
                    <span>View Full Audit Inspector in Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activePreviewTab === 'attack-path' && (
              <div className="p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="kicker">Correlation Engine</span>
                    <h3 className="font-sans font-bold text-lg text-white mt-0.5">
                      Multi-Stage Chained Compromise Path
                    </h3>
                  </div>
                  <span className="badge badge-fail">Path Score: 94 / 100 High Risk</span>
                </div>

                {/* Path Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded border border-white/20 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-white uppercase">Step 1: Ingress</div>
                    <div className="font-bold text-white text-xs">Telnet Interception</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      Attacker sniffs cleartext transport credentials across untrusted network hop (Port 23).
                    </p>
                  </div>

                  <div className="rounded border border-white/20 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-white uppercase">Step 2: Enumeration</div>
                    <div className="font-bold text-white text-xs">SNMP Tree Traversal</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      'public' community string allows extracting routing tables and neighbor topology.
                    </p>
                  </div>

                  <div className="rounded border border-white/20 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-white uppercase">Step 3: Escalation</div>
                    <div className="font-bold text-white text-xs">Privilege 15 Elevation</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      Weak secret hashing yields complete administrative control over core configuration.
                    </p>
                  </div>

                  <div className="rounded border border-white/20 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-white uppercase">Step 4: Takeover</div>
                    <div className="font-bold text-white text-xs">Core Route Hijack</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      Full infrastructure compromise routing internal defense traffic to adversary mirror.
                    </p>
                  </div>
                </div>

                {/* Single Fix Box */}
                <div className="rounded border border-white/25 bg-[#18181c] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" />
                      Single Key Fix (High-Leverage Remediation)
                    </div>
                    <div className="font-mono text-white text-xs font-bold">
                      line vty 0 15 &bull; transport input ssh
                    </div>
                    <p className="text-xs text-[#a1a1aa]">
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
              <div className="p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="kicker">Non-Repudiation Architecture</span>
                    <h3 className="font-sans font-bold text-lg text-white mt-0.5">
                      Cryptographic SHA-256 Tamper-Evident Ledger
                    </h3>
                  </div>
                  <button onClick={onOpenAuditTrail} className="btn btn-ghost btn-sm">
                    <Lock className="w-3.5 h-3.5 text-white" />
                    Verify Chain Live
                  </button>
                </div>

                <div className="space-y-2.5 font-mono text-[11px]">
                  <div className="rounded border border-white/15 bg-black p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="badge badge-pass">Block #104</span>
                      <span className="text-white">AUDIT_EVENT: FW-MUM-CORE-01</span>
                    </div>
                    <span className="text-[#71717a]">Prev: 0x9f4a...81e2 &bull; Hash: 0x3d1c...b018 &bull; Verified</span>
                  </div>

                  <div className="rounded border border-white/15 bg-black p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="badge badge-pass">Block #105</span>
                      <span className="text-white">AI_DIALECT_APPROVAL: FortiOS-7.2-AST</span>
                    </div>
                    <span className="text-[#71717a]">Prev: 0x3d1c...b018 &bull; Hash: 0x7c49...f290 &bull; Actor: lead_analyst</span>
                  </div>

                  <div className="rounded border border-white/15 bg-black p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="badge badge-pass">Block #106</span>
                      <span className="text-white">GOVERNANCE_WAIVER: CIS-CISCO-2.1.1</span>
                    </div>
                    <span className="text-[#71717a]">Prev: 0x7c49...f290 &bull; Hash: 0xa841...cc12 &bull; Actor: SecOps-Lead</span>
                  </div>

                  <div className="rounded border border-white/15 bg-black p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="badge badge-pass">Block #107</span>
                      <span className="text-white">FLEET_BATCH: 42 Devices Audited</span>
                    </div>
                    <span className="text-[#71717a]">Prev: 0xa841...cc12 &bull; Hash: 0xd512...8e21 &bull; Actor: automated_cron</span>
                  </div>
                </div>

                <div className="rounded bg-[#18181c] p-3.5 border border-white/20 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-white font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>SHA-256 Merkle Chain Integrity: 100% Unbroken &bull; Non-Repudiation Verified</span>
                  </div>
                  <span className="font-mono text-[#71717a] text-[10px] hidden sm:inline">Genesis: 0x1102...49a1</span>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* ================= GOVERNANCE TRUST MOMENT ================= */}
      <section>
        <Reveal delayMs={40}>
          <div className="rounded-lg border border-white/20 bg-[#121215] p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  <ShieldCheck className="w-4 h-4" />
                  <span>The Human-in-the-Loop Standard</span>
                </div>
                <h2 className="font-sans font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  AI proposes. Deterministic code decides. Humans approve.
                </h2>
                <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                  Unlike brittle black-box scanners that hallucinate compliance false positives, TRINETRA uses local offline LLMs solely to propose syntax normalizations. 
                  Every unknown dialect is signed off by a human analyst and cached forever as an immutable deterministic parser rule.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button onClick={onOpenMappings} className="btn btn-primary btn-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Review Dialect Mappings</span>
                  </button>
                  <button onClick={onOpenAuditTrail} className="btn btn-ghost btn-sm">
                    <History className="w-3.5 h-3.5" />
                    <span>Explore Cryptographic Audit Trail</span>
                  </button>
                </div>
              </div>

              <div className="text-center lg:text-right border-l-0 lg:border-l border-white/10 lg:pl-10">
                <div className="stat-number !text-5xl sm:!text-6xl text-white font-extrabold">
                  100%
                </div>
                <div className="stat-label mt-2">Governance Verification</div>
                <div className="text-xs text-[#71717a] mt-1">Zero unauthorized dialect drift</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= TECHNICAL ARCHITECTURE FAQ ACCORDION ================= */}
      <section className="space-y-6">
        <Reveal delayMs={20}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-2">Technical Specifications</div>
              <h2 className="section-title">Architecture &amp; Security Guarantees</h2>
            </div>
            <p className="max-w-md text-xs text-[#a1a1aa] leading-relaxed">
              Deep-dive into TRINETRA's deterministic AST parser, air-gapped deployment model, and cryptographic verification ledger.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={40}>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndices.includes(idx);
              return (
                <div key={idx} className="card p-4 sm:p-5 border border-white/10 bg-[#121215]">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <span className="font-sans font-bold text-sm sm:text-base text-white">
                      {item.q}
                    </span>
                    <span className="h-6 w-6 rounded border border-white/20 bg-black flex items-center justify-center shrink-0">
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pt-3 mt-3 border-t border-white/10">
                      <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ================= BOTTOM ACTION CALLOUT ================= */}
      <section className="text-center space-y-6">
        <Reveal delayMs={20}>
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="kicker">Ready to evaluate your infrastructure?</div>
            <h2 className="font-sans font-bold text-2xl sm:text-3xl text-white">
              Run your first compliance audit in seconds.
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl mx-auto leading-relaxed">
              Upload a single router config or drop a fleet .zip archive to instantly generate executive compliance reports and attack path diagrams.
            </p>
            <div className="pt-4 flex flex-wrap justify-center items-center gap-3">
              <button
                onClick={onEnterDashboard}
                className="btn btn-primary !px-6 !py-3"
              >
                <span>Launch Audit Console &rarr;</span>
              </button>
              <button
                onClick={onNewAudit}
                className="btn btn-ghost !px-5 !py-3"
              >
                <Zap className="w-4 h-4 text-white" />
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
