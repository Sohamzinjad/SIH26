import React, { useState, useEffect } from 'react';
import { AttackPath, AuditDetail, Finding } from '../types';
import { fetchAuditDetail } from '../api/client';
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Network,
  AlertTriangle,
  CheckCircle2,
  Activity,
  GitBranch,
} from 'lucide-react';

interface AttackPathGraphProps {
  auditId: number;
  onBack?: () => void;
}

const SVG_WIDTH = 880;
const FIND_Y = 90;
const CHAIN_Y = 230;
const BREAK_Y = 370;
const ROW_GAP = 420;

const SEVERITY_COLORS: Record<string, { stroke: string; fill: string; text: string }> = {
  critical: { stroke: '#FB7185', fill: 'rgba(244,63,94,0.12)', text: '#FDA4AF' },
  high: { stroke: '#FB923C', fill: 'rgba(249,115,22,0.12)', text: '#FDBA74' },
  medium: { stroke: '#FBBF24', fill: 'rgba(245,158,11,0.12)', text: '#FCD34D' },
  low: { stroke: '#60A5FA', fill: 'rgba(59,130,246,0.12)', text: '#93C5FD' },
};

const findingColor = (severity: string | undefined, status: string | undefined) => {
  if (status === 'pass') return { stroke: '#34D399', fill: 'rgba(52,211,153,0.10)', text: '#6EE7B7' };
  return SEVERITY_COLORS[severity || 'low'] ?? SEVERITY_COLORS.low;
};

function NodeBox({ x, y, w, h, label, sub, colors, dashed, active }: {
  x: number; y: number; w: number; h: number; label: string; sub?: string;
  colors: { stroke: string; fill: string; text: string }; dashed?: boolean; active?: boolean;
}) {
  const cx = x + w / 2;
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx={8}
        fill={active === false ? 'rgba(100,116,139,0.08)' : colors.fill}
        stroke={active === false ? '#475569' : colors.stroke}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '6 4' : undefined}
      />
      {active === false && (
        <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke="#475569" strokeWidth={3} opacity={0.35} />
      )}
      <text x={cx} y={y + h / 2 + 1} textAnchor="middle" fill={active === false ? '#94A3B8' : colors.text} fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace">
        {label}
      </text>
      {sub && (
        <text x={cx} y={y + h - 8} textAnchor="middle" fill={active === false ? '#64748B' : '#94A3B8'} fontSize={9} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

export const AttackPathGraph: React.FC<AttackPathGraphProps> = ({ auditId, onBack }) => {
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAuditDetail(auditId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load attack paths');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-[#12151A] border border-rose-500/30 rounded-xl px-6 py-10 text-center">
        <ShieldAlert className="w-5 h-5 text-rose-400 mx-auto mb-2" />
        <p className="text-xs text-rose-300 font-mono">{error || 'No audit detail available'}</p>
      </div>
    );
  }

  const attackPaths: AttackPath[] = detail.attack_paths || [];
  const findingByRule: Record<string, Finding> = {};
  (detail.findings || []).forEach((f) => {
    findingByRule[f.rule_id] = f;
  });
  const activeCount = attackPaths.filter((p) => p.is_active).length;
  const hasAnyPath = attackPaths.length > 0;
  const heights = attackPaths.map((_, i) => ROW_GAP);
  const totalH = heights.reduce((a, b) => a + b, 0) + 40;

  const chainsLayout = attackPaths.map((p, idx) => {
    const rowTop = 40 + idx * ROW_GAP;
    const findings = p.finding_rule_ids || [];
    const n = Math.max(findings.length, 1);
    const slot = (SVG_WIDTH - 80) / n;
    const nodeW = Math.min(150, slot - 12);
    const nodeH = 46;
    const findingNodes = findings.map((rid, i) => {
      const f = findingByRule[rid];
      const c = findingColor(f?.severity, f?.status);
      return {
        rid,
        isFailed: f?.status === 'fail',
        x: 40 + i * slot + (slot - nodeW) / 2,
        y: FIND_Y + rowTop,
        w: nodeW,
        h: nodeH,
        colors: c,
      };
    });
    const chainW = Math.max(170, Math.min(230, p.name.length * 7 + 60));
    const chainX = (SVG_WIDTH - chainW) / 2;
    const chainY = CHAIN_Y + rowTop;
    const breakW = Math.max(150, Math.min(220, p.break_rule_id.length * 8 + 40));
    const breakX = (SVG_WIDTH - breakW) / 2;
    const breakY = BREAK_Y + rowTop;
    return { p, findings, findingNodes, chainX, chainY, chainW, breakX, breakY, breakW };
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-400">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-1.5 border border-[#2C313B] hover:border-emerald-500/50 hover:text-white px-3 py-1.5 rounded-lg text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <span className="text-xs text-slate-500">audit #{auditId}</span>
        </div>
        <div className="flex items-center space-x-2">
          {activeCount > 0 ? (
            <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Activity className="w-3 h-3" />
              {activeCount} chain(s) alive
            </span>
          ) : hasAnyPath ? (
            <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-[#2C313B]">
              No active chains
            </span>
          ) : null}
        </div>
      </div>

      {!hasAnyPath ? (
        <div className="bg-[#12151A] border border-[#2C313B] rounded-xl px-6 py-16 text-center space-y-3">
          <ShieldAlert className="w-6 h-6 text-slate-500 mx-auto" />
          <div className="text-sm font-medium text-slate-300">No attack paths persisted for this audit</div>
          <div className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Attack paths are correlated when an audit completes and a prerequisite chain of
            failing rules is identified. Run a device audit to populate the graph.
          </div>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center space-x-5 text-[10px] font-mono text-slate-500 px-1">
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500" />
              Failing rule
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/20 border border-rose-500" />
              Chain (active)
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-500/20 border border-slate-500 dashed" />
              Inactive
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-4 h-0.5 bg-rose-500/70 border-t border-dashed border-rose-500" />
              Severance edge
            </span>
          </div>

          {/* SVG Graph */}
          <div className="bg-[#12151A] border border-[#2C313B] rounded-xl overflow-x-auto">
            <svg width={SVG_WIDTH} height={totalH} className="block" viewBox={`0 0 ${SVG_WIDTH} ${totalH}`}>
              <defs>
                <linearGradient id="ap-bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16,20,24,0)" />
                  <stop offset="100%" stopColor="rgba(16,24,22,0.6)" />
                </linearGradient>
              </defs>
              <rect width={SVG_WIDTH} height={totalH} fill="url(#ap-bg)" />
              {chainsLayout.map((l, i) => {
                const chainColors = SEVERITY_COLORS[l.p.severity || 'high'] ?? SEVERITY_COLORS.high;
                const breakColors = { stroke: '#F87171', fill: 'rgba(248,113,113,0.10)', text: '#FCA5A5' };
                const chainCX = l.chainX + l.chainW / 2;
                const chainTopY = l.chainY;
                const chainBottomY = l.chainY + 30;
                const breakTopY = l.breakY;
                return (
                  <g key={l.p.chain_id}>
                    {/* finding -> chain edges */}
                    {l.findingNodes.map((f) => (
                      <line
                        key={f.rid}
                        x1={f.x + f.w / 2}
                        y1={f.y + f.h}
                        x2={chainCX}
                        y2={chainTopY}
                        stroke={f.colors.stroke}
                        strokeWidth={1.3}
                        strokeOpacity={0.55}
                      />
                    ))}
                    {/* chain -> break edge */}
                    <line
                      x1={chainCX}
                      y1={chainBottomY}
                      x2={chainCX}
                      y2={breakTopY}
                      stroke={breakColors.stroke}
                      strokeWidth={1.6}
                      strokeDasharray="5 4"
                    />
                    {/* finding nodes */}
                    {l.findingNodes.map((f) => (
                      <NodeBox
                        key={f.rid}
                        x={f.x}
                        y={f.y}
                        w={f.w}
                        h={f.h}
                        label={f.rid}
                        sub={f.isFailed ? 'FAIL' : findingByRule[f.rid]?.status}
                        colors={f.colors}
                      />
                    ))}
                    {/* chain node */}
                    <NodeBox
                      x={l.chainX}
                      y={l.chainY}
                      w={l.chainW}
                      h={36}
                      label={l.p.name}
                      sub={`${l.p.severity} · ${l.p.chain_id}`}
                      colors={chainColors}
                      dashed={!l.p.is_active}
                      active={l.p.is_active}
                    />
                    {/* break node */}
                    <NodeBox
                      x={l.breakX}
                      y={l.breakY}
                      w={l.breakW}
                      h={44}
                      label={l.p.break_rule_id}
                      sub="severance point"
                      colors={breakColors}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Chain detail cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chainsLayout.map((l) => (
              <div key={l.p.chain_id} className="bg-[#12151A] border border-[#2C313B] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-mono font-bold text-white">{l.p.chain_id}</span>
                    {l.p.is_active ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-[#2C313B]">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">{l.p.severity}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{l.p.narrative}</p>
                <div className="bg-[#0A0C0F] border border-rose-500/20 rounded-lg px-3 py-2 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono font-bold text-rose-300">{l.p.break_rule_id}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">{l.p.break_why}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {l.findings.map((rid) => (
                    <span key={rid} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0A0C0F] text-slate-400 border border-[#22262F]">
                      {rid}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Real-data footnote */}
      {hasAnyPath && (
        <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-mono">
          <Network className="w-3.5 h-3.5" />
          <span>Graph rendered from persisted attack_paths rows (audit #{auditId}) — no hardcoded topology.</span>
        </div>
      )}
    </div>
  );
};

export default AttackPathGraph;