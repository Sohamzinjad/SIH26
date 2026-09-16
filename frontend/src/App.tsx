import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { AuditDetailView } from './components/AuditDetailView';
import { MappingsView } from './components/MappingsView';
import { fetchDashboardOverview, fetchPendingMappings } from './api/client';
import { DashboardOverview } from './types';

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
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingCount={pendingCount}
        activeAuditId={activeAuditId}
      />

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

        {currentTab === 'mappings' && (
          <MappingsView onMappingApproved={handleMappingApproved} />
        )}
      </main>

      <footer className="bg-dark-800 border-t border-dark-600 py-4 text-center text-xs text-slate-500">
        <p>
          SIH26155 Multi-Vendor Network Security Compliance Auditor &bull; Air-Gapped High Assurance Compliance Architecture
        </p>
      </footer>
    </div>
  );
};

export default App;
