/**
 * Battlecards API - Individual item endpoints
 * GET /api/v1/knowledge/battlecards/[id] - Get battlecard
 * PUT /api/v1/knowledge/battlecards/[id] - Update battlecard
 * DELETE /api/v1/knowledge/battlecards/[id] - Delete battlecard
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { updateBattlecardEmbedding } from '@/lib/ai/embeddings';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updateBattlecardSchema = z.object({
  competitorName: z.string().min(1).max(255).optional(),
  competitorWebsite: z.string().url().optional().or(z.literal('')).nullable(),
  rawContent: z.string().optional().nullable(),
  structuredContent: z.object({
    strengths: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    objectionHandling: z.array(z.object({
      objection: z.string(),
      response: z.string(),
    })).optional(),
    keyDifferentiators: z.array(z.string()).optional(),
    pricingIntel: z.string().optional(),
    targetMarket: z.string().optional(),
    recentNews: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  isStale: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// GET - Get Battlecard
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const battlecard = await prisma.battlecard.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        reviewedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!battlecard) {
      return NextResponse.json({ error: 'Battlecard not found' }, { status: 404 });
    }

    return NextResponse.json(battlecard);
  } catch (error) {
    console.error('Error fetching battlecard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battlecard' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update Battlecard
// ============================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateBattlecardSchema.parse(body);

    // Verify battlecard belongs to organization
    const existing = await prisma.battlecard.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Battlecard not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validated };

    // If content is being updated, mark as reviewed
    if (validated.rawContent !== undefined || validated.structuredContent !== undefined) {
      updateData.reviewedById = session.user.id;
      updateData.lastReviewedAt = new Date();
      updateData.isStale = false;
    }

    const battlecard = await prisma.battlecard.update({
      where: { id },
      data: updateData,
    });

    // Regenerate embedding if content changed
    const contentChanged =
      validated.competitorName !== undefined ||
      validated.rawContent !== undefined ||
      validated.structuredContent !== undefined;

    if (contentChanged) {
      updateBattlecardEmbedding(battlecard.id).catch((err) => {
        console.error('Failed to update battlecard embedding:', err);
      });
    }

    return NextResponse.json(battlecard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating battlecard:', error);
    return NextResponse.json(
      { error: 'Failed to update battlecard' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete Battlecard
// ============================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify battlecard belongs to organization
    const existing = await prisma.battlecard.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Battlecard not found' }, { status: 404 });
    }

    await prisma.battlecard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting battlecard:', error);
    return NextResponse.json(
      { error: 'Failed to delete battlecard' },
      { status: 500 }
    );
  }
}
