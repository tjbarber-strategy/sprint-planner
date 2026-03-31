'use client';

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-3">
          <div className="icon-container yellow">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold gradient-text">Sprint Planner</h1>
            <p className="text-xs text-muted-foreground">AI-powered sprint planning</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              Claude Powered
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
