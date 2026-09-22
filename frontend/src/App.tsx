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
    <div className="min-h-screen bg-bg text-ink font-sans flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={navigateToTab}
        pendingCount={pendingCount}
        activeAuditId={activeAuditId}
        activeDeviceId={activeDeviceId}
        onBack={handleBack}
        canGoBack={tabHistory.length > 1}
      />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 w-full mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-10 lg:py-14">
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
            <div className="relative card overflow-hidden p-10 text-center max-w-2xl mx-auto mt-8">
              {/* Decorative shapes allowed in empty states only */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                <div className="orb orb-violet orb-drift-a -top-16 -left-12 h-48 w-48 opacity-60" />
                <div className="orb orb-indigo orb-drift-b -bottom-20 -right-14 h-56 w-56 opacity-50" />
              </div>
              <div className="relative z-10 space-y-4">
                <Shield className="w-10 h-10 text-accent-hover mx-auto" />
                <h2 className="section-title uppercase tracking-wide">
                  TRINETRA {currentTab.toUpperCase()} Module
                </h2>
                <p className="text-body text-muted max-w-md mx-auto">
                  Deterministic compliance auditing active for CIS Cisco, FortiOS, NIST SP 800-53 and DISA STIG benchmarks.
                </p>
                <button onClick={() => setCurrentTab('dashboard')} className="btn btn-solid">
                  &larr; Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-white/10 bg-[#0c0c0e] py-6 px-6">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-3.5 h-3.5 text-[#4ade80]" />
              <span className="font-display font-bold text-sm tracking-[0.14em] text-ink uppercase">TRINETRA Defense Engine</span>
              <span className="text-faint">&bull;</span>
              <span className="font-mono text-[11px] text-faint">
                Air-Gapped High Assurance Compliance &amp; Threat Intelligence
              </span>
            </div>

            <div className="flex items-center space-x-6 font-mono text-[11px]">
              <div className="flex items-center space-x-1.5 text-[#4ade80] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#4ade80]"></span>
                <span>FOR A SAFER TOMORROW</span>
              </div>
              <span className="text-faint">v0.1.0-defense</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
