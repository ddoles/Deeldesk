import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const createOpportunitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  expectedCloseDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  expectedValue: z.number().optional(),
  currency: z.string().default('USD'),
});

// GET /api/opportunities - List opportunities for the organization
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const where = {
    organizationId: session.user.organizationId,
    ...(status && { status: status as 'open' | 'won' | 'lost' | 'stalled' }),
  };

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        proposals: {
          select: { id: true, status: true, version: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { proposals: true },
        },
      },
    }),
    prisma.opportunity.count({ where }),
  ]);

  return NextResponse.json({
    opportunities,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + opportunities.length < total,
    },
  });
}

// POST /api/opportunities - Create a new opportunity
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createOpportunitySchema.parse(body);

    const opportunity = await prisma.opportunity.create({
      data: {
        ...validated,
        organizationId: session.user.organizationId,
        userId: session.user.id,
        status: 'open',
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create opportunity error:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}
