import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

// GET /api/debug/session - Debug endpoint to check session
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated', session: null });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      organizationId: session.user.organizationId,
      organizationRole: session.user.organizationRole,
      isPlatformAdmin: session.user.isPlatformAdmin,
    },
  });
}
