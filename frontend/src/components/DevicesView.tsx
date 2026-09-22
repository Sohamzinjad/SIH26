import React, { useState, useEffect } from 'react';
import { fetchDashboardOverview, fetchFleetSummary } from '../api/client';
import { DashboardOverview, FleetSummary } from '../types';
import { Reveal } from './Reveal';
import { HardDrive, Search, History, Eye } from 'lucide-react';

interface DevicesViewProps {
  onSelectAudit: (auditId: number) => void;
  onViewDeviceHistory: (deviceId: number) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({ onSelectAudit, onViewDeviceHistory }) => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovData, fleetData] = await Promise.all([
        fetchDashboardOverview().catch(() => null),
        fetchFleetSummary().catch(() => null),
      ]);
      if (ovData) setOverview(ovData);
      if (fleetData) setSummary(fleetData);
    } finally {
      setLoading(false);
    }
  };

  const recentAudits = overview?.recent_audits || [];

  const filteredAudits = recentAudits.filter((a) => {
    const matchesSearch =
      a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendor = vendorFilter === 'ALL' || a.vendor === vendorFilter;
    return matchesSearch && matchesVendor;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
        <p className="font-mono text-xs text-faint tracking-[0.18em] uppercase">Loading infrastructure devices…</p>
      </div>
    );
  }

  const scoreCls = (score: number) =>
    score >= 80 ? 'text-ok' : score >= 60 ? 'text-high' : 'text-crit';

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="kicker mb-3">Infrastructure inventory</div>
            <h1 className="font-display font-bold text-h1 tracking-tight text-ink">
              Network &amp; defense devices
              <span className="ml-4 align-middle badge badge-neutral">{recentAudits.length} registered</span>
            </h1>
            <p className="mt-3 max-w-2xl text-body text-muted">
              Registered infrastructure devices, vendor dialects, compliance scores, and drift history.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Controls */}
      <Reveal delayMs={40}>
        <div className="card p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hostname or vendor..."
                className="field pl-9"
              />
            </div>

            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="field !w-auto"
            >
              <option value="ALL">All Vendors</option>
              <option value="cisco_ios">Cisco IOS</option>
              <option value="fortios">FortiOS</option>
              <option value="juniper_junos">Juniper JunOS</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          {/* Devices Table */}
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Device Hostname</th>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Compliance Score</th>
                  <th>Passed / Total</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.map((a) => (
                  <tr key={a.id} className="row-hover">
                    <td className="font-semibold">{a.hostname}</td>
                    <td>
                      <span className="badge badge-neutral uppercase">{a.vendor}</span>
                    </td>
                    <td>
                      {a.status === 'COMPLETED' ? (
                        <span className="badge badge-pass">{a.status}</span>
                      ) : (
                        <span className="badge badge-pending">{a.status}</span>
                      )}
                    </td>
                    <td className={`font-bold ${scoreCls(a.score)}`}>{a.score.toFixed(1)}%</td>
                    <td className="text-muted">{a.pass_count} / {a.total_count}</td>
                    <td className="text-right space-x-3">
                      <button
                        onClick={() => onSelectAudit(a.id)}
                        className="text-[12px] font-semibold text-accent-hover hover:text-white inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>

                      {a.device_id && (
                        <button
                          onClick={() => onViewDeviceHistory(a.device_id!)}
                          className="text-[12px] font-semibold text-muted hover:text-white inline-flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          Drift &amp; History
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredAudits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      No devices match current search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </div>
  );
};