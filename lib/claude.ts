import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';
import {
  SprintInputs,
  SprintOutput,
  JobSlot,
  ConstraintResult,
  BreakdownConfig,
  BreakdownTypes,
  JOB_TYPE_CONFIG,
  JobTypeCode,
  // Legacy types
  SprintConfig,
  SprintPlan,
  SprintTask,
} from './types';

// ===========================================
// Initialize Anthropic Client (lazy)
// ===========================================

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }
  return new Anthropic({ apiKey });
}

// ===========================================
// Main Generation Function
// ===========================================

export async function generateSprintPlan(
  inputs: SprintInputs
): Promise<{ output: SprintOutput; messages: MessageParam[] }> {
  const anthropic = getAnthropicClient();
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(inputs);

  const messages: MessageParam[] = [{ role: 'user', content: userPrompt }];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const output = parseSprintOutput(textContent.text);

  // Append the assistant response so callers can continue the conversation
  const updatedMessages: MessageParam[] = [
    ...messages,
    { role: 'assistant', content: textContent.text },
  ];

  return { output, messages: updatedMessages };
}

export async function regenerateSprintPlan(
  previousMessages: MessageParam[],
  feedback: string
): Promise<{ output: SprintOutput; messages: MessageParam[] }> {
  const anthropic = getAnthropicClient();
  const systemPrompt = buildSystemPrompt();

  const messages: MessageParam[] = [
    ...previousMessages,
    {
      role: 'user',
      content: `Please revise the sprint plan based on this feedback:\n\n${feedback}\n\nReturn the full revised plan as JSON in the same format as before.`,
    },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const output = parseSprintOutput(textContent.text);

  const updatedMessages: MessageParam[] = [
    ...messages,
    { role: 'assistant', content: textContent.text },
  ];

  return { output, messages: updatedMessages };
}

// ===========================================
// System Prompt
// ===========================================

function buildSystemPrompt(): string {
  return `You are an expert sprint planner for TubeScience, a leading direct response advertising company that creates performance-driven video ads primarily for Meta (Facebook/Instagram).

## Context
TubeScience creates high-volume video ads optimized for direct response metrics. Each "job" represents a creative brief for a video ad.

## Job Categories

Jobs are categorized into two main types based on risk and innovation level:

### EXPLOIT (Lower Risk, Higher Hit Rate)
- **MORE** (Hit Rate: 45%): Iterate on proven winners. Create variations of top-performing ads.
- **UPGRADE** (Hit Rate: 30%): Upgrade underperformers. Identify and address issues in ads that aren't converting.

### EXPLORE (Higher Risk, Lower Hit Rate)
- **UPGRADE** (Hit Rate: 20%): Test for new audiences. Adapt successful concepts for different demographics.
- **ADAPT** (Hit Rate: 20%): Adapt from external sources. Take inspiration from competitors or other industries.
- **NEW** (Hit Rate: 20%): Brand new concepts. Test completely new creative approaches.

## Breakdown Priorities

When generating the sprint plan, handle breakdowns based on their priority:

1. **CRITICAL**: These breakdowns MUST be satisfied. Every job must have a value for critical breakdowns, and target distributions should be closely followed.

2. **IDEAL**: These breakdowns SHOULD be satisfied when possible. Try to meet target distributions, but they can be flexible if needed to satisfy critical constraints.

3. **NOT_NEEDED**: Ignore these breakdowns entirely. Don't assign values for them.

## Output Format

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:

{
  "jobs": [
    {
      "slotNumber": 1,
      "jobType": "MORE",
      "jobCategory": "Exploit",
      "platform": "Meta",
      "product": "Product Name",
      "visualFormat": "UGC",
      ...other breakdown values
    }
  ],
  "analysis": "Brief analysis of the sprint plan, noting how constraints were balanced and any trade-offs made.",
  "constraintsSummary": [
    {
      "rule": { "id": "rule-1", "description": "Rule description", "breakdownType": "platform", "condition": {...}, "active": true },
      "target": 40,
      "actual": 42,
      "met": true
    }
  ]
}

## Important Guidelines

1. Allocate jobs according to the Explore/Exploit split specified
2. Distribute job types within each category proportionally to their hit rates
3. For each breakdown marked as critical or ideal, try to match target distributions
4. When rules conflict, prioritize in this order: Critical breakdowns > Rules > Ideal breakdowns
5. Include all new ideas in the output, assigning appropriate breakdown values
6. The analysis should explain key decisions and any constraints that couldn't be fully met`;
}

// ===========================================
// User Prompt Builder
// ===========================================

function buildUserPrompt(inputs: SprintInputs): string {
  const { volume, breakdowns, rules, newIdeas, additionalContext } = inputs;

  // Calculate volume allocation
  const exploreCount = Math.round((volume.totalJobs * volume.explorePercentage) / 100);
  const exploitCount = volume.totalJobs - exploreCount;

  // Filter active breakdowns (not 'not_needed')
  const activeBreakdowns = getActiveBreakdowns(breakdowns);

  // Filter active rules
  const activeRules = rules.filter((r) => r.active);

  let prompt = `## Volume Allocation

Total Jobs: ${volume.totalJobs}
- Explore Jobs: ${exploreCount} (${volume.explorePercentage}%)
- Exploit Jobs: ${exploitCount} (${100 - volume.explorePercentage}%)

## Active Breakdowns

`;

  // Add breakdown details
  for (const [key, config] of Object.entries(activeBreakdowns)) {
    prompt += `### ${config.displayName} (${config.priority.toUpperCase()})
`;
    if (config.options.length > 0) {
      prompt += `Options: ${config.options.join(', ')}
`;
    }
    if (config.targetDistribution && Object.keys(config.targetDistribution).length > 0) {
      prompt += `Target Distribution:
`;
      for (const [option, percentage] of Object.entries(config.targetDistribution)) {
        prompt += `  - ${option}: ${Math.round(percentage * 100)}%
`;
      }
    }
    prompt += `
`;
  }

  // Add rules
  if (activeRules.length > 0) {
    prompt += `## Active Rules

`;
    for (const rule of activeRules) {
      prompt += `- ${rule.description} (${rule.condition.type}: ${formatCondition(rule.condition)})
`;
    }
    prompt += `
`;
  }

  // Add new ideas
  if (newIdeas.length > 0) {
    prompt += `## New Ideas to Incorporate

These ideas MUST be included in the sprint plan:

`;
    for (const idea of newIdeas) {
      prompt += `- ${idea.description}
`;
      if (Object.keys(idea.breakdowns).length > 0) {
        prompt += `  Assigned breakdowns: ${JSON.stringify(idea.breakdowns)}
`;
      }
    }
    prompt += `
`;
  }

  // Add additional context
  if (additionalContext) {
    prompt += `## Additional Context

${additionalContext}

`;
  }

  prompt += `Please generate a sprint plan with exactly ${volume.totalJobs} jobs, following all the constraints above.`;

  return prompt;
}

// ===========================================
// Helper Functions
// ===========================================

function getActiveBreakdowns(breakdowns: BreakdownTypes): Partial<Record<keyof BreakdownTypes, BreakdownConfig>> {
  const active: Partial<Record<keyof BreakdownTypes, BreakdownConfig>> = {};

  for (const [key, config] of Object.entries(breakdowns)) {
    if (config.priority !== 'not_needed') {
      active[key as keyof BreakdownTypes] = config;
    }
  }

  return active;
}

function formatCondition(condition: { type: string; value?: number; targetValue?: number }): string {
  switch (condition.type) {
    case 'percentage':
      return `${condition.value}%`;
    case 'minimum':
      return `min ${condition.value}`;
    case 'maximum':
      return `max ${condition.value}`;
    case 'conditional':
      return 'conditional';
    default:
      return '';
  }
}

function parseSprintOutput(response: string): SprintOutput {
  // Extract JSON from response
  let jsonStr = response.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  // Validate we have content to parse
  if (!jsonStr || jsonStr.length === 0) {
    throw new Error('Empty response from Claude. Please try again.');
  }

  // Try to parse the JSON
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    // Log the raw response for debugging
    console.error('Failed to parse Claude response:', jsonStr.substring(0, 500));
    throw new Error('Failed to parse sprint plan response. The AI response was incomplete or malformed. Please try again.');
  }

  // Transform jobs to ensure proper typing
  const jobs: JobSlot[] = parsed.jobs.map((job: Record<string, unknown>, index: number) => ({
    slotNumber: job.slotNumber || index + 1,
    jobType: job.jobType as JobTypeCode,
    jobCategory: JOB_TYPE_CONFIG[job.jobType as JobTypeCode]?.category || 'Explore',
    ...job,
  }));

  // Transform constraints summary
  const constraintsSummary: ConstraintResult[] = (parsed.constraintsSummary || []).map(
    (c: { rule: unknown; target: number; actual: number; met: boolean }) => ({
      rule: c.rule,
      target: c.target,
      actual: c.actual,
      met: c.met,
    })
  );

  return {
    id: `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    jobs,
    analysis: parsed.analysis || 'Sprint plan generated successfully.',
    constraintsSummary,
  };
}

// ===========================================
// Legacy Function (for backwards compatibility)
// ===========================================

export async function generateSprintPlanLegacy(config: SprintConfig): Promise<SprintPlan> {
  const anthropic = getAnthropicClient();
  const prompt = buildLegacyPrompt(config);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return parseLegacySprintPlan(textContent.text, config);
}

function buildLegacyPrompt(config: SprintConfig): string {
  const breakdownInstructions = getLegacyBreakdownInstructions(config.breakdownType);
  const customContext = config.customBreakdown
    ? `\n\nCustom breakdown requirements: ${config.customBreakdown}`
    : '';
  const additionalContext = config.additionalContext
    ? `\n\nAdditional context: ${config.additionalContext}`
    : '';

  return `You are a sprint planning expert. Generate a detailed sprint plan based on the following requirements:

Sprint Name: ${config.sprintName}
Sprint Goal: ${config.sprintGoal}
Team Size: ${config.teamSize} developers
Sprint Duration: ${config.sprintDurationDays} working days
Available Hours per Day per Developer: ${config.hoursPerDay} hours
Target Velocity: ${config.velocityPoints} story points

Breakdown Approach: ${config.breakdownType}
${breakdownInstructions}${customContext}${additionalContext}

Please generate a sprint plan with tasks that:
1. Total story points should be close to but not exceed ${config.velocityPoints}
2. Each task should have clear acceptance criteria
3. Tasks should be properly prioritized (high, medium, low)
4. Consider dependencies between tasks
5. Estimate hours based on story points (roughly 1 point = ${Math.round((config.teamSize * config.hoursPerDay * config.sprintDurationDays) / config.velocityPoints)} hours)

IMPORTANT: Respond ONLY with a valid JSON object in the following format (no markdown, no explanation):
{
  "summary": "Brief summary of the sprint plan",
  "tasks": [
    {
      "id": "task-1",
      "title": "Task title",
      "description": "Detailed task description",
      "storyPoints": 3,
      "priority": "high",
      "status": "todo",
      "category": "Category name",
      "dependencies": [],
      "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
      "estimatedHours": 12
    }
  ],
  "risks": ["Potential risk 1", "Potential risk 2"],
  "assumptions": ["Assumption 1", "Assumption 2"]
}`;
}

function getLegacyBreakdownInstructions(type: string): string {
  switch (type) {
    case 'feature-based':
      return 'Break down the work by distinct product features. Each feature should be a separate category with related tasks.';
    case 'user-story':
      return 'Create tasks as user stories following the format "As a [user], I want [functionality] so that [benefit]". Include acceptance criteria for each story.';
    case 'technical-tasks':
      return 'Focus on technical implementation tasks such as API development, database changes, UI components, testing, and documentation.';
    case 'epic-breakdown':
      return 'Break down the sprint goal into epic-sized chunks, then further decompose into implementable tasks.';
    case 'custom':
      return 'Follow the custom breakdown structure provided below.';
    default:
      return '';
  }
}

function parseLegacySprintPlan(response: string, config: SprintConfig): SprintPlan {
  let jsonStr = response.trim();

  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  const parsed = JSON.parse(jsonStr);

  const tasks: SprintTask[] = parsed.tasks.map((task: SprintTask, index: number) => ({
    id: task.id || `task-${index + 1}`,
    title: task.title,
    description: task.description,
    storyPoints: task.storyPoints,
    priority: task.priority || 'medium',
    status: task.status || 'todo',
    category: task.category || 'General',
    dependencies: task.dependencies || [],
    acceptanceCriteria: task.acceptanceCriteria || [],
    estimatedHours: task.estimatedHours,
  }));

  const totalPoints = tasks.reduce((sum, task) => sum + task.storyPoints, 0);

  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    config,
    tasks,
    totalPoints,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    summary: parsed.summary || 'Sprint plan generated successfully',
    risks: parsed.risks || [],
    assumptions: parsed.assumptions || [],
  };
}
