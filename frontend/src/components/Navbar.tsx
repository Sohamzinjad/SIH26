import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Workflow,
  History,
  HardDrive,
  ShieldAlert,
  GitFork,
  FileCheck2,
  SlidersHorizontal,
  UploadCloud,
  ArrowLeft,
  Menu,
  X,
  ChevronDown,
  Search,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  activeAuditId: number | null;
  activeDeviceId?: number | null;
  onBack?: () => void;
  canGoBack?: boolean;
}

const PRIMARY_LINKS = [
  { id: 'landing', label: 'Platform', icon: Compass },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'fleet', label: 'Fleet Audit', icon: FolderGit2 },
  { id: 'mappings', label: 'Mappings', icon: Workflow },
  { id: 'audit-trail', label: 'Audit Trail', icon: History },
];

const MODULE_LINKS = [
  { id: 'devices', label: 'Devices', icon: HardDrive },
  { id: 'findings', label: 'Findings', icon: ShieldAlert },
  { id: 'attack-path', label: 'Attack Paths', icon: GitFork },
  { id: 'reports', label: 'Reports', icon: FileCheck2 },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingCount,
  onBack,
  canGoBack,
}) => {
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const modulesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (modulesRef.current && !modulesRef.current.contains(e.target as Node)) {
        setModulesOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const nav = (id: string) => {
    setCurrentTab(id);
    setModulesOpen(false);
    setMobileOpen(false);
  };

  const isModuleActive = MODULE_LINKS.some((m) => m.id === currentTab);

  const linkCls = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-140 ${
      active
        ? 'bg-white text-black font-bold'
        : 'text-[#a1a1aa] hover:text-white hover:bg-[#1f1f23]'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: back + brand */}
        <div className="flex min-w-0 items-center gap-3">
          {canGoBack && onBack && (
            <button
              onClick={onBack}
              className="btn btn-ghost btn-sm !px-2.5"
              title="Return to previous page"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <button
            onClick={() => nav('landing')}
            className="flex items-center gap-2.5 group"
            aria-label="TRINETRA home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black transition-colors group-hover:border-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white stroke-2">
                <polygon points="12 2 22 20 2 20" />
                <circle cx="12" cy="13" r="2.5" fill="#FFFFFF" stroke="none" />
              </svg>
            </span>
            <span className="hidden flex-col items-start leading-none sm:flex">
              <span className="font-sans text-[15px] font-bold tracking-[0.1em] text-white uppercase">
                TRINETRA
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#71717a] mt-0.5">
                Compliance Auditor
              </span>
            </span>
          </button>
        </div>

        {/* Center: primary links */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {PRIMARY_LINKS.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button key={item.id} onClick={() => nav(item.id)} className={linkCls(active)}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.id === 'mappings' && pendingCount > 0 && (
                    <span className="ml-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none bg-white text-black">
                      {pendingCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {/* Secondary modules dropdown */}
          <div className="relative" ref={modulesRef}>
            <button
              onClick={() => setModulesOpen((o) => !o)}
              className={`${linkCls(isModuleActive)} flex items-center gap-1.5`}
              aria-expanded={modulesOpen}
            >
              Modules
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${modulesOpen ? 'rotate-180' : ''}`} />
            </button>
            {modulesOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-md border border-white/15 bg-[#121215] p-1 shadow-2xl">
                {MODULE_LINKS.map((m) => {
                  const Icon = m.icon;
                  const active = currentTab === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => nav(m.id)}
                      className={`flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-[12px] font-medium transition-colors ${
                        active ? 'bg-white text-black font-bold' : 'text-[#a1a1aa] hover:bg-[#1c1c20] hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: status + search + primary CTA + user */}
        <div className="flex items-center gap-3">
          <div className="relative hidden xl:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717a]" />
            <input
              type="text"
              placeholder="Search devices, audits, findings..."
              className="field !w-56 !rounded-md !py-1.5 !pl-9 !text-[12px] !bg-[#121215] border-white/15 focus:border-white"
            />
          </div>

          <div className="hidden items-center gap-2 rounded-md border border-white/15 bg-[#121215] px-2.5 py-1 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#a1a1aa]">
              Air-Gapped
            </span>
          </div>

          <button onClick={() => nav('upload')} className="btn btn-primary btn-sm hidden sm:inline-flex">
            <UploadCloud className="h-3.5 w-3.5" />
            New Audit
          </button>

          <div className="hidden items-center gap-2.5 border-l border-white/10 pl-3 md:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-white/20 bg-[#18181c] font-mono text-[11px] font-bold text-white">
              AT
            </div>
            <div className="hidden flex-col leading-tight xl:flex">
              <span className="text-[12px] font-medium text-white">Ayush Thakur</span>
              <span className="font-mono text-[9.5px] text-[#71717a]">Analyst / SOC</span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="btn btn-ghost btn-sm !rounded-md lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#09090b] px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {[...PRIMARY_LINKS, ...MODULE_LINKS].map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => nav(item.id)}
                  className={`flex items-center gap-3 rounded px-3 py-2 text-left text-xs font-medium transition-colors ${
                    active ? 'bg-white text-black font-bold' : 'text-[#a1a1aa] hover:bg-[#18181c] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.id === 'mappings' && pendingCount > 0 && (
                    <span className="ml-auto rounded px-1.5 py-0.5 font-mono text-[10px] font-bold bg-white text-black">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
            <button onClick={() => nav('upload')} className="btn btn-primary mt-2 w-full">
              <UploadCloud className="h-4 w-4" />
              New Audit
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

