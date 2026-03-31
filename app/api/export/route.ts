import { NextRequest, NextResponse } from 'next/server';
import { exportLegacyToExcel } from '@/lib/export';
import { ExportRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { plan, format } = body;

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    if (format === 'excel') {
      const buffer = exportLegacyToExcel(plan);

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${plan.config.sprintName.replace(/\s+/g, '-')}-sprint-plan.xlsx"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting sprint plan:', error);

    const message = error instanceof Error ? error.message : 'Failed to export plan';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
