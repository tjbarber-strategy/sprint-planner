'use client';

import { useSprintStore } from '@/store/sprint-store';
import { Play, Loader2 } from 'lucide-react';

export function GenerateButton() {
  const {
    inputs,
    isGenerating,
    setIsGenerating,
    setError,
    setCurrentOutput,
    pushGeneration,
    clearOutput,
  } = useSprintStore();

  const isDisabled = inputs.volume.totalJobs < 1 || isGenerating;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    clearOutput();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate sprint plan';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response body might not be JSON
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Failed to parse server response. Please try again.');
      }
      pushGeneration(data.output, data.messages, undefined);
      setCurrentOutput(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isDisabled}
        className={`
          w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2
          border-2 transition-all duration-200
          ${
            isDisabled
              ? 'bg-muted/20 border-border/30 cursor-not-allowed opacity-50'
              : 'bg-primary/20 border-primary/50 hover:bg-primary/30 hover:border-primary hover:scale-105 active:scale-95'
          }
        `}
      >
        {isGenerating ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : (
          <>
            <Play className="w-8 h-8 text-primary" />
            <span className="text-xs font-medium text-primary">Generate</span>
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground text-center max-w-[120px]">
        {isGenerating ? 'Working...' : 'Click to generate sprint plan'}
      </p>
    </div>
  );
}
