import React from 'react';
import { Shield, LayoutDashboard, UploadCloud, Cpu, FileText, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  activeAuditId: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingCount,
  activeAuditId,
}) => {
  return (
    <header className="bg-dark-800 border-b border-dark-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="bg-blue-600/20 border border-blue-500/50 p-2 rounded-lg text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-white">NEXUS-AUDITOR</span>
                <span className="text-xs bg-blue-500/20 border border-blue-400/40 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  SIH26155 &bull; NTRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">AI-Driven Multi-Vendor Compliance & Threat Correlator</p>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('upload')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Audit Upload</span>
            </button>

            {activeAuditId && (
              <button
                onClick={() => setCurrentTab('audit-detail')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  currentTab === 'audit-detail'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Audit #{activeAuditId}</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('mappings')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition relative ${
                currentTab === 'mappings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>AI Approvals</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-2 py-0.2 text-xs bg-amber-500 text-slate-900 font-bold rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>

          <div className="hidden md:flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-mono tracking-tight">AIR-GAP SAFE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
