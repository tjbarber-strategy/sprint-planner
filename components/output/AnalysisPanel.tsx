'use client';

import { useState } from 'react';
import {
  ConstraintResult,
  JobSlot,
  SprintRule,
  JOB_TYPE_CONFIG,
  VolumeConfig,
  BreakdownTypes,
} from '@/lib/types';
import { CheckCircle, XCircle, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: string;
  constraints: ConstraintResult[];
  jobs: JobSlot[];
  rules: SprintRule[];
  volume: VolumeConfig;
  breakdowns: BreakdownTypes;
}

function computeLiveConstraints(jobs: JobSlot[], rules: SprintRule[]): ConstraintResult[] {
  const total = jobs.length;
  return rules
    .filter((r) => r.active)
    .map((rule) => {
      const key = rule.breakdownType as string;
      const targetOption = rule.condition.targetOption;
      const condValue = rule.condition.value ?? 0;

      if (!targetOption) return { rule, target: condValue, actual: 0, met: true };

      const count = jobs.filter((j) => String(j[key] ?? '') === targetOption).length;
      let actual: number, target: number, met: boolean;

      if (rule.condition.type === 'percentage') {
        actual = total > 0 ? Math.round((count / total) * 100) : 0;
        target = condValue;
        met = actual === target;
      } else if (rule.condition.type === 'minimum') {
        actual = count; target = condValue; met = actual >= target;
      } else if (rule.condition.type === 'maximum') {
        actual = count; target = condValue; met = actual <= target;
      } else {
        actual = count; target = condValue; met = true;
      }
      return { rule, target, actual, met };
    });
}

function computeStats(jobs: JobSlot[]) {
  const total = jobs.length;
  const explore = jobs.filter((j) => j.jobCategory === 'Explore').length;
  const exploit = total - explore;
  const byType = Object.fromEntries(
    Object.keys(JOB_TYPE_CONFIG).map((c) => [c, jobs.filter((j) => j.jobType === c).length])
  );
  const skipKeys = new Set(['slotNumber', 'jobType', 'jobCategory']);
  const bdKeys = total > 0 ? Object.keys(jobs[0]).filter((k) => !skipKeys.has(k)) : [];
  const bdDists: Record<string, Record<string, number>> = {};
  for (const key of bdKeys) {
    const dist: Record<string, number> = {};
    for (const job of jobs) {
      const val = String(job[key] ?? '—');
      dist[val] = (dist[val] ?? 0) + 1;
    }
    bdDists[key] = dist;
  }
  return { total, explore, exploit, byType, bdDists, bdKeys };
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1 bg-secondary/60 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function StatRow({
  label,
  count,
  total,
  color,
  labelColor,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  labelColor?: string;
}) {
  const p = pct(count, total);
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span
        className="text-[11px] flex-shrink-0 w-20 truncate"
        style={{ color: labelColor ?? 'hsl(215,20%,65%)' }}
        title={label}
      >
        {label}
      </span>
      <MiniBar value={p} color={color} />
      <span className="text-[10px] text-muted-foreground w-5 text-right flex-shrink-0">{count}</span>
      <span className="text-[10px] text-muted-foreground w-7 text-right flex-shrink-0">{p}%</span>
    </div>
  );
}

function BdCard({ label, entries, total }: { label: string; entries: [string, number][]; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 5;
  const shown = expanded ? entries : entries.slice(0, LIMIT);
  const hasMore = entries.length > LIMIT;

  return (
    <div className="bg-secondary/30 rounded-lg p-3">
      <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">{label}</span>
      <div>
        {shown.map(([val, count]) => (
          <StatRow key={val} label={val} count={count} total={total} color="hsl(217,91%,60%)" />
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-2.5 h-2.5" /> Show less</>
            ) : (
              <><ChevronDown className="w-2.5 h-2.5" /> +{entries.length - LIMIT} more</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function CompactConstraint({ c, isPct }: { c: ConstraintResult; isPct: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1 border-b border-border/20 last:border-0">
      {c.met ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      )}
      <span className="flex-1 text-xs text-foreground truncate">{c.rule.description}</span>
      <span
        className={`text-[10px] flex-shrink-0 font-mono ${c.met ? 'text-green-400' : 'text-red-400'}`}
      >
        {c.actual}{isPct ? '%' : ''} / {c.target}{isPct ? '%' : ''}
      </span>
    </div>
  );
}

export function AnalysisPanel({
  analysis,
  constraints: _constraints,
  jobs,
  rules,
  volume,
  breakdowns: _breakdowns,
}: AnalysisPanelProps) {
  const liveConstraints = computeLiveConstraints(jobs, rules);
  const stats = computeStats(jobs);

  const exploreColor = 'hsl(270,70%,60%)';
  const exploitColor = 'hsl(160,84%,50%)';
  const jobTypeColors: Record<string, string> = {
    MORE: exploitColor, UPGRADE: exploitColor, FIX: exploitColor,
    ADAPT: exploreColor, NEW: exploreColor,
  };
  const jobTypeLabelColors: Record<string, string> = {
    MORE: 'hsl(160,84%,55%)', UPGRADE: 'hsl(160,84%,55%)', FIX: 'hsl(160,84%,55%)',
    ADAPT: 'hsl(270,70%,65%)', NEW: 'hsl(270,70%,65%)',
  };

  const exploreTarget = volume.explorePercentage;
  const exploitTarget = 100 - exploreTarget;
  const exploreActual = pct(stats.explore, stats.total);
  const exploitActual = pct(stats.exploit, stats.total);

  // Volume-derived constraints (just the 2 explore/exploit rows)
  const volumeConstraints = [
    {
      rule: { id: 'vol-explore', description: `Explore ${exploreTarget}%`, breakdownType: 'jobType' as const, condition: { type: 'percentage' as const, value: exploreTarget }, active: true },
      target: exploreTarget, actual: exploreActual, met: exploreActual === exploreTarget,
    },
    {
      rule: { id: 'vol-exploit', description: `Exploit ${exploitTarget}%`, breakdownType: 'jobType' as const, condition: { type: 'percentage' as const, value: exploitTarget }, active: true },
      target: exploitTarget, actual: exploitActual, met: exploitActual === exploitTarget,
    },
  ];

  // Freeform-only rules (qualitative, can't auto-evaluate)
  const freeformRules = rules.filter((r) => r.active && !r.condition.targetOption && r.freeformText);

  const hasRuleConstraints = liveConstraints.length > 0 || freeformRules.length > 0;

  // Build active breakdown cards
  const activeBdKeys = stats.bdKeys.filter((key) => {
    const dist = stats.bdDists[key];
    return Object.entries(dist).some(([val]) => val && val !== '—' && val !== 'undefined');
  });

  return (
    <div className="space-y-4">
      {/* ── Overview ── */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-header">Current Plan Overview</h3>
          <span className="text-xs text-muted-foreground">{stats.total} jobs</span>
        </div>

        {/* Top: Job Category + Job Type side by side */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-secondary/30 rounded-lg p-3">
            <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">Job Category</span>
            <StatRow label="Explore" count={stats.explore} total={stats.total} color={exploreColor} labelColor="hsl(270,70%,65%)" />
            <StatRow label="Exploit" count={stats.exploit} total={stats.total} color={exploitColor} labelColor="hsl(160,84%,55%)" />
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">Job Type</span>
            {Object.entries(stats.byType)
              .filter(([, c]) => c > 0)
              .map(([code, count]) => (
                <StatRow
                  key={code}
                  label={JOB_TYPE_CONFIG[code as keyof typeof JOB_TYPE_CONFIG]?.label ?? code}
                  count={count}
                  total={stats.total}
                  color={jobTypeColors[code] ?? 'hsl(215,20%,40%)'}
                  labelColor={jobTypeLabelColors[code]}
                />
              ))}
          </div>
        </div>

        {/* Breakdown cards grid */}
        {activeBdKeys.length > 0 && (
          <div className={`grid gap-3 ${activeBdKeys.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {activeBdKeys.map((key) => {
              const entries = Object.entries(stats.bdDists[key])
                .filter(([val]) => val && val !== '—' && val !== 'undefined')
                .sort(([, a], [, b]) => b - a);
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
              return <BdCard key={key} label={label} entries={entries} total={stats.total} />;
            })}
          </div>
        )}
      </div>

      {/* ── Constraints ── */}
      <div className="glass-card p-4">
        <h3 className="section-header mb-3">Constraints (Live)</h3>
        <div className="space-y-4">
          {/* Volume-derived: always 2 rows */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">From Volume Settings</p>
            <div className="bg-secondary/30 rounded-lg px-3 py-1">
              {volumeConstraints.map((c, i) => (
                <CompactConstraint key={i} c={c} isPct={true} />
              ))}
            </div>
          </div>

          {/* User rules */}
          {hasRuleConstraints ? (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">From Rules</p>
              <div className="bg-secondary/30 rounded-lg px-3 py-1">
                {liveConstraints.map((c, i) => (
                  <CompactConstraint
                    key={i}
                    c={c}
                    isPct={c.rule.condition.type === 'percentage'}
                  />
                ))}
                {freeformRules.map((rule, i) => (
                  <div key={`ff-${i}`} className="flex items-center gap-2 py-1 border-b border-border/20 last:border-0">
                    <Minus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-xs text-foreground truncate">{rule.description}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">manual</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No custom rules. Add constraints in the Breakdowns section to track them here.
            </p>
          )}
        </div>
      </div>

      {/* ── Generation Notes ── */}
      <div className="glass-card p-4">
        <h3 className="section-header mb-1">Generation Notes</h3>
        <p className="text-[11px] text-muted-foreground mb-2">
          Original AI rationale — static, does not update with edits.
        </p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{analysis}</p>
      </div>
    </div>
  );
}
