import React, { useState } from 'react';
import { DashboardOverview } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  HardDrive, 
  GitFork, 
  Workflow, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Globe, 
  MapPin, 
  List, 
  Maximize2, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  ExternalLink,
  Shield,
  Activity,
  ChevronRight,
  Info
} from 'lucide-react';
import { getReportUrl } from '../api/client';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  loading: boolean;
  onSelectAudit: (auditId: number) => void;
  onNewAudit: () => void;
}

const FALLBACK_OVERVIEW: DashboardOverview = {
  total_devices: 42,
  total_audits: 18,
  average_score: 78.4,
  critical_failures: 12,
  high_failures: 14,
  active_attack_chains: 8,
  pending_ai_proposals: 2,
  devices: [],
  recent_audits: []
};

// Node structure for Global Fleet View Map
interface FleetNode {
  id: string;
  name: string;
  region: string;
  cx: number;
  cy: number;
  status: 'compliant' | 'warning' | 'critical';
  devicesCount: number;
  compliancePct: number;
  criticalFindingsCount: number;
  attackPathsCount: number;
  topIssue: string;
  singleKeyFix: string;
}

const FLEET_NODES: FleetNode[] = [
  {
    id: 'node-india',
    name: 'Mumbai Hub',
    region: 'INDIA',
    cx: 480,
    cy: 220,
    status: 'critical',
    devicesCount: 12,
    compliancePct: 68.4,
    criticalFindingsCount: 5,
    attackPathsCount: 3,
    topIssue: 'Default SNMP Community & Telnet Enabled',
    singleKeyFix: 'no snmp-server community public'
  },
  {
    id: 'node-na',
    name: 'North America HQ',
    region: 'N. AMERICA',
    cx: 210,
    cy: 160,
    status: 'compliant',
    devicesCount: 15,
    compliancePct: 92.1,
    criticalFindingsCount: 0,
    attackPathsCount: 0,
    topIssue: 'Inactivity Timeout > 10 min',
    singleKeyFix: 'exec-timeout 10 0'
  },
  {
    id: 'node-europe',
    name: 'Europe Command',
    region: 'EUROPE',
    cx: 360,
    cy: 140,
    status: 'warning',
    devicesCount: 8,
    compliancePct: 76.5,
    criticalFindingsCount: 2,
    attackPathsCount: 2,
    topIssue: 'Missing VTY Access-Class',
    singleKeyFix: 'access-class 10 in'
  },
  {
    id: 'node-[#me]',
    name: 'Middle East Hub',
    region: 'MIDDLE EAST',
    cx: 410,
    cy: 200,
    status: 'warning',
    devicesCount: 4,
    compliancePct: 71.0,
    criticalFindingsCount: 3,
    attackPathsCount: 2,
    topIssue: 'No Remote Syslog Configured',
    singleKeyFix: 'logging host 10.0.0.50'
  },
  {
    id: 'node-apac',
    name: 'APAC Station',
    region: 'APAC',
    cx: 560,
    cy: 240,
    status: 'compliant',
    devicesCount: 3,
    compliancePct: 88.0,
    criticalFindingsCount: 0,
    attackPathsCount: 1,
    topIssue: 'HTTP Server Enabled',
    singleKeyFix: 'no ip http server'
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  loading,
  onSelectAudit,
  onNewAudit,
}) => {
  const [selectedNode, setSelectedNode] = useState<FleetNode | null>(FLEET_NODES[0]);
  const [mapMode, setMapMode] = useState<'MAP' | 'LIST'>('MAP');

  const data = overview || FALLBACK_OVERVIEW;
  const recentAudits = Array.isArray(data?.recent_audits) && data.recent_audits.length > 0 
    ? data.recent_audits 
    : [
        { id: 101, hostname: 'R1-DEL', vendor: 'Cisco IOS', score: 92.1, status: 'COMPLETED', fail_count: 3, created_at: '20 Sep 2026, 13:05' },
        { id: 102, hostname: 'FW-MUM-01', vendor: 'FortiOS', score: 68.4, status: 'COMPLETED', fail_count: 8, created_at: '20 Sep 2026, 12:47' },
        { id: 103, hostname: 'CORE-PAN-01', vendor: 'Cisco IOS', score: 45.9, status: 'COMPLETED', fail_count: 14, created_at: '20 Sep 2026, 11:22' },
        { id: 104, hostname: 'LAB-SW-03', vendor: 'White-Box', score: 62.1, status: 'COMPLETED', fail_count: 7, created_at: '20 Sep 2026, 09:31' },
        { id: 105, hostname: 'BRANCH-01', vendor: 'FortiOS', score: 71.9, status: 'COMPLETED', fail_count: 6, created_at: '19 Sep 2026, 22:18' }
      ];

  const topFailingControls = [
    { control: 'Telnet enabled on VTY', framework: 'CIS / DISA', devices: 8, severity: 'CRITICAL' },
    { control: 'Default SNMP community', framework: 'CIS', devices: 6, severity: 'CRITICAL' },
    { control: 'Missing VTY access-class', framework: 'NIST AC-17', devices: 5, severity: 'HIGH' },
    { control: 'No remote syslog', framework: 'NIST AU-2', devices: 4, severity: 'HIGH' },
    { control: 'HTTP management enabled', framework: 'CIS', devices: 4, severity: 'MEDIUM' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Overview Title Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#B9B9B4] pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#5E5E5E] uppercase font-bold">
            OVERVIEW
          </div>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight uppercase font-display mt-0.5">
            Network Security Compliance
          </h1>
          <p className="text-xs text-[#5E5E5E] font-sans mt-1">
            Unified visibility across devices, compliance frameworks and emerging threats.
          </p>
        </div>

        {/* Palantir Style Header Action Panel */}
        <div className="flex items-center space-x-4 bg-[#EAEAE7] border border-[#B9B9B4] p-3 trinetra-chamfer">
          <div className="text-left font-mono">
            <div className="text-[10px] tracking-widest text-[#5E5E5E] uppercase font-bold flex space-x-2">
              <span>MONITOR</span>
              <span>&bull;</span>
              <span>ANALYZE</span>
              <span>&bull;</span>
              <span>CORRELATE</span>
              <span>&bull;</span>
              <span>PROTECT</span>
            </div>
            <div className="text-xs font-bold text-[#171717] mt-0.5">
              Sat, 20 Sep 2026 | 01:26 PM
            </div>
          </div>

          <button
            onClick={onNewAudit}
            className="bg-[#171717] hover:bg-[#232323] text-white text-xs font-mono font-bold px-4 py-2 trinetra-chamfer transition shadow-sm"
          >
            + AUDIT DEVICE
          </button>
        </div>
      </div>

      {/* 5 Angled KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Fleet Compliance */}
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] p-4 trinetra-chamfer relative group shadow-sm">
          <div className="tactical-corner-tl"></div>
          <div className="tactical-corner-br"></div>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-mono tracking-wider font-bold text-[#5E5E5E] uppercase">
              Fleet Compliance
            </span>
            <ShieldCheck className="w-4 h-4 text-[#00A86B]" />
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#171717] font-mono tracking-tight">
                78.4%
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00A86B] flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +5.2%
              </span>
            </div>
            {/* Sparkline Canvas / SVG */}
            <div className="h-6 w-full mt-2">
              <svg className="w-full h-full" viewBox="0 0 100 24">
                <path d="M0,18 L20,16 L40,19 L60,10 L80,12 L100,5" fill="none" stroke="#00A86B" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-[10px] font-mono text-[#5E5E5E] mt-1">Across 42 devices</p>
          </div>
        </div>

        {/* KPI 2: Total Devices */}
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] p-4 trinetra-chamfer relative shadow-sm">
          <div className="tactical-corner-tl"></div>
          <div className="tactical-corner-br"></div>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-mono tracking-wider font-bold text-[#5E5E5E] uppercase">
              Total Devices
            </span>
            <HardDrive className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#171717] font-mono tracking-tight">
                42
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00A86B] flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +3
              </span>
            </div>
            <div className="h-6 w-full mt-2">
              <svg className="w-full h-full" viewBox="0 0 100 24">
                <rect x="5" y="10" width="8" height="14" fill="#232323" />
                <rect x="20" y="8" width="8" height="16" fill="#232323" />
                <rect x="35" y="12" width="8" height="12" fill="#232323" />
                <rect x="50" y="6" width="8" height="18" fill="#232323" />
                <rect x="65" y="4" width="8" height="20" fill="#232323" />
                <rect x="80" y="2" width="8" height="22" fill="#232323" />
              </svg>
            </div>
            <p className="text-[10px] font-mono text-[#5E5E5E] mt-1">5 vendors</p>
          </div>
        </div>

        {/* KPI 3: Critical Findings */}
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] p-4 trinetra-chamfer relative shadow-sm">
          <div className="tactical-corner-tl"></div>
          <div className="tactical-corner-br"></div>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-mono tracking-wider font-bold text-[#5E5E5E] uppercase">
              Critical Findings
            </span>
            <AlertTriangle className="w-4 h-4 text-[#D64545]" />
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#D64545] font-mono tracking-tight">
                12
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00A86B] flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> -6
              </span>
            </div>
            <div className="h-6 w-full mt-2">
              <svg className="w-full h-full" viewBox="0 0 100 24">
                <path d="M0,5 L25,10 L50,15 L75,20 L100,22" fill="none" stroke="#D64545" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>
            <p className="text-[10px] font-mono text-[#5E5E5E] mt-1">Require immediate action</p>
          </div>
        </div>

        {/* KPI 4: Active Attack Paths */}
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] p-4 trinetra-chamfer relative shadow-sm">
          <div className="tactical-corner-tl"></div>
          <div className="tactical-corner-br"></div>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-mono tracking-wider font-bold text-[#5E5E5E] uppercase">
              Active Attack Paths
            </span>
            <GitFork className="w-4 h-4 text-[#D4A017]" />
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#171717] font-mono tracking-tight">
                8
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00A86B] flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> -4
              </span>
            </div>
            <div className="h-6 w-full mt-2">
              <svg className="w-full h-full" viewBox="0 0 100 24">
                <path d="M0,12 L30,12 L50,4 L70,20 L100,12" fill="none" stroke="#D4A017" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-[10px] font-mono text-[#5E5E5E] mt-1">Chained exploit scenarios</p>
          </div>
        </div>

        {/* KPI 5: Pending Mappings */}
        <div className="bg-[#F1F1EF] border border-[#B9B9B4] p-4 trinetra-chamfer relative shadow-sm">
          <div className="tactical-corner-tl"></div>
          <div className="tactical-corner-br"></div>
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-mono tracking-wider font-bold text-[#5E5E5E] uppercase">
              Pending Mappings
            </span>
            <Workflow className="w-4 h-4 text-[#0057B8]" />
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-[#171717] font-mono tracking-tight">
                2
              </span>
              <span className="text-[10px] font-mono text-[#5E5E5E] flex items-center">
                <Minus className="w-3 h-3 mr-0.5" /> &mdash;
              </span>
            </div>
            <div className="h-6 w-full mt-2">
              <svg className="w-full h-full" viewBox="0 0 100 24">
                <line x1="0" y1="12" x2="100" y2="12" stroke="#0057B8" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
            <p className="text-[10px] font-mono text-[#5E5E5E] mt-1">Human review required</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Global Fleet View (Hero Map) + Sidebar Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Global Fleet View Hero Map */}
        <div className="lg:col-span-7 bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer-lg p-5 space-y-4 shadow-sm relative">
          <div className="tactical-corner-tl"></div>
          <div className="tactical-corner-tr"></div>
          <div className="tactical-corner-bl"></div>
          <div className="tactical-corner-br"></div>

          {/* Map Controls & Header */}
          <div className="flex items-center justify-between border-b border-[#B9B9B4] pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#171717]" />
              <span className="font-mono text-xs font-bold text-[#171717] uppercase tracking-wider">
                GLOBAL FLEET VIEW
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex bg-[#EAEAE7] border border-[#B9B9B4] p-0.5">
                <button
                  onClick={() => setMapMode('MAP')}
                  className={`px-3 py-1 font-mono text-[10px] font-bold ${
                    mapMode === 'MAP' ? 'bg-[#171717] text-white' : 'text-[#5E5E5E]'
                  }`}
                >
                  MAP
                </button>
                <button
                  onClick={() => setMapMode('LIST')}
                  className={`px-3 py-1 font-mono text-[10px] font-bold ${
                    mapMode === 'LIST' ? 'bg-[#171717] text-white' : 'text-[#5E5E5E]'
                  }`}
                >
                  LIST
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Tactical SVG Map View */}
          {mapMode === 'MAP' ? (
            <div className="relative h-80 w-full bg-[#171717] border border-[#232323] trinetra-dark-grid-bg overflow-hidden flex items-center justify-center p-2">
              <svg viewBox="0 0 800 400" className="w-full h-full opacity-90">
                {/* World Map Outline SVG paths */}
                <path
                  d="M150,120 Q180,100 230,110 T260,160 T200,220 T140,160 Z M320,110 Q380,90 420,130 T390,200 T330,170 Z M460,180 Q500,160 550,200 T580,270 T500,280 Z M600,240 Q660,220 720,260 T700,320 T620,300 Z"
                  fill="#232323"
                  stroke="#3A3A3A"
                  strokeWidth="1.5"
                />

                {/* Animated Attack Path Arc Connections */}
                <path
                  d="M 210 160 Q 300 120 480 220"
                  fill="none"
                  stroke="#D64545"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <path
                  d="M 360 140 Q 420 160 480 220"
                  fill="none"
                  stroke="#D4A017"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 480 220 Q 520 230 560 240"
                  fill="none"
                  stroke="#00A86B"
                  strokeWidth="1.5"
                />

                {/* Regional Radar Nodes */}
                {FLEET_NODES.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const color = node.status === 'compliant' ? '#00A86B' : node.status === 'warning' ? '#D4A017' : '#D64545';
                  return (
                    <g 
                      key={node.id} 
                      className="cursor-pointer group"
                      onClick={() => setSelectedNode(node)}
                    >
                      {/* Pulse Ring */}
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={isSelected ? 16 : 10}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        opacity={isSelected ? 0.9 : 0.5}
                        className={node.status === 'critical' ? 'animate-ping' : ''}
                      />
                      {/* Solid Node Core */}
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={isSelected ? 6 : 4}
                        fill={color}
                      />
                      {/* Label Badge */}
                      <rect
                        x={node.cx - 30}
                        y={node.cy + 10}
                        width="60"
                        height="14"
                        fill="#171717"
                        stroke={isSelected ? color : '#3A3A3A'}
                        strokeWidth="1"
                      />
                      <text
                        x={node.cx}
                        y={node.cy + 20}
                        textAnchor="middle"
                        fill="#F1F1EF"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {node.region}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Stats Overlay Box */}
              <div className="absolute bottom-3 left-3 bg-[#171717]/90 border border-[#232323] p-2.5 font-mono text-[10px] text-[#B9B9B4] space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#00A86B]"></span>
                  <span>Compliant: 28</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4A017]"></span>
                  <span>Warnings: 9</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#D64545]"></span>
                  <span>Critical: 5</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-80 overflow-y-auto bg-[#171717] border border-[#232323] p-3 space-y-2">
              {FLEET_NODES.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 border cursor-pointer font-mono text-xs flex justify-between items-center ${
                    selectedNode?.id === node.id 
                      ? 'bg-[#232323] border-[#B9B9B4] text-white' 
                      : 'border-[#3A3A3A] text-[#B9B9B4] hover:bg-[#232323]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white">{node.name} ({node.region})</div>
                    <div className="text-[10px] text-[#5E5E5E]">{node.devicesCount} devices &bull; {node.topIssue}</div>
                  </div>
                  <div className={`font-bold ${
                    node.status === 'compliant' ? 'text-[#00A86B]' : node.status === 'warning' ? 'text-[#D4A017]' : 'text-[#D64545]'
                  }`}>
                    {node.compliancePct}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Node Intelligence Drawer / Panel */}
          {selectedNode && (
            <div className="bg-[#EAEAE7] border border-[#B9B9B4] p-4 trinetra-chamfer space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-[#B9B9B4] pb-2">
                <div className="flex items-center space-x-2 font-bold text-[#171717]">
                  <MapPin className="w-4 h-4 text-[#D64545]" />
                  <span>INTELLIGENCE: {selectedNode.name.toUpperCase()} ({selectedNode.region})</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold ${
                  selectedNode.status === 'compliant' ? 'bg-[#00A86B] text-white' : selectedNode.status === 'warning' ? 'bg-[#D4A017] text-white' : 'bg-[#D64545] text-white'
                }`}>
                  {selectedNode.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-[#5E5E5E]">Devices:</span> <span className="font-bold text-[#171717]">{selectedNode.devicesCount}</span>
                </div>
                <div>
                  <span className="text-[#5E5E5E]">Compliance:</span> <span className="font-bold text-[#171717]">{selectedNode.compliancePct}%</span>
                </div>
                <div>
                  <span className="text-[#5E5E5E]">Critical Gaps:</span> <span className="font-bold text-[#D64545]">{selectedNode.criticalFindingsCount}</span>
                </div>
                <div>
                  <span className="text-[#5E5E5E]">Attack Paths:</span> <span className="font-bold text-[#D4A017]">{selectedNode.attackPathsCount}</span>
                </div>
              </div>

              <div className="bg-[#171717] text-[#F1F1EF] p-2.5 border border-[#232323] space-y-1">
                <div className="text-[10px] text-[#00A86B] font-bold uppercase tracking-wider">SINGLE KEY FIX (HIGHEST LEVERAGE REMEDIATION):</div>
                <code className="text-xs text-[#00A86B] block font-mono">{selectedNode.singleKeyFix}</code>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Compliance Trend + System Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Compliance Trend Chart Panel */}
          <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-[#B9B9B4] pb-2">
              <span className="font-mono text-xs font-bold text-[#171717] uppercase tracking-wider">
                COMPLIANCE TREND
              </span>
              <span className="text-[10px] font-mono text-[#5E5E5E]">Last 30 days</span>
            </div>

            {/* Line Chart Graphic */}
            <div className="h-44 w-full bg-[#EAEAE7] border border-[#B9B9B4] p-3 relative flex flex-col justify-between">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                {/* Horizontal Gridlines */}
                <line x1="0" y1="30" x2="300" y2="30" stroke="#B9B9B4" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#B9B9B4" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#B9B9B4" strokeWidth="0.5" strokeDasharray="2 2" />

                {/* Trend Area Gradient & Line */}
                <path d="M0,100 L50,90 L100,75 L150,65 L200,45 L250,35 L300,20 L300,120 L0,120 Z" fill="rgba(23,23,23,0.08)" />
                <path d="M0,100 L50,90 L100,75 L150,65 L200,45 L250,35 L300,20" fill="none" stroke="#171717" strokeWidth="2.5" />
                <circle cx="300" cy="20" r="4" fill="#171717" />
              </svg>
              <div className="absolute top-2 right-4 bg-[#171717] text-white font-mono text-[10px] font-bold px-2 py-0.5">
                78.4% (Sep 20)
              </div>
            </div>
          </div>

          {/* Top Failing Controls Table */}
          <div className="bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-[#B9B9B4] pb-2">
              <span className="font-mono text-xs font-bold text-[#D64545] uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#D64545]" /> TOP FAILING CONTROLS
              </span>
              <span className="text-[10px] font-mono text-[#5E5E5E]">View all &rarr;</span>
            </div>

            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-[#5E5E5E] border-b border-[#B9B9B4] uppercase">
                <tr>
                  <th className="py-1">Control</th>
                  <th className="py-1">Framework</th>
                  <th className="py-1 text-center">Devices</th>
                  <th className="py-1 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9B9B4]/40">
                {topFailingControls.map((c, i) => (
                  <tr key={i} className="hover:bg-[#EAEAE7]">
                    <td className="py-2 text-[#171717] font-medium">{c.control}</td>
                    <td className="py-2 text-[#5E5E5E] text-[11px]">{c.framework}</td>
                    <td className="py-2 text-center text-[#171717] font-bold">{c.devices}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 text-[9px] font-bold ${
                        c.severity === 'CRITICAL' ? 'bg-[#D64545] text-white' : c.severity === 'HIGH' ? 'bg-[#D4A017] text-white' : 'bg-[#0057B8] text-white'
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Audit Runs & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Recent Audit Runs Table */}
        <div className="lg:col-span-8 bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center border-b border-[#B9B9B4] pb-2">
            <span className="font-mono text-xs font-bold text-[#171717] uppercase tracking-wider">
              RECENT AUDIT RUNS
            </span>
            <span className="text-[10px] font-mono text-[#5E5E5E]">View all &rarr;</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-[#5E5E5E] border-b border-[#B9B9B4] uppercase">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Device</th>
                  <th className="py-2 px-3">Vendor</th>
                  <th className="py-2 px-3">Score</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Findings</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9B9B4]/40">
                {recentAudits.map((a: any) => (
                  <tr key={a.id} className="hover:bg-[#EAEAE7]">
                    <td className="py-2.5 px-3 text-[#5E5E5E] text-[11px]">{a.created_at || '20 Sep 2026, 13:05'}</td>
                    <td className="py-2.5 px-3 font-bold text-[#171717]">{a.hostname}</td>
                    <td className="py-2.5 px-3 text-[#5E5E5E] text-[11px]">{a.vendor}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${
                        a.score >= 80 ? 'text-[#00A86B]' : a.score >= 60 ? 'text-[#D4A017]' : 'text-[#D64545]'
                      }`}>
                        {a.score}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center text-[10px] font-bold text-[#00A86B]">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-[#00A86B]" /> Completed
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#171717]">{a.fail_count || 3}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectAudit(a.id)}
                        className="text-[11px] font-bold text-[#171717] hover:underline"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Columns: System Status Panel */}
        <div className="lg:col-span-4 bg-[#F1F1EF] border border-[#B9B9B4] trinetra-chamfer p-4 space-y-4 shadow-sm">
          <div className="border-b border-[#B9B9B4] pb-2">
            <span className="font-mono text-xs font-bold text-[#171717] uppercase tracking-wider">
              SYSTEM STATUS
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#EAEAE7] border border-[#B9B9B4]">
              <span className="text-[#5E5E5E]">API Server</span>
              <span className="font-bold text-[#00A86B] flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#00A86B] mr-1.5"></span> Online
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#EAEAE7] border border-[#B9B9B4]">
              <span className="text-[#5E5E5E]">Database</span>
              <span className="font-bold text-[#00A86B] flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#00A86B] mr-1.5"></span> Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#EAEAE7] border border-[#B9B9B4]">
              <span className="text-[#5E5E5E]">Ollama (Local AI)</span>
              <span className="font-bold text-[#00A86B] flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#00A86B] mr-1.5"></span> Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#EAEAE7] border border-[#B9B9B4]">
              <span className="text-[#5E5E5E]">Dialect Cache</span>
              <span className="font-bold text-[#171717]">24 entries</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#171717] text-[#B9B9B4] font-mono text-[10px] space-y-1">
            <div className="flex items-center text-[#00A86B] font-bold">
              <Info className="w-3.5 h-3.5 mr-1" /> AIR-GAPPED ENVIRONMENT
            </div>
            <p className="text-[#5E5E5E] leading-relaxed">
              Operating in air-gapped mode. No external API calls. All data stays within the secure environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
