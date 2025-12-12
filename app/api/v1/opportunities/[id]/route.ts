import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const updateOpportunitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['open', 'won', 'lost', 'stalled']).optional(),
  expectedCloseDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  expectedValue: z.number().optional().nullable(),
  currency: z.string().optional(),
});

// GET /api/opportunities/[id] - Get a single opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      proposals: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          version: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      dealContextItems: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sourceType: true,
          createdAt: true,
        },
      },
      _count: {
        select: { proposals: true, dealContextItems: true },
      },
    },
  });

  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  return NextResponse.json(opportunity);
}

// PATCH /api/opportunities/[id] - Update an opportunity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.opportunity.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validated = updateOpportunitySchema.parse(body);

    // Handle status transitions
    const updateData: Record<string, unknown> = { ...validated };

    // Set closedAt when status changes to won or lost
    if (validated.status === 'won' || validated.status === 'lost') {
      if (existing.status === 'open' || existing.status === 'stalled') {
        updateData.closedAt = new Date();
      }
    } else if (validated.status === 'open' || validated.status === 'stalled') {
      // Reopening an opportunity
      if (existing.status === 'won' || existing.status === 'lost') {
        updateData.closedAt = null;
      }
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update opportunity error:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}

// DELETE /api/opportunities/[id] - Delete an opportunity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.opportunity.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      _count: {
        select: { proposals: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  // Prevent deletion if there are proposals (soft delete behavior)
  if (existing._count.proposals > 0) {
    return NextResponse.json(
      { error: 'Cannot delete opportunity with existing proposals. Consider marking it as lost instead.' },
      { status: 400 }
    );
  }

  await prisma.opportunity.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
