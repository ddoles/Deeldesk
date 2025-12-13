/**
 * Battlecards API - Collection endpoints
 * GET /api/v1/knowledge/battlecards - List battlecards
 * POST /api/v1/knowledge/battlecards - Create battlecard
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { updateBattlecardEmbedding } from '@/lib/ai/embeddings';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createBattlecardSchema = z.object({
  competitorName: z.string().min(1).max(255),
  competitorWebsite: z.string().url().optional().or(z.literal('')),
  rawContent: z.string().optional(),
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
});

// ============================================
// GET - List Battlecards
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('active');

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { competitorName: { contains: search, mode: 'insensitive' } },
        { rawContent: { contains: search, mode: 'insensitive' } },
      ];
    }

    const battlecards = await prisma.battlecard.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        competitorName: true,
        competitorWebsite: true,
        rawContent: true,
        structuredContent: true,
        lastReviewedAt: true,
        isStale: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ battlecards });
  } catch (error) {
    console.error('Error fetching battlecards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battlecards' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create Battlecard
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createBattlecardSchema.parse(body);

    const battlecard = await prisma.battlecard.create({
      data: {
        organizationId: session.user.organizationId,
        competitorName: validated.competitorName,
        competitorWebsite: validated.competitorWebsite || null,
        rawContent: validated.rawContent || null,
        structuredContent: validated.structuredContent || {},
        reviewedById: session.user.id,
        lastReviewedAt: new Date(),
      },
    });

    // Generate embedding asynchronously
    updateBattlecardEmbedding(battlecard.id).catch((err) => {
      console.error('Failed to generate battlecard embedding:', err);
    });

    return NextResponse.json(battlecard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating battlecard:', error);
    return NextResponse.json(
      { error: 'Failed to create battlecard' },
      { status: 500 }
    );
  }
}
