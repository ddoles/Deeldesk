import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const updateOrgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  settings: z.object({
    llmProvider: z.enum(['anthropic-direct', 'aws-bedrock']).optional(),
    safeModeDefault: z.boolean().optional(),
  }).optional(),
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

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validated.name) {
      updateData.name = validated.name;
    }

    // Merge settings with existing settings
    if (validated.settings) {
      const existingOrg = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { settings: true },
      });

      const existingSettings = (existingOrg?.settings as Record<string, unknown>) || {};
      updateData.settings = {
        ...existingSettings,
        ...validated.settings,
      };
    }

    const organization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: updateData,
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
