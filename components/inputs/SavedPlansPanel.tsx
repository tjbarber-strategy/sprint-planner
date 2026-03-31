'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function SavedPlansPanel() {
  const { savedPlans, currentPlan, savePlan, loadPlan, deletePlan } = useSprintStore();
  const [saveName, setSaveName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = () => {
    if (saveName.trim()) {
      savePlan(saveName.trim());
      setSaveName('');
      setIsDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="icon-container purple">
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <h2 className="section-header m-0">Saved Plans</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!currentPlan}
              className="border-border/50 hover:bg-primary/10 hover:border-primary/50"
            >
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-foreground">Save Sprint Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="planName" className="section-header">
                  Plan Name
                </label>
                <Input
                  id="planName"
                  placeholder="My Sprint Plan"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="bg-input border-border focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-border/50 hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {savedPlans.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border/50 rounded-lg">
          <svg
            className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            No saved plans yet. Generate a plan and save it for later.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
          {savedPlans.map((saved) => (
            <div
              key={saved.id}
              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{saved.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(saved.savedAt)} · {saved.plan.tasks.length} tasks
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPlan(saved.id)}
                  className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  Load
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePlan(saved.id)}
                  className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
