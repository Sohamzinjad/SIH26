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
  Lock,
  ChevronRight,
  Shield,
  Activity
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
  activeAuditId,
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
      {/* Top Command Bar */}
      <header className="bg-[#171717] border-b border-[#232323] text-[#F1F1EF] sticky top-0 z-40 h-14 flex items-center justify-between px-4 sm:px-6 shadow-md">
        {/* Left: Tagline & Security Motto */}
        <div className="flex items-center space-x-4">
          <div className="hidden xl:flex items-center space-x-2 text-[11px] font-mono tracking-wider text-[#B9B9B4]">
            <span className="text-[#00A86B] font-bold">AI PROPOSES.</span>
            <span>DETERMINISTIC CODE DECIDES.</span>
            <span className="text-white font-semibold">HUMANS APPROVE.</span>
          </div>
        </div>

        {/* Center: Search & NTRO Badge */}
        <div className="flex items-center space-x-6">
          <div className="relative hidden md:block w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E5E5E]" />
            <input 
              type="text"
              placeholder="Search devices, audits, findings..."
              className="w-full bg-[#232323] border border-[#3A3A3A] text-xs text-[#F1F1EF] placeholder-[#5E5E5E] pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#B9B9B4] font-mono"
            />
          </div>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-[#232323] border border-[#3A3A3A] text-[11px] text-[#B9B9B4] tracking-widest font-semibold uppercase">
            <Shield className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>NATIONAL TECHNICAL RESEARCH ORGANISATION</span>
          </div>
        </div>

        {/* Right: Air-Gap Indicator & User Profile */}
        <div className="flex items-center space-x-4 text-xs">
          {/* Air-Gapped Mode pill */}
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-[#232323] border border-[#3A3A3A] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></span>
            <span className="font-mono text-[#F1F1EF] font-bold">AIR-GAPPED MODE</span>
            <span className="text-[#5E5E5E]">&bull;</span>
            <span className="text-[#B9B9B4]">Local AI (Ollama)</span>
          </div>

          {/* Notifications */}
          <button className="p-1.5 hover:bg-[#232323] text-[#B9B9B4] hover:text-white transition">
            <Bell className="w-4 h-4" />
          </button>

          {/* User Badge */}
          <div className="flex items-center space-x-2.5 pl-3 border-l border-[#3A3A3A]">
            <div className="w-7 h-7 bg-[#232323] border border-[#B9B9B4] text-white flex items-center justify-center font-mono text-xs font-bold">
              AT
            </div>
            <div className="hidden sm:block text-left font-mono">
              <div className="text-xs font-bold text-white leading-none">Ayush Thakur</div>
              <div className="text-[10px] text-[#5E5E5E] leading-tight mt-0.5">Analyst / SOC</div>
            </div>
          </div>
        </div>
      </header>

      {/* Left Navigation Rail (Desktop) */}
      <aside className="fixed left-0 top-14 bottom-0 w-60 bg-[#F1F1EF] border-r border-[#B9B9B4] z-30 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Brand Header */}
          <div 
            className="p-5 border-b border-[#B9B9B4] bg-[#EAEAE7] cursor-pointer group"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="flex items-center space-x-3">
              {/* TRINETRA Tactical Logo Emblem */}
              <div className="relative w-9 h-9 bg-[#171717] border border-[#232323] flex items-center justify-center trinetra-chamfer">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-none stroke-current stroke-2">
                  <polygon points="12 2 22 20 2 20" />
                  <circle cx="12" cy="13" r="3" fill="#D64545" />
                </svg>
              </div>

              <div>
                <div className="font-display font-black text-lg tracking-widest text-[#171717] leading-none">
                  TRINETRA
                </div>
                <div className="text-[9px] font-mono tracking-wider text-[#5E5E5E] uppercase mt-1">
                  NETWORK SECURITY INTELLIGENCE
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-mono tracking-wider font-semibold transition ${
                    isActive
                      ? 'bg-[#171717] text-white trinetra-chamfer shadow-sm'
                      : 'text-[#232323] hover:bg-[#EAEAE7] hover:text-[#171717]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#00A86B]' : 'text-[#5E5E5E]'}`} />
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

        {/* Bottom Rail Graphic & Mottos */}
        <div className="p-4 border-t border-[#B9B9B4] bg-[#EAEAE7] space-y-3">
          {/* Tactical Mountain / Topo Graphic */}
          <div className="h-16 w-full bg-[#171717] border border-[#232323] relative overflow-hidden trinetra-chamfer p-2.5 flex flex-col justify-between">
            <div className="trinetra-dark-grid-bg absolute inset-0 opacity-20"></div>
            <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#B9B9B4]">
              <span className="font-bold text-white">GRID MONITOR</span>
              <span className="text-[#00A86B]">ACTIVE</span>
            </div>
            <div className="relative z-10 text-[9px] font-mono text-[#5E5E5E] tracking-widest uppercase">
              DEFENSE INTELLIGENCE
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#5E5E5E] space-y-0.5 tracking-wider font-semibold">
            <div>SEE</div>
            <div>UNDERSTAND</div>
            <div>SECURE</div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#5E5E5E] pt-2 border-t border-[#B9B9B4]/50">
            <span>TRINETRA v0.1.0</span>
            <span className="text-[#171717] font-bold">NTRO</span>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Top Dropdown */}
      <div className="md:hidden bg-[#F1F1EF] border-b border-[#B9B9B4] p-2 flex overflow-x-auto space-x-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`px-3 py-1.5 text-xs font-mono whitespace-nowrap ${
              currentTab === item.id ? 'bg-[#171717] text-white font-bold' : 'text-[#232323]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
