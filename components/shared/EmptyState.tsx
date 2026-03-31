'use client';

export function EmptyState() {
  return (
    <div className="glass-card flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
      <div className="icon-container blue mb-6 w-16 h-16">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">No Sprint Plan Yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Configure your sprint details in the left panel and click &quot;Generate Sprint Plan&quot;
        to create an AI-powered sprint breakdown.
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Powered by Claude AI
        </span>
      </div>
    </div>
  );
}
