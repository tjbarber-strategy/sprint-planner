'use client';

import { useSprintStore } from '@/store/sprint-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { History, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function HistoryNav() {
  const { history, currentOutput, loadFromHistory } = useSprintStore();

  if (history.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-secondary/50 border-border/50 hover:bg-secondary/70"
        >
          <History className="w-4 h-4 mr-2" />
          History
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded">
            {history.length}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-card border-border/50"
      >
        {history.map((entry) => {
          const isCurrent = currentOutput?.id === entry.output.id;
          const jobCount = entry.output.jobs.length;
          const clientName = entry.inputs?.client?.clientName;
          const timeAgo = formatDistanceToNow(new Date(entry.createdAt), {
            addSuffix: true,
          });

          return (
            <DropdownMenuItem
              key={entry.id}
              onClick={() => loadFromHistory(entry.id)}
              className={`flex items-center gap-3 cursor-pointer ${
                isCurrent ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {clientName || 'Unnamed Client'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {jobCount} jobs · {timeAgo}
                </p>
              </div>
              {isCurrent && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
