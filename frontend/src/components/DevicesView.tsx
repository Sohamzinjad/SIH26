import React, { useState, useEffect } from 'react';
import { fetchDashboardOverview, fetchFleetSummary } from '../api/client';
import { DashboardOverview, FleetSummary } from '../types';
import { HardDrive, Search, History, Eye, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';

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
      <div className="flex flex-col justify-center items-center h-96 space-y-3 font-mono">
        <div className="w-10 h-10 border-4 border-[#171717] border-t-transparent animate-spin"></div>
        <p className="text-xs text-[#5E5E5E] tracking-widest uppercase">LOADING INFRASTRUCTURE DEVICES...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Header */}
      <div className="border-b border-[#B9B9B4] pb-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
            INFRASTRUCTURE INVENTORY
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5 flex items-center space-x-3">
            <span>NETWORK & DEFENSE DEVICES</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#171717] text-white">
              {recentAudits.length} REGISTERED
            </span>
          </h1>
          <p className="text-xs text-[#5E5E5E] font-sans mt-1">
            Registered infrastructure devices, vendor dialects, compliance scores, and drift history.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-4 shadow-sm font-mono text-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5E5E5E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hostname or vendor..."
              className="w-full bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] pl-8 pr-3 py-1.5 focus:outline-none"
            />
          </div>

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="bg-[#EAEAE7] border border-[#B9B9B4] text-xs text-[#171717] px-3 py-1.5 focus:outline-none font-mono"
          >
            <option value="ALL">ALL VENDORS</option>
            <option value="cisco_ios">Cisco IOS</option>
            <option value="fortios">FortiOS</option>
            <option value="juniper_junos">Juniper JunOS</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {/* Devices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-[10px] text-[#5E5E5E] border-b border-[#B9B9B4] uppercase bg-[#EAEAE7]">
              <tr>
                <th className="py-2.5 px-3">Device Hostname</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Compliance Score</th>
                <th className="py-2.5 px-3">Passed / Total</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B9B4]/40">
              {filteredAudits.map((a) => (
                <tr key={a.id} className="hover:bg-[#EAEAE7] transition">
                  <td className="py-3 px-3 font-bold text-[#171717]">{a.hostname}</td>
                  <td className="py-3 px-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#171717] text-white uppercase">
                      {a.vendor}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold ${
                      a.status === 'COMPLETED' ? 'bg-[#00A86B]/20 text-[#00A86B]' : 'bg-[#D4A017]/20 text-[#D4A017]'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-bold text-sm ${
                      a.score >= 80 ? 'text-[#00A86B]' : a.score >= 60 ? 'text-[#D4A017]' : 'text-[#D64545]'
                    }`}>
                      {a.score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#5E5E5E]">
                    {a.pass_count} / {a.total_count}
                  </td>
                  <td className="py-3 px-3 text-right space-x-3">
                    <button
                      onClick={() => onSelectAudit(a.id)}
                      className="text-[11px] font-bold text-[#171717] hover:underline inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00A86B]" />
                      <span>INSPECT</span>
                    </button>

                    {a.device_id && (
                      <button
                        onClick={() => onViewDeviceHistory(a.device_id!)}
                        className="text-[11px] font-bold text-[#5E5E5E] hover:text-[#171717] hover:underline inline-flex items-center space-x-1"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>DRIFT & HISTORY</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredAudits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5E5E5E]">
                    No devices match current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
