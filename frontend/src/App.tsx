import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { AuditDetailView } from './components/AuditDetailView';
import { MappingsView } from './components/MappingsView';
import { FleetView } from './components/FleetView';
import { DeviceHistoryView } from './components/DeviceHistoryView';
import { AttackPathGraph } from './components/AttackPathGraph';
import { AuditTrailView } from './components/AuditTrailView';
import { fetchDashboardOverview, fetchPendingMappings } from './api/client';
import { DashboardOverview } from './types';
import { Lock, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [tabHistory, setTabHistory] = useState<string[]>(['dashboard']);
  const [activeAuditId, setActiveAuditId] = useState<number | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);
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

  const navigateToTab = (newTab: string) => {
    setTabHistory((prev) => {
      if (prev[prev.length - 1] === newTab) return prev;
      return [...prev, newTab];
    });
    setCurrentTab(newTab);
  };

  const handleBack = () => {
    setTabHistory((prev) => {
      if (prev.length <= 1) {
        setCurrentTab('dashboard');
        return ['dashboard'];
      }
      const newHist = prev.slice(0, prev.length - 1);
      const last = newHist[newHist.length - 1];
      setCurrentTab(last);
      return newHist;
    });
  };

  const handleSelectAudit = (auditId: number) => {
    setActiveAuditId(auditId);
    navigateToTab('audit-detail');
  };

  const handleViewDeviceHistory = (deviceId: number) => {
    setActiveDeviceId(deviceId);
    navigateToTab('device-history');
  };

  const handleViewAttackPath = (auditId: number) => {
    setActiveAuditId(auditId);
    navigateToTab('attack-path');
  };

  const handleAuditCompleted = (auditId: number) => {
    setActiveAuditId(auditId);
    navigateToTab('audit-detail');
    loadData();
  };

  const handleAIMappingCreated = () => {
    navigateToTab('mappings');
    loadData();
  };

  const handleMappingApproved = (auditId: number) => {
    setActiveAuditId(auditId);
    navigateToTab('audit-detail');
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#D9D9D6] text-[#111111] font-sans flex flex-col selection:bg-[#171717] selection:text-white">
      {/* TRINETRA Command Header & Navigation Rail */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={navigateToTab}
        pendingCount={pendingCount}
        activeAuditId={activeAuditId}
        activeDeviceId={activeDeviceId}
        onBack={handleBack}
        canGoBack={tabHistory.length > 1}
      />

      {/* Main Operational Workspace (Offset by 240px sidebar on desktop) */}
      <div className="md:ml-60 flex-1 flex flex-col min-h-[calc(100vh-3.5rem)]">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              overview={overview}
              loading={loading}
              onSelectAudit={handleSelectAudit}
              onNewAudit={() => navigateToTab('upload')}
            />
          )}

          {currentTab === 'upload' && (
            <UploadView
              onAuditCompleted={handleAuditCompleted}
              onAIMappingCreated={handleAIMappingCreated}
            />
          )}

          {currentTab === 'audit-detail' && activeAuditId && (
            <AuditDetailView
              auditId={activeAuditId}
              onViewDeviceHistory={handleViewDeviceHistory}
              onViewAttackPath={handleViewAttackPath}
              onBack={handleBack}
              onNavigateTab={navigateToTab}
            />
          )}

          {currentTab === 'attack-path' && activeAuditId && (
            <AttackPathGraph
              auditId={activeAuditId}
              onBack={handleBack}
            />
          )}

          {currentTab === 'device-history' && activeDeviceId && (
            <DeviceHistoryView
              deviceId={activeDeviceId}
              onSelectAudit={handleSelectAudit}
              onBack={handleBack}
            />
          )}

          {currentTab === 'fleet' && (
            <FleetView onSelectAudit={handleSelectAudit} />
          )}

          {currentTab === 'mappings' && (
            <MappingsView onMappingApproved={handleMappingApproved} />
          )}

          {currentTab === 'audit-trail' && (
            <AuditTrailView />
          )}

          {(currentTab === 'devices' || currentTab === 'findings' || currentTab === 'reports' || currentTab === 'settings') && (
            <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-8 text-center space-y-4 shadow-sm my-8">
              <Shield className="w-12 h-12 text-[#171717] mx-auto" />
              <h2 className="text-xl font-bold font-mono tracking-wide text-[#171717] uppercase">
                TRINETRA {currentTab.toUpperCase()} MODULE ACTIVE
              </h2>
              <p className="text-xs font-mono text-[#5E5E5E] max-w-md mx-auto">
                Deterministic compliance auditing active for CIS Cisco, FortiOS, NIST SP 800-53 and DISA STIG benchmarks.
              </p>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="bg-[#171717] text-white font-mono text-xs font-bold px-4 py-2 trinetra-chamfer hover:bg-[#232323] transition"
              >
                &larr; RETURN TO DASHBOARD
              </button>
            </div>
          )}
        </main>

        {/* TRINETRA Footer */}
        <footer className="bg-[#171717] border-t border-[#232323] py-4 px-6 text-[#B9B9B4] font-mono text-xs mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-3.5 h-3.5 text-[#00A86B]" />
              <span className="font-bold text-white tracking-widest uppercase">TRINETRA DEFENSE ENGINE</span>
              <span className="text-[#5E5E5E]">&bull;</span>
              <span className="text-[#5E5E5E] text-[11px]">
                Air-Gapped High Assurance Compliance & Threat Intelligence
              </span>
            </div>

            <div className="flex items-center space-x-6 text-[11px]">
              <div className="flex items-center space-x-1.5 text-[#00A86B] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
                <span>FOR A SAFER TOMORROW</span>
              </div>
              <span className="text-[#5E5E5E]">v0.1.0-defense</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
