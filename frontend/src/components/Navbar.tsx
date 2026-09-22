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
    `px-3 py-2 rounded-full text-[13px] font-medium transition-colors duration-150 ${
      active ? 'bg-accent-soft text-white' : 'text-muted hover:text-ink hover:bg-surface-3'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0b]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        {/* Left: back + brand */}
        <div className="flex min-w-0 items-center gap-3">
          {canGoBack && onBack && (
            <button
              onClick={onBack}
              className="btn btn-ghost btn-sm !px-3"
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
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-surface-2 transition-colors group-hover:border-accent/60">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                <polygon points="12 2 22 20 2 20" />
                <circle cx="12" cy="13" r="3" fill="#D92D20" stroke="none" />
              </svg>
            </span>
            <span className="hidden flex-col items-start leading-none sm:flex">
              <span className="font-display text-[17px] font-bold tracking-[0.12em] text-ink">
                TRINETRA
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint mt-1">
                Defense Intelligence
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
                  <Icon className={`h-4 w-4 ${active ? 'text-accent-hover' : ''}`} />
                  {item.label}
                  {item.id === 'mappings' && pendingCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-crit px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white">
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
              <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-surface-2 p-1.5 shadow-lift">
                {MODULE_LINKS.map((m) => {
                  const Icon = m.icon;
                  const active = currentTab === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => nav(m.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${
                        active ? 'bg-accent-soft text-white' : 'text-muted hover:bg-surface-3 hover:text-ink'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-accent-hover' : ''}`} />
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
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder="Search devices, audits, findings..."
              className="field !w-64 !rounded-full !py-2 !pl-9 !text-[12px]"
            />
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-surface-2 px-3 py-1.5 md:flex">
            <span className="h-2 w-2 rounded-full bg-[#067647] ring-2 ring-[#067647]/30" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              Air-gapped
            </span>
          </div>

          <button onClick={() => nav('upload')} className="btn btn-primary btn-sm hidden sm:inline-flex">
            <UploadCloud className="h-4 w-4" />
            New Audit
          </button>

          <div className="hidden items-center gap-2.5 border-l border-white/10 pl-3 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-surface-3 font-mono text-[11px] font-bold text-ink">
              AT
            </div>
            <div className="hidden flex-col leading-tight xl:flex">
              <span className="text-[12px] font-semibold text-ink">Ayush Thakur</span>
              <span className="font-mono text-[10px] text-faint">Analyst / SOC</span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="btn btn-ghost btn-sm !rounded-full lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0a0a0b]/95 px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {[...PRIMARY_LINKS, ...MODULE_LINKS].map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => nav(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active ? 'bg-accent-soft text-white' : 'text-muted hover:bg-surface-3 hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-accent-hover' : ''}`} />
                  {item.label}
                  {item.id === 'mappings' && pendingCount > 0 && (
                    <span className="ml-auto rounded-full bg-crit px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
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
