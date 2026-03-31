'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SprintTask } from '@/lib/types';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, STORY_POINT_SCALE } from '@/lib/constants';

export function TasksTable() {
  const { currentPlan, updateTask, removeTask } = useSprintStore();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  if (!currentPlan) return null;

  const categories = ['all', ...new Set(currentPlan.tasks.map((t) => t.category))];

  const filteredTasks = currentPlan.tasks.filter((task) => {
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'badge-critical';
      case 'medium':
        return 'badge-explore';
      case 'low':
        return 'badge-ideal';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-muted text-muted-foreground border-border/50';
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="icon-container blue">
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
          <h2 className="section-header m-0">Tasks ({filteredTasks.length})</h2>
        </div>
        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] h-8 bg-input border-border/50 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/50">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[120px] h-8 bg-input border-border/50 text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/50">
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-[300px]">Task</th>
              <th>Category</th>
              <th className="text-center">Points</th>
              <th className="text-center">Priority</th>
              <th className="text-center">Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-left hover:text-primary transition-colors font-medium">
                        {task.title}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border/50 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">{task.title}</DialogTitle>
                      </DialogHeader>
                      <TaskDetailView task={task} />
                    </DialogContent>
                  </Dialog>
                  <p className="text-xs text-muted-foreground truncate max-w-[280px] mt-1">
                    {task.description}
                  </p>
                </td>
                <td>
                  <span className="text-xs px-2 py-1 bg-card border border-border/50 rounded-md">
                    {task.category}
                  </span>
                </td>
                <td className="text-center">
                  <Select
                    value={task.storyPoints.toString()}
                    onValueChange={(val) =>
                      updateTask(task.id, { storyPoints: parseInt(val) })
                    }
                  >
                    <SelectTrigger className="w-16 h-7 mx-auto bg-input border-border/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      {STORY_POINT_SCALE.map((point) => (
                        <SelectItem key={point} value={point.toString()}>
                          {point}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="text-center">
                  <Select
                    value={task.priority}
                    onValueChange={(val) =>
                      updateTask(task.id, {
                        priority: val as 'high' | 'medium' | 'low',
                      })
                    }
                  >
                    <SelectTrigger className="w-24 h-7 mx-auto bg-input border-border/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="text-center">
                  <Select
                    value={task.status}
                    onValueChange={(val) =>
                      updateTask(task.id, {
                        status: val as 'todo' | 'in-progress' | 'done',
                      })
                    }
                  >
                    <SelectTrigger className="w-28 h-7 mx-auto bg-input border-border/50 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => removeTask(task.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskDetailView({ task }: { task: SprintTask }) {
  return (
    <div className="space-y-6 pt-4">
      <div>
        <h4 className="section-header mb-2">Description</h4>
        <p className="text-sm text-muted-foreground">{task.description}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 bg-card/50 border border-border/30 rounded-lg">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Story Points</h4>
          <p className="text-lg font-semibold gradient-text">{task.storyPoints}</p>
        </div>
        <div className="p-3 bg-card/50 border border-border/30 rounded-lg">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Priority</h4>
          <p className="text-lg font-semibold capitalize text-foreground">{task.priority}</p>
        </div>
        <div className="p-3 bg-card/50 border border-border/30 rounded-lg">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</h4>
          <p className="text-lg font-semibold capitalize text-foreground">{task.status.replace('-', ' ')}</p>
        </div>
        <div className="p-3 bg-card/50 border border-border/30 rounded-lg">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Est. Hours</h4>
          <p className="text-lg font-semibold text-foreground">{task.estimatedHours || 'N/A'}</p>
        </div>
      </div>

      {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
        <div className="pt-4 border-t border-border/30">
          <h4 className="section-header mb-3">Acceptance Criteria</h4>
          <ul className="space-y-2">
            {task.acceptanceCriteria.map((criteria, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="text-green-400 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-muted-foreground">{criteria}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {task.dependencies && task.dependencies.length > 0 && (
        <div className="pt-4 border-t border-border/30">
          <h4 className="section-header mb-2">Dependencies</h4>
          <div className="flex flex-wrap gap-2">
            {task.dependencies.map((dep, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded-md"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
