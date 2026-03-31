'use client';

import { useSprintStore } from '@/store/sprint-store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BREAKDOWN_OPTIONS } from '@/lib/constants';
import { BreakdownType } from '@/lib/types';

export function SprintConfigForm() {
  const { config, setConfig, generatePlan, isGenerating, error } = useSprintStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generatePlan();
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="icon-container blue">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sprint Configuration</h2>
          <p className="text-xs text-muted-foreground">Configure your sprint parameters</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="sprintName" className="section-header">
            Sprint Name
          </label>
          <Input
            id="sprintName"
            placeholder="Sprint 42 - User Authentication"
            value={config.sprintName}
            onChange={(e) => setConfig({ sprintName: e.target.value })}
            className="bg-input border-border focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="sprintGoal" className="section-header">
            Sprint Goal
          </label>
          <Textarea
            id="sprintGoal"
            placeholder="Implement complete user authentication flow including login, registration, and password reset..."
            value={config.sprintGoal}
            onChange={(e) => setConfig({ sprintGoal: e.target.value })}
            rows={3}
            className="bg-input border-border focus:border-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="teamSize" className="section-header">
              Team Size
            </label>
            <Input
              id="teamSize"
              type="number"
              min={1}
              max={20}
              value={config.teamSize}
              onChange={(e) => setConfig({ teamSize: parseInt(e.target.value) || 1 })}
              className="bg-input border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sprintDuration" className="section-header">
              Duration (days)
            </label>
            <Input
              id="sprintDuration"
              type="number"
              min={1}
              max={30}
              value={config.sprintDurationDays}
              onChange={(e) =>
                setConfig({ sprintDurationDays: parseInt(e.target.value) || 1 })
              }
              className="bg-input border-border focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="hoursPerDay" className="section-header">
              Hours/Day
            </label>
            <Input
              id="hoursPerDay"
              type="number"
              min={1}
              max={12}
              value={config.hoursPerDay}
              onChange={(e) => setConfig({ hoursPerDay: parseInt(e.target.value) || 1 })}
              className="bg-input border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="velocityPoints" className="section-header">
              Target Points
            </label>
            <Input
              id="velocityPoints"
              type="number"
              min={1}
              max={200}
              value={config.velocityPoints}
              onChange={(e) =>
                setConfig({ velocityPoints: parseInt(e.target.value) || 1 })
              }
              className="bg-input border-border focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="breakdownType" className="section-header">
            Breakdown Type
          </label>
          <Select
            value={config.breakdownType}
            onValueChange={(value: BreakdownType) => setConfig({ breakdownType: value })}
          >
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select breakdown type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {BREAKDOWN_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.breakdownType === 'custom' && (
          <div className="space-y-2">
            <label htmlFor="customBreakdown" className="section-header">
              Custom Breakdown Instructions
            </label>
            <Textarea
              id="customBreakdown"
              placeholder="Describe how you want the tasks to be broken down..."
              value={config.customBreakdown}
              onChange={(e) => setConfig({ customBreakdown: e.target.value })}
              rows={2}
              className="bg-input border-border focus:border-primary resize-none"
            />
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="additionalContext" className="section-header">
            Additional Context (optional)
          </label>
          <Textarea
            id="additionalContext"
            placeholder="Any additional requirements, constraints, or context..."
            value={config.additionalContext}
            onChange={(e) => setConfig({ additionalContext: e.target.value })}
            rows={2}
            className="bg-input border-border focus:border-primary resize-none"
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating Plan...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Sprint Plan
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
