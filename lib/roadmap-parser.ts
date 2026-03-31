import Anthropic from '@anthropic-ai/sdk';
import type { DocumentBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { RoadmapExtraction } from './types';

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set. Please add it to your .env.local file.');
  }
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are a creative strategy assistant that extracts sprint planning information from account roadmap documents.

Your task is to parse a TubeScience account roadmap and extract structured data for sprint planning.

CONTEXT:
- Roadmaps contain performance data, top ads analysis, RTBs (Reasons to Buy), visual formats, and gaps
- Products/SKUs are the specific offerings (e.g., 'Hard Mints', 'Sex Chews', 'Sex Rx + CC')
- Motivators/RTBs are the messaging angles (e.g., 'Premature Ejaculation', 'Erection Issues', 'Better Sex')
- Visual formats are creative styles (e.g., 'Native Opener', 'Product Layout', 'DTC UGC', 'Greenscreen')
- The Gaps Table identifies issues and action items to address
- Spend percentages indicate current allocation - use these to suggest target distributions

OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON object (no markdown, no explanation). The JSON must match this exact structure:

{
  "clientName": "Client or Brand Name",
  "products": ["Product1", "Product2"],
  "productCategories": ["Category1", "Category2"],
  "motivators": [
    { "name": "Motivator Name", "spendPercentage": 25, "isGap": false }
  ],
  "visualFormats": [
    { "name": "Format Name", "isWinning": true, "isGap": false }
  ],
  "funnelInsights": {
    "dominantStage": "Full Funnel",
    "notes": "Notes about funnel insights"
  },
  "gaps": [
    { "category": "creative", "issue": "Issue description", "actionItem": "Action to take" }
  ],
  "competitorInsights": ["Insight 1", "Insight 2"],
  "clientPriorities": ["Priority 1", "Priority 2"],
  "suggestedContext": "A 2-3 sentence summary for sprint planning context.",
  "suggestedRules": [
    { "description": "Rule description", "breakdownType": "motivator", "type": "percentage", "value": 30 }
  ]
}

GUIDELINES:
1. Extract the client/brand name from the document title or header (e.g., "HelloFresh", "Roman Health")
2. Extract ALL products/SKUs mentioned in the document
3. Identify motivators/RTBs - if spend % is mentioned, include it; mark as gap if identified as underexplored
4. For visual formats, mark as "isWinning" if it's a top performer, "isGap" if it's identified as needing exploration
5. Gaps should be categorized as 'creative', 'media', or 'workflow'
6. suggestedRules should use breakdownType values: 'product', 'motivator', 'visualFormat', 'platform', 'buyerFunnelStage'
7. Be thorough but concise - focus on actionable insights for sprint planning
8. If information is not present in the document, use empty arrays or reasonable defaults`;

function buildUserPrompt(content: string): string {
  return `Parse this roadmap and extract sprint planning data:

---
${content}
---

Extract:
0. Client/brand name (from document title or header)
1. All products/SKUs mentioned
2. Product categories/battlegrounds
3. All motivators/RTBs with spend percentages if available, mark gaps
4. Visual formats - which are winning, which are gaps
5. Funnel stage insights
6. Gaps from the Gaps Table with action items
7. Competitor tactics worth adapting
8. Client priorities
9. A 2-3 sentence context summary for sprint planning
10. Suggested allocation rules based on the data (especially from spend percentages)

Return as JSON only, no markdown code blocks.`;
}

function parseRoadmapResponse(response: string): RoadmapExtraction {
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

  if (!jsonStr || jsonStr.length === 0) {
    throw new Error('Empty response from Claude when parsing roadmap.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('Failed to parse roadmap extraction:', jsonStr.substring(0, 500));
    throw new Error('Failed to parse roadmap extraction. Please try again.');
  }

  // Validate and provide defaults for the extraction
  const extraction: RoadmapExtraction = {
    clientName: parsed.clientName || undefined,
    products: Array.isArray(parsed.products) ? parsed.products : [],
    productCategories: Array.isArray(parsed.productCategories) ? parsed.productCategories : [],
    motivators: Array.isArray(parsed.motivators)
      ? parsed.motivators.map((m: { name?: string; spendPercentage?: number; isGap?: boolean }) => ({
          name: m.name || '',
          spendPercentage: m.spendPercentage,
          isGap: Boolean(m.isGap),
        }))
      : [],
    visualFormats: Array.isArray(parsed.visualFormats)
      ? parsed.visualFormats.map((f: { name?: string; isWinning?: boolean; isGap?: boolean }) => ({
          name: f.name || '',
          isWinning: Boolean(f.isWinning),
          isGap: Boolean(f.isGap),
        }))
      : [],
    funnelInsights: {
      dominantStage: parsed.funnelInsights?.dominantStage || 'Full Funnel',
      notes: parsed.funnelInsights?.notes || '',
    },
    gaps: Array.isArray(parsed.gaps)
      ? parsed.gaps.map((g: { category?: string; issue?: string; actionItem?: string }) => ({
          category: (['creative', 'media', 'workflow'].includes(g.category || '')
            ? g.category
            : 'creative') as 'creative' | 'media' | 'workflow',
          issue: g.issue || '',
          actionItem: g.actionItem || '',
        }))
      : [],
    competitorInsights: Array.isArray(parsed.competitorInsights) ? parsed.competitorInsights : [],
    clientPriorities: Array.isArray(parsed.clientPriorities) ? parsed.clientPriorities : [],
    suggestedContext: parsed.suggestedContext || '',
    suggestedRules: Array.isArray(parsed.suggestedRules)
      ? parsed.suggestedRules.map((r: { description?: string; breakdownType?: string; type?: string; value?: number }) => ({
          description: r.description || '',
          breakdownType: r.breakdownType || 'motivator',
          type: (r.type === 'minimum' ? 'minimum' : 'percentage') as 'percentage' | 'minimum',
          value: r.value || 0,
        }))
      : [],
  };

  return extraction;
}

export async function parseRoadmap(content: string): Promise<RoadmapExtraction> {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(content),
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return parseRoadmapResponse(textContent.text);
}

export async function parseRoadmapFromPdf(pdfBase64: string): Promise<RoadmapExtraction> {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          } as DocumentBlockParam,
          {
            type: 'text',
            text: `Parse this roadmap PDF and extract sprint planning data.

Extract:
0. Client/brand name (from document title or header)
1. All products/SKUs mentioned
2. Product categories/battlegrounds
3. All motivators/RTBs with spend percentages if available, mark gaps
4. Visual formats - which are winning, which are gaps
5. Funnel stage insights
6. Gaps from the Gaps Table with action items
7. Competitor tactics worth adapting
8. Client priorities
9. A 2-3 sentence context summary for sprint planning
10. Suggested allocation rules based on the data (especially from spend percentages)

Return as JSON only, no markdown code blocks.`,
          } as TextBlockParam,
        ],
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return parseRoadmapResponse(textContent.text);
}
