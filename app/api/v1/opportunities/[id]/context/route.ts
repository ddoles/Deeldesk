/**
 * Deal Context API
 * GET /api/v1/opportunities/[id]/context - List context items
 * POST /api/v1/opportunities/[id]/context - Add context item
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { updateDealContextEmbedding } from '@/lib/ai/embeddings';
import { ContextSourceType } from '@prisma/client';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createContextSchema = z.object({
  sourceType: z.enum([
    'manual_paste',
    'email',
    'call_transcript',
    'slack',
    'crm',
    'meeting_notes',
    'document_upload',
  ]),
  rawContent: z.string().min(1).max(100000),
  sourceMetadata: z.object({
    name: z.string().optional(),
    date: z.string().optional(),
    participants: z.array(z.string()).optional(),
  }).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// GET - List Context Items
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: opportunityId } = await params;

    // Verify opportunity belongs to organization
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId: session.user.organizationId,
      },
      select: { id: true, name: true },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const contextItems = await prisma.dealContextItem.findMany({
      where: { opportunityId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sourceType: true,
        rawContent: true,
        sourceMetadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      opportunity: { id: opportunity.id, name: opportunity.name },
      contextItems,
    });
  } catch (error) {
    console.error('Error fetching context items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context items' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Add Context Item
// ============================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: opportunityId } = await params;
    const body = await request.json();
    const validated = createContextSchema.parse(body);

    // Verify opportunity belongs to organization
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId: session.user.organizationId,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Create context item
    const contextItem = await prisma.dealContextItem.create({
      data: {
        opportunityId,
        organizationId: session.user.organizationId,
        sourceType: validated.sourceType as ContextSourceType,
        rawContent: validated.rawContent,
        sourceMetadata: validated.sourceMetadata || {},
        parsedContent: {},
      },
    });

    // Generate embedding asynchronously
    updateDealContextEmbedding(contextItem.id).catch((err) => {
      console.error('Failed to generate context embedding:', err);
    });

    return NextResponse.json(contextItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating context item:', error);
    return NextResponse.json(
      { error: 'Failed to create context item' },
      { status: 500 }
    );
  }
}
