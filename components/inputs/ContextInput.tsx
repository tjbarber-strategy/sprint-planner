'use client';

import { useSprintStore } from '@/store/sprint-store';
import { Textarea } from '@/components/ui/textarea';

export function ContextInput() {
  const { inputs, setContext } = useSprintStore();

  return (
    <div>
      <Textarea
        placeholder="Include any additional context that might help generate a better sprint plan. For example:
• Current campaign performance insights
• Seasonal considerations or upcoming events
• Client preferences or restrictions
• Recent creative learnings or insights"
        value={inputs.additionalContext || ''}
        onChange={(e) => setContext(e.target.value)}
        className="bg-secondary/50 border-border/50 min-h-[120px] text-sm resize-none"
      />
      <p className="text-xs text-muted-foreground mt-2">
        This context will be included in the AI prompt to improve plan quality.
      </p>
    </div>
  );
}
