'use client';

import { useState } from 'react';
import { useSprintStore } from '@/store/sprint-store';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, FileText, Settings2 } from 'lucide-react';
import { BreakdownTypes, SprintRule } from '@/lib/types';

const BREAKDOWN_CATEGORIES: { value: keyof BreakdownTypes | 'other'; label: string }[] = [
  { value: 'jobType', label: 'Job Type' },
  { value: 'platform', label: 'Platform' },
  { value: 'product', label: 'Product' },
  { value: 'productCategory', label: 'Product Category' },
  { value: 'visualFormat', label: 'Visual Format' },
  { value: 'motivator', label: 'Motivator' },
  { value: 'buyerFunnelStage', label: 'Buyer Funnel Stage' },
  { value: 'keyPersona', label: 'Key Persona' },
  { value: 'other', label: 'Other (custom)' },
];

const CATEGORY_LABELS: Partial<Record<keyof BreakdownTypes, string>> = {
  jobType: 'Job Type',
  platform: 'Platform',
  product: 'Product',
  productCategory: 'Product Category',
  visualFormat: 'Visual Format',
  motivator: 'Motivator',
  buyerFunnelStage: 'Buyer Funnel Stage',
  keyPersona: 'Key Persona',
};

type Mode = 'roadmap' | 'manual';

const tabStyle = (active: boolean): React.CSSProperties =>
  active
    ? {
        backgroundColor: 'hsl(160, 84%, 39%)',
        color: 'white',
        border: '2px solid hsl(160, 84%, 39%)',
      }
    : {
        backgroundColor: 'transparent',
        color: 'hsl(215, 20%, 55%)',
        border: '2px solid hsl(222, 30%, 20%)',
      };

function getCategoryDisplay(rule: SprintRule): string {
  if (rule.breakdownType === 'other') return rule.customLabel || 'Other';
  return CATEGORY_LABELS[rule.breakdownType as keyof BreakdownTypes] ?? rule.breakdownType;
}

export function BreakdownSelector() {
  const { inputs, addRule, updateRule, removeRule, roadmapData, applyRoadmapToInputs, setBreakdownPriority } =
    useSprintStore();

  const [mode, setMode] = useState<Mode>(roadmapData ? 'roadmap' : 'manual');
  const [newCategory, setNewCategory] = useState<keyof BreakdownTypes | 'other'>('platform');
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newText, setNewText] = useState('');
  const [newTextFocused, setNewTextFocused] = useState(false);

  const handleAddRule = () => {
    if (!newText.trim()) return;
    if (newCategory === 'other' && !newCustomLabel.trim()) return;
    const rule: SprintRule = {
      id: `rule-${Date.now()}`,
      description: newText.trim(),
      breakdownType: newCategory,
      customLabel: newCategory === 'other' ? newCustomLabel.trim() : undefined,
      condition: { type: 'percentage' },
      freeformText: newText.trim(),
      active: true,
    };
    addRule(rule);
    setNewText('');
    setNewCustomLabel('');
  };

  const getRuleText = (rule: SprintRule) => rule.freeformText ?? rule.description;

  const handleTextChange = (id: string, text: string) => {
    updateRule(id, { description: text, freeformText: text });
  };

  const handleCategoryChange = (id: string, value: string) => {
    const updates: Partial<SprintRule> = {
      breakdownType: value as keyof BreakdownTypes | 'other',
    };
    if (value !== 'other') updates.customLabel = undefined;
    updateRule(id, updates);
  };

  const isAddDisabled =
    !newText.trim() || (newCategory === 'other' && !newCustomLabel.trim());

  return (
    <div className="space-y-3">
      {/* Auto Breakdown Categories */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Auto-generated categories — click to toggle on/off:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(inputs.breakdowns) as [keyof BreakdownTypes, typeof inputs.breakdowns[keyof BreakdownTypes]][]).map(([key, config]) => {
            const isActive = config.priority !== 'not_needed';
            return (
              <button
                key={key}
                type="button"
                onClick={() => setBreakdownPriority(key, isActive ? 'not_needed' : 'ideal')}
                className="px-2.5 py-1 text-xs rounded-md border transition-colors"
                style={
                  isActive
                    ? {
                        backgroundColor: 'hsl(160, 84%, 39%, 0.15)',
                        borderColor: 'hsl(160, 84%, 39%, 0.4)',
                        color: 'hsl(160, 84%, 55%)',
                      }
                    : {
                        backgroundColor: 'transparent',
                        borderColor: 'hsl(222, 30%, 20%)',
                        color: 'hsl(215, 20%, 40%)',
                        textDecoration: 'line-through',
                      }
                }
              >
                {config.displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('roadmap')}
          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
          style={tabStyle(mode === 'roadmap')}
        >
          <FileText className="w-3.5 h-3.5" />
          From Roadmap
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
          style={tabStyle(mode === 'manual')}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Manual
        </button>
      </div>

      {/* From Roadmap banner */}
      {mode === 'roadmap' && !roadmapData && (
        <p className="text-xs text-muted-foreground text-center py-3 border border-border/30 rounded-lg">
          Parse a roadmap above to auto-fill sprint rules.
        </p>
      )}

      {mode === 'roadmap' && roadmapData && (
        <button
          type="button"
          onClick={() => applyRoadmapToInputs(roadmapData)}
          className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 transition-colors"
        >
          ↺ Re-apply roadmap rules
        </button>
      )}

      {/* Rule rows */}
      {(mode === 'manual' || roadmapData) && inputs.rules.length > 0 && (
        <div className="space-y-2">
          {inputs.rules.map((rule) => (
            <div key={rule.id} className="flex gap-2 items-start">
              {/* Category column */}
              <div className="w-[155px] flex-shrink-0 space-y-1">
                <Select
                  value={rule.breakdownType}
                  onValueChange={(v) => handleCategoryChange(rule.id, v)}
                >
                  <SelectTrigger className="w-full h-9 bg-secondary/30 border-border/40 text-xs">
                    <SelectValue>
                      {getCategoryDisplay(rule)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    {BREAKDOWN_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-xs">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rule.breakdownType === 'other' && (
                  <Input
                    value={rule.customLabel ?? ''}
                    onChange={(e) => updateRule(rule.id, { customLabel: e.target.value })}
                    placeholder="Category name..."
                    className="h-7 bg-secondary/30 border-border/40 text-xs"
                  />
                )}
              </div>

              {/* Freeform text */}
              <Textarea
                value={getRuleText(rule)}
                onChange={(e) => handleTextChange(rule.id, e.target.value)}
                placeholder="Describe the rule or constraint..."
                className="flex-1 bg-secondary/30 border-border/40 text-xs min-h-[60px] resize-none"
              />

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeRule(rule.id)}
                className="flex-shrink-0 mt-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new rule row */}
      <div className="border border-dashed border-border/50 rounded-lg p-3 space-y-2 hover:border-primary/30 transition-colors">
        <div className="flex gap-2 items-start">
          <div className="w-[155px] flex-shrink-0 space-y-1">
            <Select
              value={newCategory}
              onValueChange={(v) => {
                setNewCategory(v as keyof BreakdownTypes | 'other');
                if (v !== 'other') setNewCustomLabel('');
              }}
            >
              <SelectTrigger className="w-full h-9 bg-secondary/30 border-border/40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                {BREAKDOWN_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newCategory === 'other' && (
              <Input
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
                placeholder="Category name..."
                className="h-7 bg-secondary/30 border-border/40 text-xs"
              />
            )}
          </div>

          <Textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={newTextFocused ? '' : 'e.g. At least 40% Meta, 25% TikTok...'}
            className="flex-1 bg-secondary/30 border-border/40 text-xs min-h-[60px] resize-none placeholder:text-muted-foreground/40 placeholder:italic"
            onFocus={() => setNewTextFocused(true)}
            onBlur={() => setNewTextFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddRule();
              }
            }}
          />
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAddRule}
          disabled={isAddDisabled}
          className="w-full h-7 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Rule
        </Button>
      </div>
    </div>
  );
}
