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
import { LandingView } from './components/LandingView';
import { DevicesView } from './components/DevicesView';
import { FindingsView } from './components/FindingsView';
import { fetchDashboardOverview, fetchPendingMappings } from './api/client';
import { DashboardOverview } from './types';
import { Lock, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [tabHistory, setTabHistory] = useState<string[]>(['landing']);
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
          <div key={`${currentTab}-${activeAuditId || ''}-${activeDeviceId || ''}`} className="view-transition">
            {currentTab === 'landing' && (
              <LandingView
                onEnterDashboard={() => navigateToTab('dashboard')}
                onNewAudit={() => navigateToTab('upload')}
                onExploreFleet={() => navigateToTab('fleet')}
                onOpenMappings={() => navigateToTab('mappings')}
                onOpenAuditTrail={() => navigateToTab('audit-trail')}
              />
            )}

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

            {currentTab === 'devices' && (
              <DevicesView
                onSelectAudit={handleSelectAudit}
                onViewDeviceHistory={handleViewDeviceHistory}
              />
            )}

            {currentTab === 'findings' && (
              <FindingsView
                onSelectAudit={handleSelectAudit}
              />
            )}

            {(currentTab === 'reports' || currentTab === 'settings') && (
              <div className="card p-10 text-center max-w-xl mx-auto mt-12 border border-white/15 bg-[#121215]">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/20 bg-black mx-auto">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-white uppercase">
                    TRINETRA {currentTab.toUpperCase()} Module
                  </h2>
                  <p className="text-xs text-[#a1a1aa] max-w-md mx-auto leading-relaxed">
                    Deterministic compliance auditing active for CIS Cisco, FortiOS, NIST SP 800-53 and DISA STIG benchmarks.
                  </p>
                  <button onClick={() => setCurrentTab('dashboard')} className="btn btn-primary btn-sm">
                    &larr; Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="border-t border-white/10 bg-[#09090b] py-5 px-6">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-3.5 h-3.5 text-white" />
              <span className="font-sans font-bold text-xs tracking-[0.14em] text-white uppercase">TRINETRA Defense Engine</span>
              <span className="text-[#71717a]">&bull;</span>
              <span className="font-mono text-[11px] text-[#71717a]">
                Air-Gapped High Assurance Compliance &amp; Threat Intelligence
              </span>
            </div>

            <div className="flex items-center space-x-6 font-mono text-[11px]">
              <div className="flex items-center space-x-2 text-white font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span className="tracking-wider">SECURE ASSURANCE ACTIVE</span>
              </div>
              <span className="text-[#71717a]">v0.1.0-defense</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
