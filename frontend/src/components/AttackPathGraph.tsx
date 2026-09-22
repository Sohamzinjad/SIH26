import React, { useState, useEffect } from 'react';
import { AttackPath, AuditDetail } from '../types';
import { fetchAuditDetail } from '../api/client';
import {
  ArrowLeft,
  ShieldCheck,
  GitFork,
  Zap,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Activity,
  Terminal,
} from 'lucide-react';

interface AttackPathGraphProps {
  auditId: number;
  onBack?: () => void;
}

export const AttackPathGraph: React.FC<AttackPathGraphProps> = ({ auditId, onBack }) => {
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation state
  const [activePathIdx, setActivePathIdx] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1500);

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

  // Simulation Timer
  useEffect(() => {
    if (!isPlaying || !detail?.attack_paths?.length) return;
    const currentPath = detail.attack_paths[activePathIdx];
    const maxSteps = currentPath?.finding_rule_ids?.length || 0;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev + 1 >= maxSteps) {
          setIsPlaying(false);
          return maxSteps - 1;
        }
        return prev + 1;
      });
    }, simSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, activePathIdx, detail, simSpeed]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
        <p className="font-mono text-xs text-faint tracking-[0.18em] uppercase">Correlating attack paths…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="banner banner-error space-y-2">
        <div className="font-bold uppercase text-sm">Attack path error</div>
        <div>{error || 'Audit not found'}</div>
      </div>
    );
  }

  const { audit, attack_paths, single_fix_recommendation } = detail;
  const paths: AttackPath[] = attack_paths || [];
  const selectedPath = paths[activePathIdx] || paths[0];
  const totalSteps = selectedPath?.finding_rule_ids?.length || 0;

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleResetSim = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleSelectPath = (idx: number) => {
    setActivePathIdx(idx);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // NOTE: this view deliberately uses no decorative shapes or entrance motion —
  // the graph must stay static and readable at all times.
  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            {onBack && (
              <button
                onClick={onBack}
                className="btn btn-ghost btn-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to audit
              </button>
            )}
            <span className="kicker">Attack path workspace &bull; #{audit.id}</span>
          </div>

          <h1 className="font-display font-bold text-h1 tracking-tight text-ink flex flex-wrap items-center gap-3">
            <span>{audit.hostname}</span>
            <span className="badge badge-critical">{paths.length} active paths</span>
          </h1>
          <p className="mt-3 text-body text-muted">
            Correlated multi-stage exploit chains linking rule violations into actionable attack stories.
          </p>
        </div>
      </div>

      {/* Single Key Fix Highlight Box */}
      {single_fix_recommendation && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-widest text-ok">
            <Zap className="w-4 h-4" />
            Single key fix &bull; optimal remediation move
          </div>
          <code className="block code-surface p-4 text-sm text-ok">
            {single_fix_recommendation.remediation}
          </code>
          <p className="text-caption text-muted">
            Dismantles <strong className="text-ink">{single_fix_recommendation.paths_broken_count}</strong> attack paths simultaneously.
          </p>
        </div>
      )}

      {/* Graph & Simulation Area */}
      {paths.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-ok mx-auto" />
          <div className="font-semibold text-ink">No active attack paths detected</div>
          <div className="text-caption text-muted">Device configuration has passed critical chain correlation.</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Interactive Simulation Controls */}
          <div className="card-raise p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-widest text-ok">
                <Activity className="w-4 h-4" />
                Adversary pivot simulator
              </div>

              {/* Playback Controls — no motion in controls themselves */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn btn-primary btn-sm"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Simulate pivot'}
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={currentStep >= totalSteps - 1}
                  className="btn btn-ghost btn-sm"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Step
                </button>

                <button
                  onClick={handleResetSim}
                  className="btn btn-ghost btn-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Path selector buttons */}
            <div className="flex flex-wrap gap-2">
              {paths.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPath(idx)}
                  className={`btn btn-sm ${
                    activePathIdx === idx ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  Path #{idx + 1}: {p.name}
                </button>
              ))}
            </div>

            {/* Interactive Step Visualizer */}
            {selectedPath && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#0c0c0e] p-4">
                  {selectedPath.finding_rule_ids?.map((fId, fIdx) => {
                    const isPassed = fIdx < currentStep;
                    const isCurrent = fIdx === currentStep;
                    return (
                      <React.Fragment key={fIdx}>
                        <div
                          className={`rounded-xl border p-3 font-mono text-xs flex items-center gap-2.5 transition-colors duration-150 ${
                            isCurrent
                              ? 'bg-[#D92D20] border-[#D92D20] text-white'
                              : isPassed
                              ? 'bg-[#067647]/15 border-[#067647]/60 text-[#4ADE80]'
                              : 'bg-surface border-white/10 text-faint'
                          }`}
                        >
                          <span
                            className={`h-6 w-6 font-bold flex items-center justify-center text-[11px] rounded-lg ${
                              isCurrent
                                ? 'bg-white text-[#D92D20]'
                                : isPassed
                                ? 'bg-[#067647] text-white'
                                : 'bg-surface-3 text-muted'
                            }`}
                          >
                            {fIdx + 1}
                          </span>
                          <span className="text-left">
                            <span className={`block font-bold ${isPassed || isCurrent ? '' : ''}`}>{fId}</span>
                            <span className="block text-[9px] uppercase tracking-wider opacity-80">
                              {isCurrent ? (isPlaying ? 'Exploiting…' : 'Next step') : isPassed ? 'Pivot succeeded' : 'Pending'}
                            </span>
                          </span>
                        </div>
                        {fIdx < (selectedPath.finding_rule_ids.length - 1) && (
                          <span className={`font-bold text-sm ${isPassed ? 'text-ok' : 'text-faint'}`}>&rarr;</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Simulation Terminal Output */}
                <div className="code-surface p-4 text-xs text-ok flex items-start gap-3">
                  <Terminal className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-muted">SIMULATION STEP [{currentStep + 1}/{totalSteps}]:</span>{' '}
                    <span>
                      Adversary exploits rule violation <strong className="text-white">{selectedPath.finding_rule_ids[currentStep]}</strong>.
                    </span>
                    <div className="text-[11px] text-faint mt-1">
                      Rationale: {selectedPath.narrative}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Path List */}
          {paths.map((p, idx) => (
            <div key={idx} className="card p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="badge badge-critical">Path #{idx + 1} &bull; {p.severity}</span>
                  <span className="font-display font-bold text-[15px] text-ink">{p.name}</span>
                </div>
                <span className="font-mono text-[11px] text-faint uppercase">
                  Chain length: {p.finding_rule_ids?.length || 0} steps
                </span>
              </div>

              {/* Exploit Steps Visualization */}
              <div className="rounded-xl border border-white/10 bg-[#0c0c0e] space-y-4 p-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold text-muted">
                  Exploit chain narrative
                </div>
                <p className="text-body text-muted leading-relaxed">
                  {p.narrative}
                </p>

                {/* Steps Nodes Diagram */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                  {p.finding_rule_ids?.map((fId, fIdx) => (
                    <React.Fragment key={fIdx}>
                      <div className="rounded-lg border border-white/10 bg-surface-2 p-2 text-xs font-mono text-ink flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-[#D92D20] text-white font-bold flex items-center justify-center text-[10px]">
                          {fIdx + 1}
                        </span>
                        <span>{fId}</span>
                      </div>
                      {fIdx < (p.finding_rule_ids.length - 1) && (
                        <span className="text-ok font-bold text-sm">&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Break Rule / Severance Command for this path */}
              {p.break_why && (
                <div className="rounded-xl bg-surface-2 border border-white/10 p-4 space-y-1.5">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-faint">Severance rationale</div>
                  <div className="text-[14px] font-semibold text-ink">{p.break_why}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};