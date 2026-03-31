import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const keyPrefix = apiKey ? `${apiKey.substring(0, 8)}...` : 'not set';

  return NextResponse.json({
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix,
    baseUrl: baseUrl || 'not set',
    nodeEnv: process.env.NODE_ENV,
  });
}
