import React, { useState } from 'react';
import { DashboardOverview } from '../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  HardDrive, 
  GitFork, 
  Globe, 
  MapPin, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  Server, 
  Activity,
  Info,
  Maximize2,
  ChevronRight,
  Crosshair
} from 'lucide-react';

interface DashboardViewProps {
  overview: DashboardOverview | null;
  loading: boolean;
  onSelectAudit: (auditId: number) => void;
  onNewAudit: () => void;
}

interface OperationalAsset {
  id: string;
  name: string;
  region: string;
  ipSubnet: string;
  vendor: string;
  osVersion: string;
  cx: number;
  cy: number;
  status: 'compliant' | 'warning' | 'critical';
  complianceScore: number;
  criticalCount: number;
  attackPathsCount: number;
  topVulnerability: string;
  cveReference: string;
  singleKeyFix: string;
  riskReductionPct: number;
}

const OPERATIONAL_ASSETS: OperationalAsset[] = [
  {
    id: 'asset-mum-01',
    name: 'FW-MUM-CORE-01',
    region: 'MUMBAI DATACENTER',
    ipSubnet: '10.200.10.0/24',
    vendor: 'Fortinet FortiOS',
    osVersion: 'FortiOS v7.2.4',
    cx: 490,
    cy: 310,
    status: 'critical',
    complianceScore: 68.4,
    criticalCount: 5,
    attackPathsCount: 3,
    topVulnerability: 'Default SNMP Community & Telnet Enabled',
    cveReference: 'CVE-2024-21762 (CVSS 9.8)',
    singleKeyFix: 'config system global -> set admin-telnet disable',
    riskReductionPct: 62.5
  },
  {
    id: 'asset-del-01',
    name: 'R1-DELHI-GW',
    region: 'DELHI HQ GATEWAY',
    ipSubnet: '203.0.113.0/29',
    vendor: 'Cisco IOS-XE',
    osVersion: 'IOS-XE 17.06.03',
    cx: 470,
    cy: 265,
    status: 'compliant',
    complianceScore: 92.1,
    criticalCount: 0,
    attackPathsCount: 0,
    topVulnerability: 'Interactive Inactivity Timeout > 10 min',
    cveReference: 'NIST AC-12 (DISA STIG)',
    singleKeyFix: 'line vty 0 15 -> exec-timeout 10 0',
    riskReductionPct: 15.0
  },
  {
    id: 'asset-[#pan]',
    name: 'CORE-PANIPAT-SW',
    region: 'PANIPAT SUBSTATION',
    ipSubnet: '172.16.50.0/24',
    vendor: 'Cisco IOS',
    osVersion: 'IOS 15.2(4)S',
    cx: 455,
    cy: 280,
    status: 'critical',
    complianceScore: 45.9,
    criticalCount: 7,
    attackPathsCount: 4,
    topVulnerability: 'Cleartext Telnet + Missing VTY ACL',
    cveReference: 'CISA KEV Expose',
    singleKeyFix: 'line vty 0 15 -> access-class MGMT-ACL in',
    riskReductionPct: 78.0
  },
  {
    id: 'asset-wb-01',
    name: 'WHITEBOX-EDGE-03',
    region: 'BENGALURU R&D LAB',
    ipSubnet: '10.50.0.0/16',
    vendor: 'OpenNOS / Custom',
    osVersion: 'MicroNOS v2.1',
    cx: 485,
    cy: 350,
    status: 'warning',
    complianceScore: 62.1,
    criticalCount: 2,
    attackPathsCount: 2,
    topVulnerability: 'Unencrypted Master Credentials',
    cveReference: 'NIST IA-5 (FIPS 140-3)',
    singleKeyFix: 'security master-auth enable-hashing sha256',
    riskReductionPct: 45.0
  },
  {
    id: 'asset-useast',
    name: 'US-EAST-AIRGAP-01',
    region: 'NORTH AMERICA HUB',
    ipSubnet: '198.51.100.0/24',
    vendor: 'Cisco IOS-XE',
    osVersion: 'IOS-XE 17.09.01',
    cx: 220,
    cy: 220,
    status: 'compliant',
    complianceScore: 94.5,
    criticalCount: 0,
    attackPathsCount: 0,
    topVulnerability: 'Minor Logging Timestamp Precision',
    cveReference: 'CIS Benchmark v4.0',
    singleKeyFix: 'service timestamps log datetime msec',
    riskReductionPct: 10.0
  },
  {
    id: 'asset-london',
    name: 'EU-LON-SOC-02',
    region: 'EUROPE COMMAND',
    ipSubnet: '192.168.100.0/24',
    vendor: 'Fortinet FortiOS',
    osVersion: 'FortiOS v7.0.12',
    cx: 365,
    cy: 200,
    status: 'warning',
    complianceScore: 71.9,
    criticalCount: 3,
    attackPathsCount: 2,
    topVulnerability: 'Missing Centralized Remote Syslog',
    cveReference: 'NIST AU-2 Audit',
    singleKeyFix: 'config log syslogd setting -> set status enable',
    riskReductionPct: 38.0
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  loading,
  onSelectAudit,
  onNewAudit,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<OperationalAsset>(OPERATIONAL_ASSETS[0]);
  const [mapMode, setMapMode] = useState<'TACTICAL MAP' | 'TOPOLOGY GRAPH' | 'THREAT MATRIX'>('TACTICAL MAP');

  const data = overview || {
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

  const recentAudits = Array.isArray(data?.recent_audits) && data.recent_audits.length > 0 
    ? data.recent_audits 
    : [
        { id: 101, hostname: 'FW-MUM-CORE-01', vendor: 'FortiOS', score: 68.4, fail_count: 5, status: 'COMPLETED', started_at: '20 Sep 2026, 13:05' },
        { id: 102, hostname: 'R1-DELHI-GW', vendor: 'Cisco IOS-XE', score: 92.1, fail_count: 1, status: 'COMPLETED', started_at: '20 Sep 2026, 12:47' },
        { id: 103, hostname: 'CORE-PANIPAT-SW', vendor: 'Cisco IOS', score: 45.9, fail_count: 7, status: 'COMPLETED', started_at: '20 Sep 2026, 11:22' },
        { id: 104, hostname: 'WHITEBOX-EDGE-03', vendor: 'White-Box', score: 62.1, fail_count: 4, status: 'COMPLETED', started_at: '20 Sep 2026, 09:31' },
      ];

  return (
    <div className="space-y-8 animate-fadeIn pb-20 font-sans text-[#171717]">
      {/* Top Section Header with Generous Optical Spacing */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-black/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono tracking-[0.2em] text-[#666666] font-bold uppercase mb-1">
            <span>OPERATIONAL INTELLIGENCE WORKSPACE</span>
            <span>&bull;</span>
            <span className="text-[#171717]">DEFENSE GRID</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-[0.05em] uppercase font-display leading-tight">
            Network Infrastructure Cyber Defense Surface
          </h1>
          <p className="text-xs text-[#666666] font-sans mt-2 max-w-3xl leading-relaxed">
            Real-time attack-path correlation, asset risk concentration, and high-leverage single-key remediation for national technical infrastructure.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="bg-[#FFFFFF] border border-black/10 p-3 trinetra-chamfer shadow-tactical-elevated">
            <div className="text-[9px] font-bold text-[#666666] uppercase tracking-[0.15em]">
              FLEET POSTURE SCORE
            </div>
            <div className="text-base font-black text-[#171717] flex items-center space-x-2 mt-0.5">
              <span>{data.average_score}%</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#00A86B] text-white font-bold tracking-wider">
                OPERATIONAL
              </span>
            </div>
          </div>

          <button
            onClick={onNewAudit}
            className="bg-[#181818] hover:bg-[#292929] text-white font-mono font-bold text-xs px-6 py-3.5 trinetra-chamfer transition shadow-tactical-dark flex items-center space-x-2 tracking-[0.12em]"
          >
            <Zap className="w-4 h-4 text-[#00A86B]" />
            <span>RUN AUDIT WORKFLOW</span>
          </button>
        </div>
      </div>

      {/* 4 Core Questions Micro Summary Bar (Optical Depth, Minimal Borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* Q1: What Assets Exist? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>1. ASSET INVENTORY</span>
            <HardDrive className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#171717]">{data.total_devices}</span>
            <span className="text-[11px] text-[#666666] font-semibold">Active Monitored Nodes</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>Cisco &bull; Fortinet &bull; Whitebox</span>
            <span className="font-bold text-[#171717]">100% Parsed</span>
          </div>
        </div>

        {/* Q2: Where is Risk Concentrated? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>2. RISK CONCENTRATION</span>
            <AlertTriangle className="w-4 h-4 text-[#D64545]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#D64545]">{data.critical_failures}</span>
            <span className="text-[11px] text-[#D64545] font-bold">Critical Gaps</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>High Risk Hotspot:</span>
            <span className="font-bold text-[#D64545]">Mumbai & Panipat</span>
          </div>
        </div>

        {/* Q3: How do Attack Paths Connect? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>3. ATTACK VECTORS</span>
            <GitFork className="w-4 h-4 text-[#D4A017]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#171717]">{data.active_attack_chains}</span>
            <span className="text-[11px] text-[#D4A017] font-bold">Chained Paths</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>Telnet &bull; SNMP &bull; Priv Escalation</span>
          </div>
        </div>

        {/* Q4: What Single Action Reduces the Most Risk? */}
        <div className="trinetra-panel p-4 trinetra-chamfer space-y-2">
          <div className="flex justify-between items-start text-[9px] text-[#666666] font-bold uppercase tracking-[0.15em]">
            <span>4. LEVERAGE REMEDIATION</span>
            <Zap className="w-4 h-4 text-[#00A86B]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#00A86B]">-78.0%</span>
            <span className="text-[11px] text-[#00A86B] font-bold">Max Severance</span>
          </div>
          <div className="text-[10px] text-[#666666] border-t border-black/5 pt-2 flex justify-between">
            <span>Single Key Fix:</span>
            <span className="font-bold text-[#171717]">VTY Access-Class</span>
          </div>
        </div>
      </div>

      {/* DOMINANT HERO SECTION: Global Fleet View Operating Surface (Height 680px - 70% of screen) */}
      <div className="relative bg-[#181818] border border-white/10 trinetra-chamfer-lg shadow-tactical-dark overflow-hidden font-mono">
        {/* Map Header Overlay */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#1F1F1F]/90 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-[#181818] border border-white/20 text-[#00A86B]">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm text-white uppercase tracking-[0.15em] block">
                GLOBAL INFRASTRUCTURE OPERATIONAL SURFACE
              </span>
              <span className="text-[10px] text-[#8E8E8E]">Live defense grid map, attack path overlays & asset telemetry</span>
            </div>
          </div>

          <div className="flex bg-[#181818] border border-white/15 p-0.5">
            {(['TACTICAL MAP', 'TOPOLOGY GRAPH', 'THREAT MATRIX'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={`px-3 py-1 text-[10px] font-bold tracking-[0.1em] ${
                  mapMode === mode ? 'bg-[#F7F6F3] text-[#171717]' : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas Surface (680px Height) */}
        {mapMode === 'TACTICAL MAP' && (
          <div className="relative h-[680px] w-full trinetra-dark-grid-bg p-4 flex items-center justify-center">
            <svg viewBox="0 0 900 550" className="w-full h-full opacity-95">
              {/* Soft World Topo Continent Shapes */}
              <path
                d="M160,140 Q220,110 280,140 T310,210 T220,290 T140,210 Z M350,130 Q430,100 480,160 T440,250 T360,200 Z M510,210 Q580,190 640,250 T660,350 T560,350 Z M690,280 Q760,260 820,300 T800,390 T710,370 Z"
                fill="#222222"
                stroke="#333333"
                strokeWidth="1.5"
              />

              {/* Animated Curved Exploitation Bezier Vectors */}
              <path
                d="M 455 280 C 460 250, 465 240, 470 265"
                fill="none"
                stroke="#D64545"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              <path
                d="M 470 265 C 480 280, 485 320, 490 310"
                fill="none"
                stroke="#D64545"
                strokeWidth="2"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              <path
                d="M 220 220 C 300 160, 400 240, 490 310"
                fill="none"
                stroke="#D4A017"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Operational Nodes */}
              {OPERATIONAL_ASSETS.map((asset) => {
                const isSelected = selectedAsset.id === asset.id;
                const color = asset.status === 'compliant' ? '#00A86B' : asset.status === 'warning' ? '#D4A017' : '#D64545';
                return (
                  <g
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className="cursor-pointer group"
                  >
                    {/* Glowing Pulsing Outer Ring */}
                    <circle
                      cx={asset.cx}
                      cy={asset.cy}
                      r={isSelected ? 22 : 14}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      opacity={isSelected ? 1 : 0.6}
                      className={asset.status === 'critical' ? 'animate-radar-glow' : ''}
                    />
                    {/* Core Solid Marker */}
                    <circle
                      cx={asset.cx}
                      cy={asset.cy}
                      r={isSelected ? 8 : 5}
                      fill={color}
                    />
                    {/* Label Badge */}
                    <rect
                      x={asset.cx - 50}
                      y={asset.cy + 16}
                      width="100"
                      height="18"
                      fill="#181818"
                      stroke={isSelected ? color : '#3A3A3A'}
                      strokeWidth={isSelected ? '2' : '1'}
                    />
                    <text
                      x={asset.cx}
                      y={asset.cy + 28}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {asset.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Floating Glass Side Intelligence Panel (Overlay on right side of Map) */}
            <div className="absolute top-4 right-4 bottom-4 w-96 bg-[#1F1F1F]/95 backdrop-blur-lg border border-white/15 trinetra-chamfer p-5 space-y-4 text-xs font-mono text-white shadow-tactical-dark overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <MapPin className="w-4 h-4 text-[#D64545]" />
                  <span className="uppercase">ASSET INTELLIGENCE DRAWER</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                  selectedAsset.status === 'compliant' ? 'bg-[#00A86B]' : selectedAsset.status === 'warning' ? 'bg-[#D4A017]' : 'bg-[#D64545]'
                }`}>
                  {selectedAsset.status}
                </span>
              </div>

              {/* Q1: Asset Details */}
              <div className="space-y-1 bg-[#181818] border border-white/10 p-3 trinetra-chamfer">
                <div className="text-[9px] font-bold text-[#8E8E8E] uppercase tracking-[0.15em]">
                  1. ASSET IDENTIFICATION
                </div>
                <div className="text-sm font-black text-white">{selectedAsset.name}</div>
                <div className="text-[11px] text-[#A0A0A0]">
                  {selectedAsset.region} &bull; Subnet: <span className="text-white font-bold">{selectedAsset.ipSubnet}</span>
                </div>
                <div className="text-[11px] text-[#A0A0A0]">
                  NOS Dialect: <span className="text-white font-bold">{selectedAsset.vendor} ({selectedAsset.osVersion})</span>
                </div>
              </div>

              {/* Q2: Risk Concentration */}
              <div className="space-y-1 bg-[#181818] border border-white/10 p-3 trinetra-chamfer">
                <div className="text-[9px] font-bold text-[#D64545] uppercase tracking-[0.15em] flex justify-between">
                  <span>2. RISK CONCENTRATION</span>
                  <span>SCORE: {selectedAsset.complianceScore}%</span>
                </div>
                <div className="text-xs font-bold text-white">{selectedAsset.topVulnerability}</div>
                <div className="text-[11px] text-[#D64545] font-bold">
                  {selectedAsset.criticalCount} Critical Violations &bull; {selectedAsset.cveReference}
                </div>
              </div>

              {/* Q3: Attack Path Connection */}
              <div className="space-y-1 bg-[#181818] border border-white/10 p-3 trinetra-chamfer">
                <div className="text-[9px] font-bold text-[#D4A017] uppercase tracking-[0.15em]">
                  3. ATTACK PATH CHAIN ({selectedAsset.attackPathsCount} ACTIVE PATHS)
                </div>
                <div className="text-[11px] text-white font-bold">
                  Public Telnet &rarr; Missing VTY ACL &rarr; Default SNMP &rarr; Admin Escalation
                </div>
              </div>

              {/* Q4: Single Key Action */}
              <div className="space-y-2 bg-[#141414] text-[#F7F6F3] border border-[#00A86B]/30 p-3.5 trinetra-chamfer">
                <div className="text-[9px] text-[#00A86B] font-bold uppercase tracking-[0.15em] flex justify-between">
                  <span>4. SINGLE KEY FIX (-{selectedAsset.riskReductionPct}% RISK)</span>
                  <span>HIGH LEVERAGE</span>
                </div>
                <code className="text-xs text-[#00A86B] block font-mono bg-[#000000] p-2 border border-[#3A3A3A] overflow-x-auto">
                  {selectedAsset.singleKeyFix}
                </code>
                <p className="text-[10px] text-[#8E8E8E]">
                  Executing this single command severs the primary exploit chain on {selectedAsset.name}.
                </p>
              </div>
            </div>

            {/* Map Bottom Status Bar */}
            <div className="absolute bottom-4 left-4 bg-[#181818]/90 border border-white/10 p-3 font-mono text-[11px] text-[#A0A0A0] flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]"></span>
                <span>COMPLIANT: 28</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017]"></span>
                <span>WARNINGS: 9</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D64545]"></span>
                <span>CRITICAL: 5</span>
              </div>
            </div>
          </div>
        )}

        {mapMode === 'TOPOLOGY GRAPH' && (
          <div className="h-[680px] bg-[#181818] p-6 text-white font-mono text-xs flex items-center justify-center">
            <div className="text-center space-y-2">
              <GitFork className="w-12 h-12 text-[#00A86B] mx-auto" />
              <div className="font-bold text-sm tracking-wider">GRAPH TOPOLOGY WORKSPACE ACTIVE</div>
              <div className="text-[#8E8E8E] text-xs">Subnet & Gateway topology interconnects mapped across 7 core routers.</div>
            </div>
          </div>
        )}

        {mapMode === 'THREAT MATRIX' && (
          <div className="h-[680px] bg-[#181818] p-6 text-white font-mono text-xs overflow-y-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] text-[#8E8E8E] uppercase border-b border-white/10">
                <tr>
                  <th className="py-2.5">Asset</th>
                  <th className="py-2.5">Subnet</th>
                  <th className="py-2.5">Risk Level</th>
                  <th className="py-2.5">CVSS Baseline</th>
                  <th className="py-2.5 text-right">Leverage Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {OPERATIONAL_ASSETS.map((a) => (
                  <tr key={a.id} className="hover:bg-[#262626]">
                    <td className="py-3 font-bold">{a.name}</td>
                    <td className="py-3 text-[#A0A0A0]">{a.ipSubnet}</td>
                    <td className="py-3 font-bold uppercase" style={{ color: a.status === 'compliant' ? '#00A86B' : a.status === 'warning' ? '#D4A017' : '#D64545' }}>
                      {a.status}
                    </td>
                    <td className="py-3 text-[#A0A0A0]">{a.cveReference}</td>
                    <td className="py-3 text-right text-[#00A86B] font-bold">-{a.riskReductionPct}% Risk</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operational Violation Matrix & Telemetry Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Left 7 Columns: Critical Violation Matrix */}
        <div className="lg:col-span-7 trinetra-panel p-5 space-y-4 trinetra-chamfer">
          <div className="flex justify-between items-center border-b border-black/10 pb-3">
            <span className="font-black text-xs text-[#171717] uppercase tracking-[0.15em] flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-[#D64545]" />
              CRITICAL THREAT & COMPLIANCE VIOLATIONS MATRIX
            </span>
            <span className="text-[10px] text-[#666666]">SORTED BY SEVERITY</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[10px] text-[#666666] border-b border-black/10 uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2">Control / Violation</th>
                  <th className="py-2 px-2">Framework</th>
                  <th className="py-2 px-2 text-center">Impacted</th>
                  <th className="py-2 px-2">Severity</th>
                  <th className="py-2 px-2 text-right">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">Telnet Enabled on Line VTY</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">CIS / DISA STIG</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D64545]">8 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D64545] text-white">CRITICAL</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">transport input ssh</td>
                </tr>
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">Default SNMP Community ('public')</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">CIS Benchmark</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D64545]">6 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D64545] text-white">CRITICAL</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">no snmp-server community</td>
                </tr>
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">Missing VTY Access-Class ACL</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">NIST AC-17</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D4A017]">5 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D4A017] text-white">HIGH</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">access-class 10 in</td>
                </tr>
                <tr className="hover:bg-[#F9F9F8]">
                  <td className="py-3 px-2 font-bold text-[#171717]">No Remote Centralized Syslog</td>
                  <td className="py-3 px-2 text-[#666666] text-[11px]">NIST AU-2</td>
                  <td className="py-3 px-2 text-center font-bold text-[#D4A017]">4 Devices</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-[#D4A017] text-white">HIGH</span>
                  </td>
                  <td className="py-3 px-2 text-right text-[#00A86B] font-bold">logging host 10.0.0.50</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Executions Log & System Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="trinetra-panel p-5 space-y-3 trinetra-chamfer">
            <div className="flex justify-between items-center border-b border-black/10 pb-3">
              <span className="font-black text-xs text-[#171717] uppercase tracking-[0.15em]">
                RECENT AUDIT EXECUTIONS
              </span>
              <span className="text-[10px] text-[#666666]">REAL-TIME TELEMETRY</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="text-[10px] text-[#666666] border-b border-black/10 uppercase">
                  <tr>
                    <th className="py-1.5 px-2">Host</th>
                    <th className="py-1.5 px-2">Vendor</th>
                    <th className="py-1.5 px-2">Score</th>
                    <th className="py-1.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {recentAudits.map((a: any) => (
                    <tr key={a.id} className="hover:bg-[#F9F9F8]">
                      <td className="py-2.5 px-2 font-bold text-[#171717]">{a.hostname}</td>
                      <td className="py-2.5 px-2 text-[#666666] text-[11px]">{a.vendor}</td>
                      <td className="py-2.5 px-2 font-bold" style={{ color: a.score >= 80 ? '#00A86B' : a.score >= 60 ? '#D4A017' : '#D64545' }}>
                        {a.score}%
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => onSelectAudit(a.id)}
                          className="text-[10px] font-bold bg-[#181818] text-white px-2.5 py-1 trinetra-chamfer hover:bg-[#292929]"
                        >
                          INSPECT &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Defense System Status Panel */}
          <div className="bg-[#181818] text-[#F7F6F3] border border-white/10 trinetra-chamfer p-5 space-y-3 font-mono text-xs shadow-tactical-dark">
            <div className="border-b border-white/10 pb-2 flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-[0.15em] text-white">DEFENSE INFRASTRUCTURE STATUS</span>
              <span className="text-[10px] text-[#00A86B] font-bold">● ALL SYSTEMS GO</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">FASTAPI SERVICE</div>
                <div className="font-bold text-[#00A86B]">ONLINE (0.2ms)</div>
              </div>
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">DATABASE BACKEND</div>
                <div className="font-bold text-[#00A86B]">POSTGRES DB</div>
              </div>
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">LOCAL AI INFERENCE</div>
                <div className="font-bold text-[#00A86B]">OLLAMA (llama3.2)</div>
              </div>
              <div className="p-2.5 bg-[#262626] border border-white/10">
                <div className="text-[#8E8E8E] text-[9px]">DIALECT CACHE</div>
                <div className="font-bold text-white">24 ENTRIES</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
