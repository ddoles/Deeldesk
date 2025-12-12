import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { enqueueProposalGeneration } from '@/lib/queue';

// ============================================
// SCHEMAS
// ============================================

const createProposalSchema = z.object({
  opportunityId: z.string().uuid('Invalid opportunity ID'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
});

// ============================================
// GET /api/v1/proposals
// ============================================

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get('opportunityId');

  const where = {
    organizationId: session.user.organizationId,
    ...(opportunityId && { opportunityId }),
  };

  const proposals = await prisma.proposal.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      version: true,
      status: true,
      prompt: true,
      createdAt: true,
      updatedAt: true,
      opportunity: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(proposals);
}

// ============================================
// POST /api/v1/proposals
// ============================================

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createProposalSchema.parse(body);

    // Verify opportunity belongs to user's organization
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: validated.opportunityId,
        organizationId: session.user.organizationId,
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Get the latest version number for this opportunity
    const latestProposal = await prisma.proposal.findFirst({
      where: { opportunityId: validated.opportunityId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestProposal?.version || 0) + 1;

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        opportunityId: validated.opportunityId,
        organizationId: session.user.organizationId,
        userId: session.user.id,
        version: nextVersion,
        prompt: validated.prompt,
        status: 'draft',
      },
    });

    // Enqueue the generation job
    await enqueueProposalGeneration({
      proposalId: proposal.id,
      organizationId: session.user.organizationId,
      userId: session.user.id,
      opportunityId: validated.opportunityId,
      prompt: validated.prompt,
    });

    return NextResponse.json(
      {
        id: proposal.id,
        version: proposal.version,
        status: 'queued',
        message: 'Proposal generation started',
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}
