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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { SprintRule, RuleConditionType, BreakdownTypes } from '@/lib/types';

const RULE_TYPES: { value: RuleConditionType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'minimum', label: 'Minimum' },
  { value: 'maximum', label: 'Maximum' },
];

const BREAKDOWN_OPTIONS: { value: keyof BreakdownTypes; label: string }[] = [
  { value: 'jobType', label: 'Job Type' },
  { value: 'platform', label: 'Platform' },
  { value: 'product', label: 'Product' },
  { value: 'productCategory', label: 'Product Category' },
  { value: 'visualFormat', label: 'Visual Format' },
  { value: 'motivator', label: 'Motivator' },
  { value: 'buyerFunnelStage', label: 'Buyer Funnel Stage' },
];

function RuleCard({ rule }: { rule: SprintRule }) {
  const { toggleRule, removeRule } = useSprintStore();

  const getTypeBadge = (type: RuleConditionType) => {
    const colors: Record<RuleConditionType, string> = {
      percentage: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      minimum: 'bg-green-500/20 text-green-400 border-green-500/30',
      maximum: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      conditional: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colors[type];
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        rule.active
          ? 'bg-secondary/30 border-border/50'
          : 'bg-secondary/10 border-border/20 opacity-60'
      }`}
    >
      {/* Toggle Switch */}
      <button
        onClick={() => toggleRule(rule.id)}
        className={`w-8 h-5 rounded-full transition-colors relative ${
          rule.active ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            rule.active ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </button>

      {/* Description */}
      <span className="flex-1 text-sm">{rule.description}</span>

      {/* Type Badge */}
      <span
        className={`text-[10px] px-1.5 py-0.5 border rounded ${getTypeBadge(
          rule.condition.type
        )}`}
      >
        {rule.condition.type}
      </span>

      {/* Delete Button */}
      <button
        onClick={() => removeRule(rule.id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function RulesBuilder() {
  const { inputs, addRule } = useSprintStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<RuleConditionType>('percentage');
  const [value, setValue] = useState('');
  const [breakdownType, setBreakdownType] = useState<keyof BreakdownTypes>('platform');

  const handleSave = () => {
    if (!description.trim() || !value) return;

    const newRule: SprintRule = {
      id: `rule-${Date.now()}`,
      description: description.trim(),
      breakdownType,
      condition: {
        type: ruleType,
        value: parseInt(value),
      },
      active: true,
    };

    addRule(newRule);
    setDescription('');
    setValue('');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      {inputs.rules.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border/50 rounded-lg">
          No rules added yet. Add rules to customize the sprint plan generation.
        </p>
      ) : (
        <div className="space-y-2">
          {inputs.rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-border/50 hover:bg-primary/10 hover:border-primary/50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Description */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Description
              </label>
              <Input
                placeholder="e.g., At least 40% of jobs should be Meta platform"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>

            {/* Breakdown Type */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Breakdown
              </label>
              <Select value={breakdownType} onValueChange={(v) => setBreakdownType(v as keyof BreakdownTypes)}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {BREAKDOWN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rule Type */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Rule Type
              </label>
              <Select value={ruleType} onValueChange={(v) => setRuleType(v as RuleConditionType)}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {RULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Value {ruleType === 'percentage' && '(%)'}
              </label>
              <Input
                type="number"
                placeholder={ruleType === 'percentage' ? '40' : '5'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-border/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!description.trim() || !value}
                className="bg-primary hover:bg-primary/90"
              >
                Save Rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
