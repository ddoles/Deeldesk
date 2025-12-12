import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const updateMembershipSchema = z.object({
  role: z.enum(['owner', 'admin', 'manager', 'member', 'viewer']),
});

// PATCH /api/v1/admin/memberships/[id] - Update membership role (platform admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.organizationMembership.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validated = updateMembershipSchema.parse(body);

    // If demoting from owner, ensure there's another owner
    if (existing.role === 'owner' && validated.role !== 'owner') {
      const otherOwners = await prisma.organizationMembership.count({
        where: {
          organizationId: existing.organizationId,
          role: 'owner',
          id: { not: id },
        },
      });

      if (otherOwners === 0) {
        return NextResponse.json(
          { error: 'Cannot demote the only owner. Promote another user first.' },
          { status: 400 }
        );
      }
    }

    const membership = await prisma.organizationMembership.update({
      where: { id },
      data: { role: validated.role },
      include: { organization: true, user: true },
    });

    return NextResponse.json(membership);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update membership error:', error);
    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    );
  }
}
