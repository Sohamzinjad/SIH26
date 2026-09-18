import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { AuditDetailView } from './components/AuditDetailView';
import { MappingsView } from './components/MappingsView';
import { FleetView } from './components/FleetView';
import { fetchDashboardOverview, fetchPendingMappings } from './api/client';
import { DashboardOverview } from './types';
import { ShieldCheck, ExternalLink, Activity, Terminal, Lock } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeAuditId, setActiveAuditId] = useState<number | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, mapData] = await Promise.all([
        fetchDashboardOverview().catch(() => null),
        fetchPendingMappings().catch(() => []),
      ]);
      if (ovData) setOverview(ovData);
      setPendingCount(mapData.length);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAudit = (auditId: number) => {
    setActiveAuditId(auditId);
    setCurrentTab('audit-detail');
  };

  const handleAuditCompleted = (auditId: number) => {
    setActiveAuditId(auditId);
    setCurrentTab('audit-detail');
    loadData();
  };

  const handleAIMappingCreated = () => {
    setCurrentTab('mappings');
    loadData();
  };

  const handleMappingApproved = (auditId: number) => {
    setActiveAuditId(auditId);
    setCurrentTab('audit-detail');
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-[#F4F6FB] font-sans flex flex-col selection:bg-emerald-500/30 selection:text-white">
      {/* Pinecone Console Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingCount={pendingCount}
        activeAuditId={activeAuditId}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            overview={overview}
            loading={loading}
            onSelectAudit={handleSelectAudit}
            onNewAudit={() => setCurrentTab('upload')}
          />
        )}

        {currentTab === 'upload' && (
          <UploadView
            onAuditCompleted={handleAuditCompleted}
            onAIMappingCreated={handleAIMappingCreated}
          />
        )}

        {currentTab === 'audit-detail' && activeAuditId && (
          <AuditDetailView auditId={activeAuditId} />
        )}

        {currentTab === 'fleet' && (
          <FleetView />
        )}
{currentTab === 'mappings' && (
          <MappingsView onMappingApproved={handleMappingApproved} />
        )}
      </main>

      {/* Pinecone Console Footer */}
      <footer className="bg-[#0F1115] border-t border-[#22262F] py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#9AA2B0] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>PINE AUDIT ENGINE</span>
            </div>
            <span className="text-slate-600">&bull;</span>
            <span className="text-[11px] text-slate-400">
              Air-Gapped Deterministic CIS / NIST SP 800-53 Assurance
            </span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>All Systems Operational</span>
            </div>
            <span className="font-mono text-slate-500">v2.4.0-deterministic</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
