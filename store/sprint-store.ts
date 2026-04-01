import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import {
  SprintInputs,
  SprintOutput,
  JobSlot,
  HistoryEntry,
  Generation,
  VolumeConfig,
  ClientConfig,
  BreakdownTypes,
  BreakdownPriority,
  SprintRule,
  NewIdea,
  RoadmapExtraction,
  DEFAULT_BREAKDOWNS,
  // Legacy types for backwards compatibility
  SprintConfig,
  SprintPlan,
  SprintTask,
  SavedPlan,
} from '@/lib/types';

// ===========================================
// Store Interface
// ===========================================

interface SprintStore {
  // State
  inputs: SprintInputs;
  currentOutput: SprintOutput | null;

  // Generations (feedback carousel)
  generations: Generation[];
  currentGenerationIndex: number;
  conversationMessages: MessageParam[][]; // in-memory only, parallel to generations
  isRegenerating: boolean;
  pushGeneration: (output: SprintOutput, messages: MessageParam[], feedbackUsed?: string) => void;
  navigateGeneration: (index: number) => void;
  regenerateWithFeedback: (feedback: string) => Promise<void>;
  history: HistoryEntry[];
  isGenerating: boolean;
  error: string | null;
  roadmapData: RoadmapExtraction | null;
  isParsingRoadmap: boolean;

  // Input Actions - Client
  setClient: (client: ClientConfig) => void;

  // Input Actions - Volume
  setVolume: (volume: VolumeConfig) => void;

  // Input Actions - Breakdowns
  setBreakdownPriority: (breakdown: keyof BreakdownTypes, priority: BreakdownPriority) => void;
  setBreakdownOptions: (breakdown: keyof BreakdownTypes, options: string[]) => void;
  setBreakdownTargets: (breakdown: keyof BreakdownTypes, targets: Record<string, number>) => void;

  // Input Actions - Rules
  addRule: (rule: SprintRule) => void;
  updateRule: (id: string, rule: Partial<SprintRule>) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;

  // Input Actions - New Ideas
  addNewIdea: (idea: NewIdea) => void;
  updateNewIdea: (id: string, idea: Partial<NewIdea>) => void;
  removeNewIdea: (id: string) => void;

  // Input Actions - Context
  setContext: (context: string) => void;
  resetInputs: () => void;

  // Output Actions
  setCurrentOutput: (output: SprintOutput) => void;
  clearOutput: () => void;

  // History Actions
  addToHistory: (output: SprintOutput, inputs: SprintInputs) => void;
  loadFromHistory: (id: string) => void;
  clearHistory: () => void;

  // UI Actions
  setIsGenerating: (val: boolean) => void;
  setError: (error: string | null) => void;

  // Finalization
  isFinalized: boolean;
  setFinalized: (val: boolean) => void;
  updateJobInOutput: (slotNumber: number, updates: Partial<JobSlot>) => void;

  // Roadmap Actions
  setRoadmapData: (data: RoadmapExtraction | null) => void;
  setIsParsingRoadmap: (val: boolean) => void;
  applyRoadmapToInputs: (roadmapOverride?: RoadmapExtraction) => void;
  clearRoadmapData: () => void;

  // Legacy support
  config: SprintConfig;
  setConfig: (config: Partial<SprintConfig>) => void;
  resetConfig: () => void;
  currentPlan: SprintPlan | null;
  setCurrentPlan: (plan: SprintPlan | null) => void;
  updateTask: (taskId: string, updates: Partial<SprintTask>) => void;
  addTask: (task: SprintTask) => void;
  removeTask: (taskId: string) => void;
  savedPlans: SavedPlan[];
  savePlan: (name: string) => void;
  loadPlan: (id: string) => void;
  deletePlan: (id: string) => void;
  generatePlan: () => Promise<void>;
}

// ===========================================
// Default Values
// ===========================================

const DEFAULT_INPUTS: SprintInputs = {
  client: {
    clientName: '',
  },
  volume: {
    totalJobs: 10,
    explorePercentage: 50,
    netNewPercentage: 50, // 50% Net New (Adapt/New), 50% Horizontal Scaling (Upgrade)
    timeline: 'weekly',
    timelineCount: 1,
  },
  breakdowns: DEFAULT_BREAKDOWNS,
  rules: [],
  newIdeas: [],
  additionalContext: '',
};

const DEFAULT_SPRINT_CONFIG: SprintConfig = {
  sprintName: '',
  sprintGoal: '',
  teamSize: 5,
  sprintDurationDays: 10,
  hoursPerDay: 6,
  velocityPoints: 40,
  breakdownType: 'feature-based',
  customBreakdown: '',
  additionalContext: '',
};

const MAX_HISTORY_ENTRIES = 10;

// ===========================================
// Store Implementation
// ===========================================

export const useSprintStore = create<SprintStore>()(
  persist(
    (set, get) => ({
      // ===========================================
      // State
      // ===========================================
      inputs: DEFAULT_INPUTS,
      currentOutput: null,
      history: [],
      isGenerating: false,
      error: null,
      roadmapData: null,
      isParsingRoadmap: false,
      isFinalized: false,

      // Generations
      generations: [],
      currentGenerationIndex: -1,
      conversationMessages: [],
      isRegenerating: false,

      pushGeneration: (output, messages, feedbackUsed) =>
        set((state) => {
          const newGen: Generation = {
            id: `gen-${Date.now()}`,
            output,
            feedbackUsed,
            createdAt: new Date().toISOString(),
          };
          // Slice off any forward history if we're not at the end
          const baseGens = state.generations.slice(0, state.currentGenerationIndex + 1);
          const baseMsgs = state.conversationMessages.slice(0, state.currentGenerationIndex + 1);
          const newGens = [...baseGens, newGen].slice(-10);
          const newMsgs = [...baseMsgs, messages].slice(-10);
          const newIndex = newGens.length - 1;
          return {
            generations: newGens,
            conversationMessages: newMsgs,
            currentGenerationIndex: newIndex,
            currentOutput: output,
          };
        }),

      navigateGeneration: (index) =>
        set((state) => {
          const gen = state.generations[index];
          if (!gen) return state;
          return {
            currentGenerationIndex: index,
            currentOutput: gen.output,
            isFinalized: false,
          };
        }),

      regenerateWithFeedback: async (feedback) => {
        const state = get();
        const currentMessages = state.conversationMessages[state.currentGenerationIndex];
        if (!currentMessages) return;

        set({ isRegenerating: true, error: null });
        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: currentMessages, feedback }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to regenerate sprint plan');
          }

          const data = await response.json();
          get().pushGeneration(
            data.output,
            data.messages,
            feedback.length > 60 ? feedback.slice(0, 60) + '…' : feedback
          );
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'An error occurred' });
        } finally {
          set({ isRegenerating: false });
        }
      },

      // ===========================================
      // Input Actions - Client
      // ===========================================
      setClient: (client) =>
        set((state) => ({
          inputs: { ...state.inputs, client },
        })),

      // ===========================================
      // Input Actions - Volume
      // ===========================================
      setVolume: (volume) =>
        set((state) => ({
          inputs: { ...state.inputs, volume },
        })),

      // ===========================================
      // Input Actions - Breakdowns
      // ===========================================
      setBreakdownPriority: (breakdown, priority) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            breakdowns: {
              ...state.inputs.breakdowns,
              [breakdown]: {
                ...state.inputs.breakdowns[breakdown],
                priority,
              },
            },
          },
        })),

      setBreakdownOptions: (breakdown, options) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            breakdowns: {
              ...state.inputs.breakdowns,
              [breakdown]: {
                ...state.inputs.breakdowns[breakdown],
                options,
              },
            },
          },
        })),

      setBreakdownTargets: (breakdown, targets) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            breakdowns: {
              ...state.inputs.breakdowns,
              [breakdown]: {
                ...state.inputs.breakdowns[breakdown],
                targetDistribution: targets,
              },
            },
          },
        })),

      // ===========================================
      // Input Actions - Rules
      // ===========================================
      addRule: (rule) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            rules: [...state.inputs.rules, rule],
          },
        })),

      updateRule: (id, ruleUpdates) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            rules: state.inputs.rules.map((rule) =>
              rule.id === id ? { ...rule, ...ruleUpdates } : rule
            ),
          },
        })),

      removeRule: (id) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            rules: state.inputs.rules.filter((rule) => rule.id !== id),
          },
        })),

      toggleRule: (id) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            rules: state.inputs.rules.map((rule) =>
              rule.id === id ? { ...rule, active: !rule.active } : rule
            ),
          },
        })),

      // ===========================================
      // Input Actions - New Ideas
      // ===========================================
      addNewIdea: (idea) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            newIdeas: [...state.inputs.newIdeas, idea],
          },
        })),

      updateNewIdea: (id, ideaUpdates) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            newIdeas: state.inputs.newIdeas.map((idea) =>
              idea.id === id ? { ...idea, ...ideaUpdates } : idea
            ),
          },
        })),

      removeNewIdea: (id) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            newIdeas: state.inputs.newIdeas.filter((idea) => idea.id !== id),
          },
        })),

      // ===========================================
      // Input Actions - Context & Reset
      // ===========================================
      setContext: (context) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            additionalContext: context,
          },
        })),

      resetInputs: () =>
        set({
          inputs: DEFAULT_INPUTS,
          currentOutput: null,
          error: null,
        }),

      // ===========================================
      // Output Actions
      // ===========================================
      setCurrentOutput: (output) =>
        set({ currentOutput: output, isFinalized: false }),

      clearOutput: () =>
        set({
          currentOutput: null,
          isFinalized: false,
          generations: [],
          currentGenerationIndex: -1,
          conversationMessages: [],
        }),

      setFinalized: (val) => set({ isFinalized: val }),

      updateJobInOutput: (slotNumber, updates) =>
        set((state) => {
          if (!state.currentOutput) return state;
          return {
            currentOutput: {
              ...state.currentOutput,
              jobs: state.currentOutput.jobs.map((job) =>
                job.slotNumber === slotNumber
                  ? ({ ...job, ...updates } as JobSlot)
                  : job
              ),
            },
          };
        }),

      // ===========================================
      // History Actions
      // ===========================================
      addToHistory: (output, inputs) =>
        set((state) => {
          const entry: HistoryEntry = {
            id: `history-${Date.now()}`,
            createdAt: new Date().toISOString(),
            inputs,
            output,
          };
          const newHistory = [entry, ...state.history].slice(0, MAX_HISTORY_ENTRIES);
          return { history: newHistory };
        }),

      loadFromHistory: (id) =>
        set((state) => {
          const entry = state.history.find((h) => h.id === id);
          if (!entry) return state;
          return { currentOutput: entry.output, inputs: entry.inputs, isFinalized: true };
        }),

      clearHistory: () =>
        set({ history: [] }),

      // ===========================================
      // UI Actions
      // ===========================================
      setIsGenerating: (val) =>
        set({ isGenerating: val }),

      setError: (error) =>
        set({ error }),

      // ===========================================
      // Roadmap Actions
      // ===========================================
      setRoadmapData: (data) =>
        set({ roadmapData: data }),

      setIsParsingRoadmap: (val) =>
        set({ isParsingRoadmap: val }),

      clearRoadmapData: () =>
        set({ roadmapData: null }),

      applyRoadmapToInputs: (roadmapOverride?) =>
        set((state) => {
          const roadmap = roadmapOverride ?? state.roadmapData;
          if (!roadmap) return state;

          const newBreakdowns = { ...state.inputs.breakdowns };

          // Apply products if extracted
          if (roadmap.products.length > 0) {
            newBreakdowns.product = {
              ...newBreakdowns.product,
              options: roadmap.products,
              priority: 'critical',
            };
          }

          // Apply product categories if extracted
          if (roadmap.productCategories.length > 0) {
            newBreakdowns.productCategory = {
              ...newBreakdowns.productCategory,
              options: roadmap.productCategories,
              priority: 'ideal',
            };
          }

          // Apply motivators with target distributions based on spend percentages
          if (roadmap.motivators.length > 0) {
            const motivatorNames = roadmap.motivators.map((m) => m.name);
            const targetDistribution: Record<string, number> = {};

            // Calculate target distribution from spend percentages
            const motivatorsWithSpend = roadmap.motivators.filter((m) => m.spendPercentage !== undefined);
            if (motivatorsWithSpend.length > 0) {
              const totalSpend = motivatorsWithSpend.reduce((sum, m) => sum + (m.spendPercentage || 0), 0);
              for (const m of roadmap.motivators) {
                if (m.spendPercentage !== undefined && totalSpend > 0) {
                  targetDistribution[m.name] = m.spendPercentage / 100;
                }
              }
            }

            newBreakdowns.motivator = {
              ...newBreakdowns.motivator,
              options: motivatorNames,
              priority: 'critical',
              targetDistribution: Object.keys(targetDistribution).length > 0 ? targetDistribution : undefined,
            };
          }

          // Apply visual formats (merge with existing, prioritize extracted ones)
          if (roadmap.visualFormats.length > 0) {
            const extractedFormats = roadmap.visualFormats.map((f) => f.name);
            const existingFormats = newBreakdowns.visualFormat.options;
            const combinedFormats = [...new Set([...extractedFormats, ...existingFormats])];

            newBreakdowns.visualFormat = {
              ...newBreakdowns.visualFormat,
              options: combinedFormats,
              priority: 'ideal',
            };
          }

          // Build additional context from roadmap data
          const contextParts: string[] = [];

          // Add suggested context
          if (roadmap.suggestedContext) {
            contextParts.push(roadmap.suggestedContext);
          }

          // Add gaps as explore opportunities
          if (roadmap.gaps.length > 0) {
            const gapsText = roadmap.gaps
              .map((g) => `- [${g.category.toUpperCase()}] ${g.issue}: ${g.actionItem}`)
              .join('\n');
            contextParts.push(`\nKEY GAPS TO ADDRESS:\n${gapsText}`);
          }

          // Add competitor insights
          if (roadmap.competitorInsights.length > 0) {
            const competitorText = roadmap.competitorInsights.map((c) => `- ${c}`).join('\n');
            contextParts.push(`\nCOMPETITOR TACTICS TO ADAPT:\n${competitorText}`);
          }

          // Add client priorities
          if (roadmap.clientPriorities.length > 0) {
            const prioritiesText = roadmap.clientPriorities.map((p) => `- ${p}`).join('\n');
            contextParts.push(`\nCLIENT PRIORITIES:\n${prioritiesText}`);
          }

          // Add funnel insights
          if (roadmap.funnelInsights.notes) {
            contextParts.push(`\nFUNNEL INSIGHTS: ${roadmap.funnelInsights.notes}`);
          }

          const newContext = contextParts.join('\n');

          // Create rules from suggested rules
          const newRules: SprintRule[] = [
            ...state.inputs.rules,
            ...roadmap.suggestedRules.map((r, index) => ({
              id: `roadmap-rule-${Date.now()}-${index}`,
              description: r.description,
              breakdownType: r.breakdownType,
              condition: {
                type: r.type as 'percentage' | 'minimum',
                value: r.value,
              },
              active: true,
            })),
          ];

          return {
            inputs: {
              ...state.inputs,
              client: roadmap.clientName
                ? { clientName: roadmap.clientName }
                : state.inputs.client,
              breakdowns: newBreakdowns,
              rules: newRules,
              additionalContext: state.inputs.additionalContext
                ? `${state.inputs.additionalContext}\n\n--- FROM ROADMAP ---\n${newContext}`
                : newContext,
            },
          };
        }),

      // ===========================================
      // Legacy Support
      // ===========================================
      config: DEFAULT_SPRINT_CONFIG,
      setConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),
      resetConfig: () => set({ config: DEFAULT_SPRINT_CONFIG }),

      currentPlan: null,
      setCurrentPlan: (plan) => set({ currentPlan: plan }),

      updateTask: (taskId, updates) =>
        set((state) => {
          if (!state.currentPlan) return state;
          const tasks = state.currentPlan.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          );
          const totalPoints = tasks.reduce((sum, t) => sum + t.storyPoints, 0);
          return {
            currentPlan: {
              ...state.currentPlan,
              tasks,
              totalPoints,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      addTask: (task) =>
        set((state) => {
          if (!state.currentPlan) return state;
          const tasks = [...state.currentPlan.tasks, task];
          const totalPoints = tasks.reduce((sum, t) => sum + t.storyPoints, 0);
          return {
            currentPlan: {
              ...state.currentPlan,
              tasks,
              totalPoints,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      removeTask: (taskId) =>
        set((state) => {
          if (!state.currentPlan) return state;
          const tasks = state.currentPlan.tasks.filter((t) => t.id !== taskId);
          const totalPoints = tasks.reduce((sum, t) => sum + t.storyPoints, 0);
          return {
            currentPlan: {
              ...state.currentPlan,
              tasks,
              totalPoints,
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      savedPlans: [],
      savePlan: (name) =>
        set((state) => {
          if (!state.currentPlan) return state;
          const savedPlan: SavedPlan = {
            id: `saved-${Date.now()}`,
            name,
            plan: state.currentPlan,
            savedAt: new Date().toISOString(),
          };
          return {
            savedPlans: [...state.savedPlans, savedPlan],
          };
        }),

      loadPlan: (id) =>
        set((state) => {
          const saved = state.savedPlans.find((p) => p.id === id);
          if (!saved) return state;
          return {
            currentPlan: saved.plan,
            config: saved.plan.config,
          };
        }),

      deletePlan: (id) =>
        set((state) => ({
          savedPlans: state.savedPlans.filter((p) => p.id !== id),
        })),

      generatePlan: async () => {
        const { config, setIsGenerating, setError, setCurrentPlan } = get();

        if (!config.sprintName || !config.sprintGoal) {
          setError('Please provide a sprint name and goal');
          return;
        }

        setIsGenerating(true);
        setError(null);

        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate plan');
          }

          const data = await response.json();
          setCurrentPlan(data.plan);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsGenerating(false);
        }
      },
    }),
    {
      name: 'sprint-planner-storage',
      partialize: (state) => ({
        inputs: state.inputs,
        history: state.history,
        savedPlans: state.savedPlans,
        config: state.config,
        generations: state.generations,
        currentGenerationIndex: state.currentGenerationIndex,
        currentOutput: state.currentOutput,
      }),
      skipHydration: true,
    }
  )
);
