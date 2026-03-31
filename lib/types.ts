// Sprint Planner Types - Flawless by TubeScience

// ===========================================
// Core Type Definitions
// ===========================================

export type BreakdownPriority = 'critical' | 'ideal' | 'not_needed';

export type JobTypeCode = 'MORE' | 'UPGRADE' | 'ADAPT' | 'NEW' | 'FIX';

export type JobCategory = 'Explore' | 'Exploit';

export type ExploreSubcategory = 'Net New' | 'Horizontal Scaling';

// ===========================================
// Job Type Configuration
// ===========================================

export interface JobTypeConfigItem {
  label: string;
  category: JobCategory;
  exploreSubcategory?: ExploreSubcategory; // Only for Explore types
  defaultSubtype: string;
  hitRate: number;
  description: string;
}

export const JOB_TYPE_CONFIG: Record<JobTypeCode, JobTypeConfigItem> = {
  MORE: {
    label: 'More',
    category: 'Exploit',
    defaultSubtype: 'More1',
    hitRate: 0.45,
    description: 'Iterate on proven winner',
  },
  UPGRADE: {
    label: 'Upgrade',
    category: 'Explore',
    exploreSubcategory: 'Horizontal Scaling',
    defaultSubtype: 'Upgrade1',
    hitRate: 0.20,
    description: 'Horizontal scaling to new audience',
  },
  ADAPT: {
    label: 'Adapt',
    category: 'Explore',
    exploreSubcategory: 'Net New',
    defaultSubtype: 'Adapt2',
    hitRate: 0.20,
    description: 'Adapt from external source',
  },
  NEW: {
    label: 'New',
    category: 'Explore',
    exploreSubcategory: 'Net New',
    defaultSubtype: 'New1',
    hitRate: 0.20,
    description: 'Brand new concept',
  },
  FIX: {
    label: 'Fix',
    category: 'Exploit',
    defaultSubtype: 'Fix1',
    hitRate: 0.30,
    description: 'Fix underperformer',
  },
};

// ===========================================
// Breakdown Configuration
// ===========================================

export interface BreakdownConfig {
  name: string;
  displayName: string;
  priority: BreakdownPriority;
  options: string[];
  targetDistribution?: Record<string, number>;
  exportable: boolean;
  mondayColumnName?: string;
}

export interface BreakdownTypes {
  jobType: BreakdownConfig;
  platform: BreakdownConfig;
  product: BreakdownConfig;
  productCategory: BreakdownConfig;
  visualFormat: BreakdownConfig;
  motivator: BreakdownConfig;
  buyerFunnelStage: BreakdownConfig;
  keyPersona: BreakdownConfig;
}

export const DEFAULT_BREAKDOWNS: BreakdownTypes = {
  jobType: {
    name: 'jobType',
    displayName: 'Job Type',
    priority: 'critical',
    options: ['MORE', 'UPGRADE', 'ADAPT', 'NEW', 'FIX'],
    targetDistribution: {
      MORE: 0.30,
      UPGRADE: 0.20,
      ADAPT: 0.20,
      NEW: 0.15,
      FIX: 0.15,
    },
    exportable: true,
    mondayColumnName: 'Job Subtype',
  },
  platform: {
    name: 'platform',
    displayName: 'Platform',
    priority: 'critical',
    options: ['Meta', 'TikTok', 'YouTube', 'AppLovin', 'Pinterest', 'OTT'],
    targetDistribution: {
      Meta: 1.0,
    },
    exportable: true,
    mondayColumnName: 'Platform',
  },
  product: {
    name: 'product',
    displayName: 'Product',
    priority: 'critical',
    options: [],
    exportable: true,
    mondayColumnName: 'Products',
  },
  productCategory: {
    name: 'productCategory',
    displayName: 'Product Category',
    priority: 'ideal',
    options: [],
    exportable: true,
    mondayColumnName: 'Battleground/SKU',
  },
  visualFormat: {
    name: 'visualFormat',
    displayName: 'Visual Format',
    priority: 'ideal',
    options: [
      'MIXED',
      'Native Informational/Educational',
      'Native Broll "New"GC',
      'Documentary / Premium Informational',
      'Greenscreen UGC',
      'Expert UGC',
      'Traditional DTC UGC',
      'Ad Reaction UGC',
      'Social Post Frame',
      '"Wall of Text"',
      'Fake Conversation (iMessage, Slack etc…)',
      'Fake Tweet / Post / Article',
      'Hand-drawn Informational/UGC',
      'Hand-drawn Post-Its',
      'Notepad (Apple notes, eg)',
      'Quiz Walk-Thru',
      'Street Interview',
      'Podcast',
      'Skits (including Self Talk)',
      'Popins/Native Overlay (TikTok comment, Poll, etc..)',
      'Spokesperson/Expert/Founder UGC',
      'Multi-Ugc/ Review Montage',
      'Native Static (user generated feel)',
      'Branded "Billboard" Static',
      'Elevated GFX (Short Form)',
      'VisualASMR',
      'App or Product Walk Through / Visual Demo',
      'Unboxing',
      'OTHER/NEW',
      'Listicle',
      'Anti-Reasons',
      'Carousel',
      'AIDA',
      'Bouquet',
      'Storytime UGC',
      'IG Poll',
    ],
    exportable: true,
    mondayColumnName: 'Visual Formats',
  },
  motivator: {
    name: 'motivator',
    displayName: 'Motivator',
    priority: 'ideal',
    options: [],
    exportable: true,
    mondayColumnName: 'Swimlane',
  },
  buyerFunnelStage: {
    name: 'buyerFunnelStage',
    displayName: 'Buyer Funnel Stage',
    priority: 'ideal',
    options: ['Full Funnel', 'Top Funnel', 'Mid Funnel', 'Bottom Funnel'],
    targetDistribution: {
      'Full Funnel': 0.25,
      'Top Funnel': 0.25,
      'Mid Funnel': 0.25,
      'Bottom Funnel': 0.25,
    },
    exportable: true,
    mondayColumnName: 'Consideration Stage',
  },
  keyPersona: {
    name: 'keyPersona',
    displayName: 'Key Persona',
    priority: 'not_needed',
    options: [],
    exportable: false,
  },
};

// ===========================================
// Volume Configuration
// ===========================================

export type TimelineType = 'weekly' | 'monthly' | 'quarterly';

export interface VolumeConfig {
  totalJobs: number;
  explorePercentage: number;
  netNewPercentage: number; // Percentage of Explore that is Net New (Adapt/New) vs Horizontal Scaling (Upgrade)
  timeline: TimelineType;
}

// ===========================================
// Client Configuration
// ===========================================

export interface ClientConfig {
  clientName: string;
}

// ===========================================
// Sprint Rules & Conditions
// ===========================================

export type RuleConditionType = 'percentage' | 'minimum' | 'maximum' | 'conditional';

export interface RuleCondition {
  type: RuleConditionType;
  value?: number;
  targetOption?: string; // The specific option this rule applies to (e.g., "Meta" for Platform)
  targetValue?: number;
  ifBreakdown?: keyof BreakdownTypes;
  ifValue?: string;
  thenBreakdown?: keyof BreakdownTypes;
  thenValue?: string;
}

export interface SprintRule {
  id: string;
  description: string;
  breakdownType: keyof BreakdownTypes | 'other';
  customLabel?: string; // Used when breakdownType === 'other'
  condition: RuleCondition;
  freeformText?: string;
  active: boolean;
}

// ===========================================
// New Ideas
// ===========================================

export interface NewIdea {
  id: string;
  name: string;
  description: string;
  breakdowns: Partial<Record<keyof BreakdownTypes, string>>;
}

// ===========================================
// Sprint Inputs
// ===========================================

export interface SprintInputs {
  client: ClientConfig;
  volume: VolumeConfig;
  breakdowns: BreakdownTypes;
  rules: SprintRule[];
  newIdeas: NewIdea[];
  additionalContext?: string;
}

// ===========================================
// Job Slot & Output
// ===========================================

export interface JobSlot {
  slotNumber: number;
  jobType: JobTypeCode;
  jobCategory: JobCategory;
  [key: string]: string | number | JobTypeCode | JobCategory;
}

export interface ConstraintResult {
  rule: SprintRule;
  target: number;
  actual: number;
  met: boolean;
}

export interface SprintOutput {
  id: string;
  createdAt: string;
  jobs: JobSlot[];
  analysis: string;
  constraintsSummary: ConstraintResult[];
}

// ===========================================
// Generations (feedback carousel)
// ===========================================

export interface Generation {
  id: string;
  output: SprintOutput;
  feedbackUsed?: string; // "Initial" or first ~60 chars of feedback
  createdAt: string;
}

// ===========================================
// History
// ===========================================

export interface HistoryEntry {
  id: string;
  createdAt: string;
  inputs: SprintInputs;
  output: SprintOutput;
}

// ===========================================
// Legacy Types (for backwards compatibility)
// ===========================================

export type BreakdownType =
  | 'feature-based'
  | 'user-story'
  | 'technical-tasks'
  | 'epic-breakdown'
  | 'custom';

export interface SprintConfig {
  sprintName: string;
  sprintGoal: string;
  teamSize: number;
  sprintDurationDays: number;
  hoursPerDay: number;
  velocityPoints: number;
  breakdownType: BreakdownType;
  customBreakdown?: string;
  additionalContext?: string;
}

export interface SprintTask {
  id: string;
  title: string;
  description: string;
  storyPoints: number;
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  status: 'todo' | 'in-progress' | 'done';
  category: string;
  dependencies?: string[];
  acceptanceCriteria?: string[];
  estimatedHours?: number;
}

export interface SprintPlan {
  id: string;
  config: SprintConfig;
  tasks: SprintTask[];
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  summary: string;
  risks?: string[];
  assumptions?: string[];
}

export interface GenerateRequest {
  config: SprintConfig;
}

export interface GenerateResponse {
  plan: SprintPlan;
  error?: string;
}

export interface ExportRequest {
  plan: SprintPlan;
  format: 'csv' | 'excel';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  capacity: number;
}

export interface SavedPlan {
  id: string;
  name: string;
  plan: SprintPlan;
  savedAt: string;
}

// ===========================================
// Roadmap Extraction Types
// ===========================================

export interface RoadmapMotivator {
  name: string;
  spendPercentage?: number;
  isGap: boolean;
}

export interface RoadmapVisualFormat {
  name: string;
  isWinning: boolean;
  isGap: boolean;
}

export interface RoadmapGap {
  category: 'creative' | 'media' | 'workflow';
  issue: string;
  actionItem: string;
}

export interface RoadmapSuggestedRule {
  description: string;
  breakdownType: keyof BreakdownTypes;
  type: 'percentage' | 'minimum';
  value: number;
}

export interface RoadmapExtraction {
  // Client/account name
  clientName?: string;

  // Products mentioned (for Product breakdown)
  products: string[];

  // Product categories/battlegrounds
  productCategories: string[];

  // Motivators/RTBs/Swimlanes
  motivators: RoadmapMotivator[];

  // Visual formats mentioned
  visualFormats: RoadmapVisualFormat[];

  // Funnel stage insights
  funnelInsights: {
    dominantStage: string;
    notes: string;
  };

  // Key gaps to address (from Gaps Table)
  gaps: RoadmapGap[];

  // Competitor insights worth testing
  competitorInsights: string[];

  // Client priorities
  clientPriorities: string[];

  // Suggested sprint context (summary paragraph)
  suggestedContext: string;

  // Suggested rules based on roadmap
  suggestedRules: RoadmapSuggestedRule[];
}
