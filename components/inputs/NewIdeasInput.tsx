'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { BreakdownTypes } from '@/lib/types';

interface CriticalBreakdownColumn {
  key: keyof BreakdownTypes;
  displayName: string;
  options: string[];
}

export function NewIdeasInput() {
  const { inputs, addNewIdea, updateNewIdea, removeNewIdea } = useSprintStore();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Get critical breakdowns for dropdown columns
  const criticalBreakdowns: CriticalBreakdownColumn[] = Object.entries(inputs.breakdowns)
    .filter(([_, config]) => config.priority === 'critical')
    .map(([key, config]) => ({
      key: key as keyof BreakdownTypes,
      displayName: config.displayName,
      options: config.options as string[],
    }));

  const handleAddIdea = () => {
    if (!newName.trim()) return;

    addNewIdea({
      id: `idea-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
      breakdowns: {},
    });

    setNewName('');
    setNewDescription('');
  };

  const handleBreakdownChange = (
    ideaId: string,
    breakdownKey: keyof BreakdownTypes,
    value: string
  ) => {
    const idea = inputs.newIdeas.find((i) => i.id === ideaId);
    if (!idea) return;

    updateNewIdea(ideaId, {
      breakdowns: {
        ...idea.breakdowns,
        [breakdownKey]: value === 'none' ? undefined : value,
      },
    });
  };

  // Calculate minimum width needed for the table
  const tableMinWidth = 180 + 280 + (criticalBreakdowns.length * 130) + 40 + (criticalBreakdowns.length * 12) + 24;

  return (
    <div className="space-y-3">
      {/* Ideas Table */}
      {inputs.newIdeas.length > 0 && (
        <div className="border border-border/30 rounded-lg overflow-hidden">
          {/* Scrollable container */}
          <div className="overflow-x-auto scrollbar-thin">
            <div style={{ minWidth: `${tableMinWidth}px` }}>
              {/* Table Header */}
              <div className="bg-secondary/50 border-b border-border/30 px-3 py-2">
                <div className="grid gap-3" style={{
                  gridTemplateColumns: `180px 280px ${criticalBreakdowns.map(() => '130px').join(' ')} 40px`
                }}>
                  <span className="text-xs font-medium text-muted-foreground">Name</span>
                  <span className="text-xs font-medium text-muted-foreground">Description</span>
                  {criticalBreakdowns.map((breakdown) => (
                    <span key={breakdown.key} className="text-xs font-medium text-muted-foreground truncate">
                      {breakdown.displayName}
                    </span>
                  ))}
                  <span></span>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border/20">
                {inputs.newIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="px-3 py-2 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="grid gap-3 items-center" style={{
                      gridTemplateColumns: `180px 280px ${criticalBreakdowns.map(() => '130px').join(' ')} 40px`
                    }}>
                  {/* Name */}
                  <Input
                    value={idea.name}
                    onChange={(e) => updateNewIdea(idea.id, { name: e.target.value })}
                    className="h-7 text-xs bg-transparent border-border/30 focus:border-primary/50"
                    placeholder="Name..."
                  />

                  {/* Description */}
                  <Input
                    value={idea.description}
                    onChange={(e) => updateNewIdea(idea.id, { description: e.target.value })}
                    className="h-7 text-xs bg-transparent border-border/30 focus:border-primary/50"
                    placeholder="Description..."
                  />

                  {/* Breakdown Dropdowns */}
                  {criticalBreakdowns.map((breakdown) => (
                    <Select
                      key={breakdown.key}
                      value={idea.breakdowns[breakdown.key] || 'none'}
                      onValueChange={(value) =>
                        handleBreakdownChange(idea.id, breakdown.key, value)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs bg-transparent border-border/30 focus:border-primary/50">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          — None —
                        </SelectItem>
                        {breakdown.options.map((option) => (
                          <SelectItem key={option} value={option} className="text-xs">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeNewIdea(idea.id)}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Row */}
      <div className="border border-dashed border-border/50 rounded-lg p-4 hover:border-primary/30 transition-colors">
        <div className="grid gap-3 items-center" style={{
          gridTemplateColumns: `180px 1fr 90px`
        }}>
          <Input
            placeholder="Idea name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9 text-sm bg-secondary/30 border-border/30"
          />
          <Input
            placeholder="Brief description of the creative idea..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddIdea()}
            className="h-9 text-sm bg-secondary/30 border-border/30"
          />
          <Button
            type="button"
            onClick={handleAddIdea}
            disabled={!newName.trim()}
            size="sm"
            className="h-9"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Add the idea first, then select breakdown values in the table above.
        </p>
      </div>

      {inputs.newIdeas.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Add ideas to include specific concepts in the sprint plan.
        </p>
      )}
    </div>
  );
}
