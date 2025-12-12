import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

// ============================================
// GET /api/v1/proposals/[id]
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const proposal = await prisma.proposal.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      opportunity: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  return NextResponse.json(proposal);
}

// ============================================
// DELETE /api/v1/proposals/[id]
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify proposal exists and belongs to org
  const proposal = await prisma.proposal.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Don't allow deleting proposals that are currently generating
  if (proposal.status === 'generating' || proposal.status === 'queued') {
    return NextResponse.json(
      { error: 'Cannot delete proposal while generation is in progress' },
      { status: 400 }
    );
  }

  await prisma.proposal.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
