import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

// GET /api/debug/session - Debug endpoint to check session
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated', session: null });
  }

  // Check env vars (only show presence, not values)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      organizationId: session.user.organizationId,
      organizationRole: session.user.organizationRole,
      isPlatformAdmin: session.user.isPlatformAdmin,
    },
    env: {
      ANTHROPIC_API_KEY: anthropicKey ? `${anthropicKey.substring(0, 10)}...` : 'NOT SET',
      OPENAI_API_KEY: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'NOT SET',
    },
  });
}
