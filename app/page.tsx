'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { InputPanel } from '@/components/inputs/InputPanel';
import { OutputPanel } from '@/components/output/OutputPanel';
import { GenerateButton } from '@/components/shared/GenerateButton';
import { HistoryNav } from '@/components/shared/HistoryNav';
import { Sparkles, Loader2, ClipboardList, PanelLeftClose, PanelLeft } from 'lucide-react';

export default function SprintPlannerPage() {
  const { isGenerating, error, currentOutput, history } = useSprintStore();
  const [isInputPanelVisible, setIsInputPanelVisible] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-xl relative z-20">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Logo and title */}
          <div className="flex items-center gap-3">
            <div className="icon-container blue">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="gradient-text text-xl font-bold tracking-tight">
                SPRINT PLANNER
              </h1>
              <p className="text-xs text-muted-foreground">
                by TubeScience Labs
              </p>
            </div>
          </div>

          {/* Right side - History and avatar */}
          <div className="flex items-center gap-4">
            {history.length > 0 && <HistoryNav />}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel - Inputs (collapsible) */}
        <aside
          className={`border-r border-border/30 overflow-y-auto scrollbar-thin transition-all duration-300 ${
            isInputPanelVisible ? 'w-[720px]' : 'w-0 overflow-hidden'
          }`}
        >
          <InputPanel />
        </aside>

        {/* Middle Panel - Generate Button */}
        <div className="w-[140px] bg-secondary/20 flex flex-col items-center justify-center border-r border-border/30 relative">
          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setIsInputPanelVisible(!isInputPanelVisible)}
            className="absolute top-4 left-4 p-2 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-border transition-colors"
            title={isInputPanelVisible ? 'Hide input panel' : 'Show input panel'}
          >
            {isInputPanelVisible ? (
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
            ) : (
              <PanelLeft className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <GenerateButton />

          {error && (
            <div className="mt-4 mx-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-xs text-destructive text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Right Panel - Output */}
        <section className="flex-1 overflow-y-auto scrollbar-thin">
          {currentOutput ? (
            <OutputPanel />
          ) : (
            <EmptyState isGenerating={isGenerating} />
          )}
        </section>
      </main>
    </div>
  );
}

function EmptyState({ isGenerating }: { isGenerating: boolean }) {
  if (isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Generating sprint plan...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="icon-container blue mx-auto mb-6 w-16 h-16">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          No Sprint Plan Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Configure your sprint parameters in the left panel, then click the
          generate button to create an AI-powered sprint plan.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Powered by Claude AI
        </div>
      </div>
    </div>
  );
}
