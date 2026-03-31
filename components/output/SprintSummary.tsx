'use client';

import { useSprintStore } from '@/store/sprint-store';

export function SprintSummary() {
  const { currentPlan } = useSprintStore();

  if (!currentPlan) return null;

  const stats = {
    totalTasks: currentPlan.tasks.length,
    totalPoints: currentPlan.totalPoints,
    targetPoints: currentPlan.config.velocityPoints,
    highPriority: currentPlan.tasks.filter((t) => t.priority === 'high').length,
    mediumPriority: currentPlan.tasks.filter((t) => t.priority === 'medium').length,
    lowPriority: currentPlan.tasks.filter((t) => t.priority === 'low').length,
    categories: [...new Set(currentPlan.tasks.map((t) => t.category))],
  };

  const pointsPercentage = Math.round((stats.totalPoints / stats.targetPoints) * 100);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="icon-container green">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h2 className="section-header m-0">Sprint Summary</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">{currentPlan.summary}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-card/50 border border-border/30 rounded-lg">
          <p className="text-2xl font-bold gradient-text">{stats.totalTasks}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Tasks</p>
        </div>
        <div className="text-center p-4 bg-card/50 border border-border/30 rounded-lg">
          <p className="text-2xl font-bold">
            <span className="gradient-text">{stats.totalPoints}</span>
            <span className="text-sm font-normal text-muted-foreground">
              /{stats.targetPoints}
            </span>
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Story Points</p>
        </div>
        <div className="text-center p-4 bg-card/50 border border-border/30 rounded-lg">
          <p className="text-2xl font-bold gradient-text">{stats.categories.length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Categories</p>
        </div>
        <div className="text-center p-4 bg-card/50 border border-border/30 rounded-lg">
          <p className="text-2xl font-bold gradient-text">{pointsPercentage}%</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Capacity</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="section-header mb-3">Priority Distribution</p>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/30" />
              <span className="text-muted-foreground">High:</span>
              <span className="text-foreground font-medium">{stats.highPriority}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/30" />
              <span className="text-muted-foreground">Medium:</span>
              <span className="text-foreground font-medium">{stats.mediumPriority}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/30" />
              <span className="text-muted-foreground">Low:</span>
              <span className="text-foreground font-medium">{stats.lowPriority}</span>
            </span>
          </div>
        </div>

        {currentPlan.risks && currentPlan.risks.length > 0 && (
          <div className="pt-4 border-t border-border/30">
            <p className="section-header mb-3">Risks</p>
            <ul className="space-y-2">
              {currentPlan.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-yellow-400 mt-0.5 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-muted-foreground">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {currentPlan.assumptions && currentPlan.assumptions.length > 0 && (
          <div className="pt-4 border-t border-border/30">
            <p className="section-header mb-3">Assumptions</p>
            <ul className="space-y-2">
              {currentPlan.assumptions.map((assumption, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-primary mt-0.5 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-muted-foreground">{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
