import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'not set',
    nodeEnv: process.env.NODE_ENV,
  });
}
