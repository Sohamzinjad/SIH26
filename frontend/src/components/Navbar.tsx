import React, { useState } from 'react';
import { 
  Boxes, 
  Layers, 
  UploadCloud, 
  Sparkles, 
  FileText, 
  Search, 
  BookOpen, 
  ChevronDown, 
  ShieldCheck, 
  ExternalLink,
  Sliders,
  Check
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  activeAuditId: number | null;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingCount,
  activeAuditId,
}) => {
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState('production-airgap-01');

  const environments = [
    { id: 'production-airgap-01', name: 'NTRO National Defense • Prod', region: 'us-east4 • Airgap' },
    { id: 'staging-isolated-02', name: 'Fleet Staging Sandbox', region: 'isolated-vlan • Sim' },
    { id: 'disa-stig-eval', name: 'DISA / NIST SP 800-53 Lab', region: 'on-prem • High-Sec' },
  ];

  return (
    <header className="bg-[#0F1115]/90 backdrop-blur-md border-b border-[#22262F] sticky top-0 z-50 transition-colors">
      {/* Upper Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Project Selector */}
          <div className="flex items-center space-x-6">
            {/* Pinecone Logo & Wordmark */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setCurrentTab('dashboard')}
            >
              {/* Pinecone Iconic Geometric Logo */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(0,229,140,0.35)]">
                  {/* Top diamond facet */}
                  <polygon points="16,2 26,8 16,14 6,8" fill="#7BF2C0" className="transition-all group-hover:brightness-110" />
                  {/* Left bottom facet */}
                  <polygon points="6,9 16,15 16,27 6,21" fill="#00E58C" className="transition-all group-hover:brightness-110" />
                  {/* Right bottom facet */}
                  <polygon points="16,15 26,9 26,21 16,27" fill="#00B96F" className="transition-all group-hover:brightness-110" />
                </svg>
              </div>
            </div>

            {/* Pinecone Environment / Workspace Dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setProjectOpen(!projectOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#12141A] hover:bg-[#1A1D24] border border-[#22262F] text-xs text-slate-200 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-medium text-slate-200">
                  {environments.find(e => e.id === selectedEnv)?.name.split('•')[0].trim()}
                </span>
                <span className="text-slate-500 text-[11px] font-mono">
                  ({environments.find(e => e.id === selectedEnv)?.region.split('•')[0].trim()})
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {projectOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#12141A] border border-[#2C313B] shadow-2xl p-1.5 z-50">
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-[#232736]">
                    Select Environment
                  </div>
                  <div className="py-1 space-y-1">
                    {environments.map((env) => (
                      <button
                        key={env.id}
                        onClick={() => {
                          setSelectedEnv(env.id);
                          setProjectOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition ${
                          selectedEnv === env.id
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-300 hover:bg-[#1A1D24]'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white">{env.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{env.region}</div>
                        </div>
                        {selectedEnv === env.id && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Tabs (Pinecone Console Style) */}
          <nav className="flex items-center space-x-1 sm:space-x-1 bg-[#12141A] p-1 rounded-xl border border-[#22262F]">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-[#1A1D24] text-white shadow-sm font-semibold'
                  : 'text-[#9AA2B0] hover:text-white hover:bg-[#1A1D24]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>Indexes</span>
            </button>

            <button
              onClick={() => setCurrentTab('upload')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'upload'
                  ? 'bg-[#1A1D24] text-white shadow-sm font-semibold'
                  : 'text-[#9AA2B0] hover:text-white hover:bg-[#1A1D24]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ingest & Audit</span>
            </button>

            {activeAuditId && (
              <button
                onClick={() => setCurrentTab('audit-detail')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'audit-detail'
                    ? 'bg-[#1A1D24] text-white shadow-sm font-semibold'
                    : 'text-[#9AA2B0] hover:text-white hover:bg-[#1A1D24]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono">#{activeAuditId}</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('mappings')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                currentTab === 'mappings'
                  ? 'bg-[#1A1D24] text-white shadow-sm font-semibold'
                  : 'text-[#9AA2B0] hover:text-white hover:bg-[#1A1D24]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Governance</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-emerald-500 text-slate-950 font-bold rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center space-x-3">
            {/* System Status Pill */}
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#12141A] border border-[#22262F] text-[11px] text-slate-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 font-mono">Engine:</span>
              <span className="text-emerald-400 font-medium">100% Deterministic</span>
            </div>

            {/* Quick Docs Link */}
            <a
              href="https://docs.pinecone.io"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition px-2.5 py-1.5 rounded-lg hover:bg-[#1A1D24]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </a>

            {/* User Profile Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#22262F]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00E58C] to-[#00B96F] flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20">
                NT
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
