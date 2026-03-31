import { BreakdownType } from './types';

export const BREAKDOWN_OPTIONS: {
  value: BreakdownType;
  label: string;
  description: string;
}[] = [
  {
    value: 'feature-based',
    label: 'Feature-Based',
    description: 'Break down by product features and functionality',
  },
  {
    value: 'user-story',
    label: 'User Stories',
    description: 'Break down by user-centric stories (As a user, I want...)',
  },
  {
    value: 'technical-tasks',
    label: 'Technical Tasks',
    description: 'Break down by technical implementation tasks',
  },
  {
    value: 'epic-breakdown',
    label: 'Epic Breakdown',
    description: 'Break down large epics into smaller deliverables',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Define your own breakdown structure',
  },
];

export const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: 'text-red-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'low', label: 'Low', color: 'text-green-600' },
];

export const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const DEFAULT_SPRINT_CONFIG = {
  sprintName: '',
  sprintGoal: '',
  teamSize: 5,
  sprintDurationDays: 10,
  hoursPerDay: 6,
  velocityPoints: 40,
  breakdownType: 'feature-based' as BreakdownType,
  customBreakdown: '',
  additionalContext: '',
};

export const STORY_POINT_SCALE = [1, 2, 3, 5, 8, 13, 21];

export const LOCAL_STORAGE_KEYS = {
  SAVED_PLANS: 'sprint-planner-saved-plans',
  CURRENT_PLAN: 'sprint-planner-current-plan',
  CONFIG: 'sprint-planner-config',
};
