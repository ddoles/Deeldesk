/**
 * Deal Context Item API
 * GET /api/v1/opportunities/[id]/context/[contextId] - Get context item
 * DELETE /api/v1/opportunities/[id]/context/[contextId] - Delete context item
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string; contextId: string }>;
}

// ============================================
// GET - Get Context Item
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: opportunityId, contextId } = await params;

    const contextItem = await prisma.dealContextItem.findFirst({
      where: {
        id: contextId,
        opportunityId,
        organizationId: session.user.organizationId,
      },
    });

    if (!contextItem) {
      return NextResponse.json({ error: 'Context item not found' }, { status: 404 });
    }

    return NextResponse.json(contextItem);
  } catch (error) {
    console.error('Error fetching context item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context item' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete Context Item
// ============================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: opportunityId, contextId } = await params;

    // Verify context item exists and belongs to organization
    const existing = await prisma.dealContextItem.findFirst({
      where: {
        id: contextId,
        opportunityId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Context item not found' }, { status: 404 });
    }

    await prisma.dealContextItem.delete({
      where: { id: contextId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting context item:', error);
    return NextResponse.json(
      { error: 'Failed to delete context item' },
      { status: 500 }
    );
  }
}
