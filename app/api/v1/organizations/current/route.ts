import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const updateOrgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
});

// GET /api/v1/organizations/current - Get current organization
export async function GET() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    include: {
      _count: {
        select: {
          memberships: true,
          opportunities: true,
          proposals: true,
        },
      },
    },
  });

  if (!organization) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json(organization);
}

// PATCH /api/v1/organizations/current - Update current organization
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission (owner or admin)
  if (session.user.organizationRole !== 'owner' && session.user.organizationRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = updateOrgSchema.parse(body);

    const organization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: validated,
    });

    return NextResponse.json(organization);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
