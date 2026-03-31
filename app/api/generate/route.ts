import { NextRequest, NextResponse } from 'next/server';
import { generateSprintPlan, regenerateSprintPlan, generateSprintPlanLegacy } from '@/lib/claude';
import { SprintInputs, SprintConfig } from '@/lib/types';

// ===========================================
// New API: SprintInputs-based generation
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is the new SprintInputs format or legacy SprintConfig format
    if (body.messages && body.feedback) {
      // Feedback regeneration path
      const { output, messages } = await regenerateSprintPlan(body.messages, body.feedback);
      return NextResponse.json({ output, messages });
    } else if (body.inputs || body.volume) {
      // New format: SprintInputs
      return handleNewFormat(body.inputs || body);
    } else if (body.config) {
      // Legacy format: { config: SprintConfig }
      return handleLegacyFormat(body.config);
    } else {
      return NextResponse.json(
        { error: 'Invalid request format. Expected inputs or config.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating sprint plan:', error);

    const message =
      error instanceof Error ? error.message : 'Failed to generate sprint plan';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ===========================================
// New Format Handler
// ===========================================

async function handleNewFormat(inputs: SprintInputs) {
  // Validate inputs
  if (!inputs.volume) {
    return NextResponse.json(
      { error: 'Volume configuration is required' },
      { status: 400 }
    );
  }

  if (inputs.volume.totalJobs < 1) {
    return NextResponse.json(
      { error: 'Total jobs must be at least 1' },
      { status: 400 }
    );
  }

  if (inputs.volume.explorePercentage < 0 || inputs.volume.explorePercentage > 100) {
    return NextResponse.json(
      { error: 'Explore percentage must be between 0 and 100' },
      { status: 400 }
    );
  }

  if (!inputs.breakdowns) {
    return NextResponse.json(
      { error: 'Breakdowns configuration is required' },
      { status: 400 }
    );
  }

  // Generate the sprint plan
  const { output, messages } = await generateSprintPlan(inputs);

  return NextResponse.json({ output, messages });
}

// ===========================================
// Legacy Format Handler
// ===========================================

async function handleLegacyFormat(config: SprintConfig) {
  // Validate legacy config
  if (!config.sprintName || !config.sprintGoal) {
    return NextResponse.json(
      { error: 'Sprint name and goal are required' },
      { status: 400 }
    );
  }

  // Generate the sprint plan using legacy function
  const plan = await generateSprintPlanLegacy(config);

  return NextResponse.json({ plan });
}
