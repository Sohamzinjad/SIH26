import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FolderGit2, 
  HardDrive, 
  ShieldAlert, 
  GitFork, 
  Workflow, 
  History, 
  FileCheck2, 
  SlidersHorizontal,
  Search,
  Bell,
  Shield
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  activeAuditId: number | null;
  activeDeviceId?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingCount,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'upload', label: 'UPLOAD & AUDIT', icon: UploadCloud },
    { id: 'fleet', label: 'FLEET AUDIT', icon: FolderGit2 },
    { id: 'devices', label: 'DEVICES', icon: HardDrive },
    { id: 'findings', label: 'FINDINGS', icon: ShieldAlert },
    { id: 'attack-path', label: 'ATTACK PATHS', icon: GitFork },
    { id: 'mappings', label: 'MAPPINGS', icon: Workflow, badge: pendingCount },
    { id: 'audit-trail', label: 'AUDIT TRAIL', icon: History },
    { id: 'reports', label: 'REPORTS', icon: FileCheck2 },
    { id: 'settings', label: 'SETTINGS', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Top Black Command Bar (#181818) */}
      <header className="bg-[#181818] border-b border-white/10 text-[#F7F6F3] sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 shadow-tactical-dark">
        {/* Left: Security Tagline */}
        <div className="flex items-center space-x-4">
          <div className="hidden xl:flex items-center space-x-2 text-[11px] font-mono tracking-[0.12em] text-[#A0A0A0]">
            <span className="text-[#00A86B] font-bold">AI PROPOSES.</span>
            <span>DETERMINISTIC CODE DECIDES.</span>
            <span className="text-white font-semibold">HUMANS APPROVE.</span>
          </div>
        </div>

        {/* Center: Search & NTRO Organization Seal */}
        <div className="flex items-center space-x-6">
          <div className="relative hidden md:block w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
            <input 
              type="text"
              placeholder="Search devices, audits, findings..."
              className="w-full bg-[#262626] border border-white/10 text-xs text-[#F7F6F3] placeholder-[#777777] pl-8 pr-3 py-1.5 focus:outline-none focus:border-white/30 font-mono transition"
            />
          </div>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-[#262626] border border-white/10 text-[10px] text-[#C0C0C0] tracking-[0.15em] font-semibold uppercase">
            <Shield className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>NATIONAL TECHNICAL RESEARCH ORGANISATION</span>
          </div>
        </div>

        {/* Right: Air-Gap Indicator & User Badge */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-[#262626] border border-white/10 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></span>
            <span className="text-[#F7F6F3] font-bold">AIR-GAPPED MODE</span>
            <span className="text-[#666666]">&bull;</span>
            <span className="text-[#A0A0A0]">Local AI (Ollama)</span>
          </div>

          <button className="p-1.5 hover:bg-[#262626] text-[#A0A0A0] hover:text-white transition">
            <Bell className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2.5 pl-3 border-l border-white/10">
            <div className="w-7 h-7 bg-[#262626] border border-white/20 text-white flex items-center justify-center text-xs font-bold">
              AT
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white leading-none">Ayush Thakur</div>
              <div className="text-[10px] text-[#8E8E8E] leading-tight mt-0.5">Analyst / SOC</div>
            </div>
          </div>
        </div>
      </header>

      {/* Left Charcoal Navigation Rail (#1F1F1F) */}
      <aside className="fixed left-0 top-14 bottom-0 w-60 bg-[#1F1F1F] border-r border-white/10 text-white z-30 flex flex-col justify-between hidden md:flex shadow-tactical-dark">
        <div>
          {/* Brand Header */}
          <div 
            className="p-5 border-b border-white/10 bg-[#161616] cursor-pointer group"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 bg-[#181818] border border-white/20 flex items-center justify-center trinetra-chamfer">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-none stroke-current stroke-2">
                  <polygon points="12 2 22 20 2 20" />
                  <circle cx="12" cy="13" r="3" fill="#D64545" />
                </svg>
              </div>

              <div>
                <div className="font-display font-black text-lg tracking-[0.15em] text-white leading-none">
                  TRINETRA
                </div>
                <div className="text-[9px] font-mono tracking-[0.12em] text-[#8E8E8E] uppercase mt-1">
                  DEFENSE INTELLIGENCE
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="p-3 space-y-1 font-mono">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs tracking-[0.1em] font-bold transition ${
                    isActive
                      ? 'bg-[#F7F6F3] text-[#171717] trinetra-chamfer shadow-tactical-elevated'
                      : 'text-[#C0C0C0] hover:bg-[#282828] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#00A86B]' : 'text-[#8E8E8E]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-[#D64545] text-white font-bold font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail Section */}
        <div className="p-4 border-t border-white/10 bg-[#161616] space-y-3 font-mono">
          <div className="h-16 w-full bg-[#181818] border border-white/10 relative overflow-hidden trinetra-chamfer p-2.5 flex flex-col justify-between">
            <div className="trinetra-dark-grid-bg absolute inset-0 opacity-20"></div>
            <div className="relative z-10 flex items-center justify-between text-[10px] text-[#A0A0A0]">
              <span className="font-bold text-white tracking-wider">GRID MONITOR</span>
              <span className="text-[#00A86B] font-bold">ACTIVE</span>
            </div>
            <div className="relative z-10 text-[9px] text-[#666666] tracking-[0.15em] uppercase">
              DEFENSE INTELLIGENCE
            </div>
          </div>

          <div className="text-[10px] text-[#8E8E8E] space-y-0.5 tracking-[0.15em] font-semibold">
            <div>SEE</div>
            <div>UNDERSTAND</div>
            <div>SECURE</div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#666666] pt-2 border-t border-white/10">
            <span>TRINETRA v0.1.0</span>
            <span className="text-white font-bold">NTRO</span>
          </div>
        </div>
      </aside>
    </>
  );
};
