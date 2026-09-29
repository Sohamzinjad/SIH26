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
  Terminal,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Workflow,
  History,
  Layers,
  Network,
  Database,
  Cpu,
  ChevronRight,
} from 'lucide-react';

interface LandingViewProps {
  onEnterDashboard: () => void;
  onNewAudit: () => void;
  onExploreFleet: () => void;
  onOpenMappings: () => void;
  onOpenAuditTrail: () => void;
}

interface PipelineStep {
  id: string;
  num: string;
  name: string;
  shortDesc: string;
  techDetail: string;
  badge: string;
  snippet: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'config',
    num: '01',
    name: 'Config File',
    shortDesc: 'Multi-vendor payload ingestion',
    techDetail: 'Ingests Cisco IOS/IOS-XE, Fortinet FortiOS, and White-Box raw configuration payloads via single upload or compressed .zip fleet archives with zip-bomb safeguards.',
    badge: 'Multi-Vendor Ingestion',
    snippet: `line vty 0 4\n transport input telnet ssh\n login\nsnmp-server community public ro`,
  },
  {
    id: 'fingerprint',
    num: '02',
    name: 'Dialect Fingerprint',
    shortDesc: 'SHA-256 syntax signature hash',
    techDetail: 'Generates a deterministic SHA-256 fingerprint of the vendor syntax structure to query local immutable dialect caches before AI invocation.',
    badge: 'SHA-256 Signature',
    snippet: `fingerprint = sha256(canonicalize_syntax_structure(raw_config))\ncache_hit = dialect_db.lookup(fingerprint)`,
  },
  {
    id: 'ast',
    num: '03',
    name: 'AST Parser',
    shortDesc: 'Deterministic state-machine parsing',
    techDetail: 'Parses configuration lines into exact Abstract Syntax Tree (AST) nodes, mapping directives to exact 1-indexed line numbers and code snippets.',
    badge: '100% Line Evidence',
    snippet: `[Line #2] vty_0_4 -> { directive: 'transport input', value: ['telnet', 'ssh'] }\n[Line #4] snmp_community -> { string: 'public', access: 'ro' }`,
  },
  {
    id: 'rules',
    num: '04',
    name: 'Rule Engine',
    shortDesc: 'CIS, NIST & STIG evaluation',
    techDetail: 'Evaluates normalized AST against 240+ compliance rules across CIS Cisco IOS v4.0.0, FortiOS Benchmark, NIST SP 800-53 Rev 5, and DISA STIG.',
    badge: '240+ Controls',
    snippet: `def check_cisco_vty_telnet(ast):\n  if "telnet" in ast.vty.transport_input:\n    return Finding(rule_id="CIS-CISCO-2.1.1", severity="CRITICAL", line=2)`,
  },
  {
    id: 'graph',
    num: '05',
    name: 'Attack Graph',
    shortDesc: 'Multi-hop exploit path correlation',
    techDetail: 'Correlates isolated findings across VTY ingress, SNMP community disclosure, and weak credentials into complete multi-stage adversary pivot chains.',
    badge: 'Graph Correlation',
    snippet: `AttackPath(score=94):\n  Step 1: Telnet Sniffing -> Step 2: SNMP Recon -> Step 3: Privilege 15 Takeover`,
  },
  {
    id: 'bottleneck',
    num: '06',
    name: 'Bottleneck Analysis',
    shortDesc: 'Single-key CLI fix calculation',
    techDetail: 'Executes graph bridge-severance algorithms to calculate the single highest-leverage CLI command that dismantles maximum active threat vectors.',
    badge: 'High Leverage Fix',
    snippet: `SingleKeyFix:\n  CLI: "line vty 0 15 \\n transport input ssh"\n  Impact: Sever 100% of ingress attack paths`,
  },
  {
    id: 'ledger',
    num: '07',
    name: 'Audit Ledger',
    shortDesc: 'Cryptographic SHA-256 hash chain',
    techDetail: 'Seals every audit result, human mapping approval, and governance waiver into a forward-linked SHA-256 Merkle chain for mathematical non-repudiation.',
    badge: 'Tamper Evident',
    snippet: `H_n = SHA256(CanonicalJSON(Payload_n) || H_{n-1})\nVerify: 100% Chain Integrity Verified`,
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
  const [activePipelineStep, setActivePipelineStep] = useState<string>('ast');

  const selectedStepObj = PIPELINE_STEPS.find((s) => s.id === activePipelineStep) || PIPELINE_STEPS[2];

  return (
    <div className="space-y-28 lg:space-y-36 pb-24 text-white">
      {/* ================= HERO SECTION (Background #050505) ================= */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#050505] p-8 sm:p-12 lg:p-16">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute -top-32 right-[-5%] h-[500px] w-[500px] rounded-full bg-indigo-900/10 blur-3xl" />
          <div className="absolute -bottom-40 left-[-5%] h-[500px] w-[500px] rounded-full bg-violet-900/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Beacon Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#121215] px-3.5 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1a1aa]">
              TRINETRA &bull; High Assurance Defense Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
            Deterministic Security Compliance
            <span className="block text-[#a1a1aa] mt-2 font-normal text-2xl sm:text-4xl lg:text-5xl">
              For Air-Gapped Defense Networks
            </span>
          </h1>

          {/* Subtitle - Max-width 650px */}
          <p className="max-w-[650px] text-sm sm:text-base text-[#a1a1aa] font-normal leading-relaxed">
            Audit routers, firewalls, and switches against CIS, NIST, and STIG benchmarks with line-level evidence and zero black-box scoring.
          </p>

          {/* 3 Feature Pills */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 font-mono text-xs font-semibold">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Air-Gapped</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-cyan-400 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Line-Level Evidence</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-purple-400 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Human Approved AI</span>
            </div>
          </div>

          {/* Hierarchical Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={onEnterDashboard}
              className="btn btn-primary !px-7 !py-3.5 !text-sm shadow-[0_0_25px_rgba(255,255,255,0.15)] font-bold transition-all hover:scale-[1.02]"
            >
              <span>Launch Audit Console</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onNewAudit}
              className="btn btn-outline !px-5 !py-3 !text-xs font-semibold border-white/20 hover:border-white/40"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Upload Config</span>
            </button>

            <button
              onClick={onExploreFleet}
              className="btn btn-ghost !px-4 !py-3 !text-xs text-[#a1a1aa] hover:text-white"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#71717a]" />
              <span>Explore Fleet</span>
            </button>
          </div>

          {/* Trust Markers */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 font-mono text-[10px] text-[#71717a] uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-[#cccccc]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CIS Benchmarks</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cccccc]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>NIST SP 800-53 Rev 5</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cccccc]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>DISA STIG</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= REAL METRICS SECTION (Background #080808) ================= */}
      <section className="rounded-2xl border border-white/10 bg-[#080808] p-8 sm:p-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delayMs={0}>
            <div className="rounded-xl border border-white/10 bg-[#121215] p-5 space-y-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase">Analyst Verified</span>
              </div>
              <div className="stat-number text-white font-extrabold text-3xl sm:text-4xl">100%</div>
              <div className="font-sans font-bold text-sm text-white">Human Approved Rules</div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Every unknown vendor syntax dialect is strictly signed off by an analyst before rule evaluation.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={40}>
            <div className="rounded-xl border border-white/10 bg-[#121215] p-5 space-y-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase">Automated Checks</span>
              </div>
              <div className="stat-number text-white font-extrabold text-3xl sm:text-4xl">240+</div>
              <div className="font-sans font-bold text-sm text-white">Security Controls</div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Comprehensive rules across CIS Cisco, FortiOS, NIST SP 800-53, and DISA STIG frameworks.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="rounded-xl border border-white/10 bg-[#121215] p-5 space-y-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase">Deterministic AST</span>
              </div>
              <div className="stat-number text-white font-extrabold text-3xl sm:text-4xl">0</div>
              <div className="font-sans font-bold text-sm text-white">False Positives</div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Audits run on a 100% deterministic rule engine with verifiable AST logic and line-numbered evidence.
              </p>
            </div>
          </Reveal>

          <Reveal delayMs={120}>
            <div className="rounded-xl border border-white/10 bg-[#121215] p-5 space-y-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <GitFork className="w-5 h-5 text-amber-400" />
                <span className="font-mono text-[10px] font-bold text-amber-400 uppercase">Single-Key Fix</span>
              </div>
              <div className="stat-number text-white font-extrabold text-3xl sm:text-4xl">78%</div>
              <div className="font-sans font-bold text-sm text-white">Attack Path Reduction</div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Single-key remediation identifies the single highest-leverage CLI command to dismantle chained exploits.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= THE 4 OPERATIONAL QUESTIONS (Background #080808 + Watermarks & Hover Lift) ================= */}
      <section className="rounded-2xl border border-white/10 bg-[#080808] p-8 sm:p-12 space-y-8">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-2">The Architectural Philosophy</div>
              <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-white">
                The Four Questions of Operational Defense
              </h2>
            </div>
            <p className="max-w-md text-xs text-[#a1a1aa] leading-relaxed">
              Rather than generic vulnerability lists, TRINETRA answers the fundamental questions operational commanders ask during incidents.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 01 */}
          <Reveal delayMs={20}>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121215] p-6 h-full flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl hover:shadow-black/70 hover:bg-[#16161c]">
              {/* Question Number Watermark (Palantir Gotham Style) */}
              <div className="font-mono text-7xl font-extrabold text-white/5 absolute right-4 bottom-2 select-none pointer-events-none">
                01
              </div>

              <div className="space-y-4 relative z-10">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <HardDrive className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="kicker">Question 01</div>
                <h3 className="font-sans text-base font-bold text-white">
                  What do we actually have?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Automated dialect detection across Cisco IOS, IOS-XE, FortiOS, Juniper JunOS, and white-box network equipment.
                </p>
              </div>

              <div className="relative z-10 border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>Multi-vendor AST</span>
                <span className="text-white font-bold">100% Parsed</span>
              </div>
            </div>
          </Reveal>

          {/* Card 02 */}
          <Reveal delayMs={40}>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121215] p-6 h-full flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl hover:shadow-black/70 hover:bg-[#16161c]">
              {/* Watermark */}
              <div className="font-mono text-7xl font-extrabold text-white/5 absolute right-4 bottom-2 select-none pointer-events-none">
                02
              </div>

              <div className="space-y-4 relative z-10">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="kicker">Question 02</div>
                <h3 className="font-sans text-base font-bold text-white">
                  Where is the risk concentrated?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Instant mapping against CIS Cisco Benchmarks and DISA STIGs with line-level config evidence for every finding.
                </p>
              </div>

              <div className="relative z-10 border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>Severity weighted</span>
                <span className="text-white font-bold">Zero False Positives</span>
              </div>
            </div>
          </Reveal>

          {/* Card 03 */}
          <Reveal delayMs={60}>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121215] p-6 h-full flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl hover:shadow-black/70 hover:bg-[#16161c]">
              {/* Watermark */}
              <div className="font-mono text-7xl font-extrabold text-white/5 absolute right-4 bottom-2 select-none pointer-events-none">
                03
              </div>

              <div className="space-y-4 relative z-10">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <GitFork className="w-5 h-5 text-amber-400" />
                </div>
                <div className="kicker">Question 03</div>
                <h3 className="font-sans text-base font-bold text-white">
                  How can an adversary chain them?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Graph-based attack chain modeling correlates isolated findings (e.g. unencrypted Telnet + default SNMP + weak privilege) into full compromise paths.
                </p>
              </div>

              <div className="relative z-10 border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>Attack path graph</span>
                <span className="text-white font-bold">Step-by-step Sim</span>
              </div>
            </div>
          </Reveal>

          {/* Card 04 */}
          <Reveal delayMs={80}>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121215] p-6 h-full flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl hover:shadow-black/70 hover:bg-[#16161c]">
              {/* Watermark */}
              <div className="font-mono text-7xl font-extrabold text-white/5 absolute right-4 bottom-2 select-none pointer-events-none">
                04
              </div>

              <div className="space-y-4 relative z-10">
                <div className="h-10 w-10 rounded border border-white/20 bg-black flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="kicker">Question 04</div>
                <h3 className="font-sans text-base font-bold text-white">
                  What single fix yields max impact?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Algorithmic bottleneck analysis pinpoints the exact CLI command that severs the maximum number of attack paths at once.
                </p>
              </div>

              <div className="relative z-10 border-t border-white/10 pt-3 flex items-center justify-between font-mono text-[10px] text-[#71717a]">
                <span>High leverage</span>
                <span className="text-white font-bold">Instant Remediation</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= INTERACTIVE ENGINE PREVIEW (Background #0B0B0F + Color-Coded Severity) ================= */}
      <section className="rounded-2xl border border-white/10 bg-[#0B0B0F] p-8 sm:p-12 space-y-6">
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="kicker mb-2">Live Platform Preview</div>
              <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-white">
                Engine in Action
              </h2>
            </div>

            {/* Selector Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-[#121215] p-1">
              <button
                type="button"
                onClick={() => setActivePreviewTab('audit')}
                className={`px-3.5 py-1.5 rounded font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'audit' ? 'bg-white text-black' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                1. Rule Evaluation
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('attack-path')}
                className={`px-3.5 py-1.5 rounded font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'attack-path' ? 'bg-white text-black' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                2. Attack Path Severance
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('governance')}
                className={`px-3.5 py-1.5 rounded font-mono text-[11px] font-bold transition-all cursor-pointer ${
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
                <div className="lg:col-span-6 p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs text-[#a1a1aa] uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-white" />
                      <span>Device Payload Excerpt (Cisco IOS)</span>
                    </div>
                    <span className="badge badge-neutral">Raw AST Input</span>
                  </div>

                  <pre className="code-surface p-4 text-[11.5px] text-[#cccccc] overflow-x-auto leading-relaxed border border-white/10 bg-black rounded-lg">
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

                {/* Right: Engine verdict with Color-Coded Severity */}
                <div className="lg:col-span-6 p-6 sm:p-8 space-y-4 bg-[#16161a]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs text-white uppercase tracking-wider font-bold">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Deterministic Audit Findings</span>
                    </div>
                    <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">3 Violations Found</span>
                  </div>

                  {/* Severity Color Coded Finding List */}
                  <div className="space-y-3">
                    {/* Finding 1: Critical (Red) */}
                    <div className="rounded-lg border border-red-500/30 bg-black p-4 flex items-start justify-between gap-4 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-mono text-[10px] text-red-400 font-bold uppercase">CIS-CISCO-2.1.1</span>
                        </div>
                        <div className="font-semibold text-white text-xs mt-1">Telnet cleartext enabled on VTY lines</div>
                        <div className="text-[11px] text-[#a1a1aa] mt-1 font-mono">Line #2: transport input telnet ssh</div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                        Critical
                      </span>
                    </div>

                    {/* Finding 2: Critical (Red) */}
                    <div className="rounded-lg border border-red-500/30 bg-black p-4 flex items-start justify-between gap-4 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-mono text-[10px] text-red-400 font-bold uppercase">CIS-CISCO-1.3.4</span>
                        </div>
                        <div className="font-semibold text-white text-xs mt-1">Default SNMP community string 'public'</div>
                        <div className="text-[11px] text-[#a1a1aa] mt-1 font-mono">Line #5: snmp-server community public ro</div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                        Critical
                      </span>
                    </div>

                    {/* Finding 3: High (Orange) */}
                    <div className="rounded-lg border border-orange-500/30 bg-black p-4 flex items-start justify-between gap-4 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-orange-400" />
                          <span className="font-mono text-[10px] text-orange-400 font-bold uppercase">DISA-STIG-NET-004</span>
                        </div>
                        <div className="font-semibold text-white text-xs mt-1">HTTP server enabled without TLS encryption</div>
                        <div className="text-[11px] text-[#a1a1aa] mt-1 font-mono">Line #8: ip http server</div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase bg-orange-500/20 text-orange-400 border border-orange-500/40">
                        High
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onEnterDashboard}
                    className="btn btn-primary btn-sm w-full mt-2 !py-2.5"
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
                  <span className="px-3 py-1 rounded text-xs font-bold font-mono uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                    Path Score: 94 / 100 High Risk
                  </span>
                </div>

                {/* Path Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-red-500/30 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-red-400 uppercase">Step 1: Ingress</div>
                    <div className="font-bold text-white text-xs">Telnet Interception</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      Attacker sniffs cleartext transport credentials across untrusted network hop (Port 23).
                    </p>
                  </div>

                  <div className="rounded-lg border border-orange-500/30 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-orange-400 uppercase">Step 2: Enumeration</div>
                    <div className="font-bold text-white text-xs">SNMP Tree Traversal</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      'public' community string allows extracting routing tables and neighbor topology.
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-500/30 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-amber-400 uppercase">Step 3: Escalation</div>
                    <div className="font-bold text-white text-xs">Privilege 15 Elevation</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      Weak secret hashing yields complete administrative control over core configuration.
                    </p>
                  </div>

                  <div className="rounded-lg border border-red-500/40 bg-black p-4 space-y-2">
                    <div className="font-mono text-[10px] font-bold text-red-400 uppercase">Step 4: Takeover</div>
                    <div className="font-bold text-white text-xs">Core Route Hijack</div>
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed">
                      Full infrastructure compromise routing internal defense traffic to adversary mirror.
                    </p>
                  </div>
                </div>

                {/* Single Fix Box */}
                <div className="rounded-lg border border-emerald-500/40 bg-[#16161c] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
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
                  <div className="rounded-lg border border-white/15 bg-black p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="badge badge-pass">Block #104</span>
                      <span className="text-white">AUDIT_EVENT: FW-MUM-CORE-01</span>
                    </div>
                    <span className="text-[#71717a]">Prev: 0x9f4a...81e2 &bull; Hash: 0x3d1c...b018 &bull; Verified</span>
                  </div>

                  <div className="rounded-lg border border-white/15 bg-black p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="badge badge-pass">Block #105</span>
                      <span className="text-white">AI_DIALECT_APPROVAL: FortiOS-7.2-AST</span>
                    </div>
                    <span className="text-[#71717a]">Prev: 0x3d1c...b018 &bull; Hash: 0x7c49...f290 &bull; Actor: lead_analyst</span>
                  </div>

                  <div className="rounded-lg border border-white/15 bg-black p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="badge badge-pass">Block #106</span>
                      <span className="text-white">GOVERNANCE_WAIVER: CIS-CISCO-2.1.1</span>
                    </div>
                    <span className="text-[#71717a]">Prev: 0x7c49...f290 &bull; Hash: 0xa841...cc12 &bull; Actor: SecOps-Lead</span>
                  </div>
                </div>

                <div className="rounded-lg bg-[#16161c] p-4 border border-emerald-500/30 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-white font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SHA-256 Merkle Chain Integrity: 100% Unbroken &bull; Non-Repudiation Verified</span>
                  </div>
                  <span className="font-mono text-[#71717a] text-[10px] hidden sm:inline">Genesis: 0x1102...49a1</span>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* ================= HUMAN APPROVAL TRUST MOMENT (Background #080808) ================= */}
      <section className="rounded-2xl border border-white/10 bg-[#080808] p-8 sm:p-12">
        <Reveal delayMs={40}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-purple-400">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
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
                <button onClick={onOpenMappings} className="btn btn-primary btn-sm !px-4 !py-2.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Review Dialect Mappings</span>
                </button>
                <button onClick={onOpenAuditTrail} className="btn btn-outline btn-sm !px-4 !py-2.5">
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
        </Reveal>
      </section>

      {/* ================= TECHNICAL ARCHITECTURE PIPELINE DIAGRAM (Background #050505) ================= */}
      <section className="rounded-2xl border border-white/10 bg-[#050505] p-8 sm:p-12 space-y-8">
        <Reveal delayMs={20}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="kicker mb-2">Technical Architecture</div>
              <h2 className="section-title text-2xl sm:text-3xl font-extrabold text-white">
                End-to-End High Assurance Pipeline
              </h2>
            </div>
            <p className="max-w-md text-xs text-[#a1a1aa] leading-relaxed">
              Explore how raw network configurations flow through TRINETRA's 7-step air-gapped deterministic evaluation engine.
            </p>
          </div>
        </Reveal>

        {/* Horizontal Pipeline Step Nodes */}
        <Reveal delayMs={40}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PIPELINE_STEPS.map((step) => {
              const isActive = activePipelineStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActivePipelineStep(step.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'border-white bg-[#18181c] shadow-lg shadow-black/80 ring-1 ring-white/20'
                      : 'border-white/10 bg-[#101014] hover:border-white/25 hover:bg-[#141418]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold text-[#71717a]">{step.num}</span>
                    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                  </div>
                  <div>
                    <div className={`font-sans text-xs font-bold ${isActive ? 'text-white' : 'text-[#a1a1aa]'}`}>
                      {step.name}
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-0.5 line-clamp-1">
                      {step.shortDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Active Pipeline Detail Box */}
        <Reveal delayMs={60}>
          <div className="rounded-xl border border-white/15 bg-[#121215] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg border border-white/20 bg-black flex items-center justify-center font-mono text-xs font-bold text-white">
                  {selectedStepObj.num}
                </span>
                <div>
                  <h3 className="font-sans font-bold text-lg text-white">
                    Step {selectedStepObj.num}: {selectedStepObj.name}
                  </h3>
                  <p className="text-xs text-[#a1a1aa]">{selectedStepObj.shortDesc}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded text-xs font-mono font-bold uppercase bg-white/10 text-white border border-white/20">
                {selectedStepObj.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-3">
                <div className="kicker">Technical Specification</div>
                <p className="text-xs sm:text-sm text-[#cccccc] leading-relaxed">
                  {selectedStepObj.techDetail}
                </p>
                <div className="pt-2 flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified 100% Offline Air-Gapped Safe</span>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-2">
                <div className="kicker">Execution Code / Schema Excerpt</div>
                <pre className="code-surface p-4 text-[11px] text-[#e5e5e5] leading-relaxed border border-white/10 bg-black rounded-lg overflow-x-auto">
                  {selectedStepObj.snippet}
                </pre>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= BOTTOM ACTION CALLOUT ================= */}
      <section className="text-center space-y-6 py-8">
        <Reveal delayMs={20}>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="kicker">Ready to evaluate your infrastructure?</div>
            <h2 className="font-sans font-bold text-2xl sm:text-4xl text-white">
              Run your first compliance audit in seconds.
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa] max-w-xl mx-auto leading-relaxed">
              Upload a single router config or drop a fleet .zip archive to instantly generate executive compliance reports and attack path diagrams.
            </p>
            <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={onEnterDashboard}
                className="btn btn-primary !px-7 !py-3.5 !text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <span>Launch Audit Console &rarr;</span>
              </button>
              <button
                onClick={onNewAudit}
                className="btn btn-outline !px-5 !py-3 !text-xs font-semibold"
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
