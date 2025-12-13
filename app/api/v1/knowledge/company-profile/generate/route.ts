/**
 * Company Profile Generation API
 * POST /api/v1/knowledge/company-profile/generate - Generate profile with AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { generateBusinessModel } from '@/lib/ai/business-model-generator';
import { GeneratedBy, ConfidenceLevel } from '@prisma/client';

// ============================================
// VALIDATION SCHEMA
// ============================================

const generateSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().max(100).optional(),
  additionalContext: z.string().max(5000).optional(),
});

// ============================================
// POST - Generate Company Profile with AI
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = generateSchema.parse(body);

    // Get organization name if not provided
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true },
    });

    const companyName = validated.companyName || organization?.name || 'Unknown Company';

    // Generate business model using AI
    const generated = await generateBusinessModel(session.user.organizationId, {
      companyName,
      website: validated.website || undefined,
      industry: validated.industry || undefined,
      additionalContext: validated.additionalContext || undefined,
    });

    // Map confidence level
    const confidenceMap: Record<string, ConfidenceLevel> = {
      high: 'high',
      medium: 'medium',
      low: 'low',
    };

    // Check if profile exists
    const existing = await prisma.companyProfile.findUnique({
      where: { organizationId: session.user.organizationId },
    });

    let profile;

    if (existing) {
      // Update existing profile with generated content
      profile = await prisma.companyProfile.update({
        where: { organizationId: session.user.organizationId },
        data: {
          summary: generated.summary,
          companyOverview: generated.companyOverview,
          valueProposition: generated.valueProposition,
          targetCustomers: generated.targetCustomers,
          revenueModel: generated.revenueModel,
          keyDifferentiators: generated.keyDifferentiators,
          industry: generated.industry,
          marketSegment: generated.marketSegment,
          website: validated.website || existing.website,
          generatedAt: new Date(),
          generatedBy: 'ai' as GeneratedBy,
          confidence: confidenceMap[generated.confidence],
          isVerified: false,
          lastEditedById: session.user.id,
          lastEditedAt: new Date(),
          version: { increment: 1 },
        },
      });
    } else {
      // Create new profile with generated content
      profile = await prisma.companyProfile.create({
        data: {
          organizationId: session.user.organizationId,
          summary: generated.summary,
          companyOverview: generated.companyOverview,
          valueProposition: generated.valueProposition,
          targetCustomers: generated.targetCustomers,
          revenueModel: generated.revenueModel,
          keyDifferentiators: generated.keyDifferentiators,
          industry: generated.industry,
          marketSegment: generated.marketSegment,
          website: validated.website || null,
          generatedAt: new Date(),
          generatedBy: 'ai' as GeneratedBy,
          confidence: confidenceMap[generated.confidence],
          isVerified: false,
          lastEditedById: session.user.id,
          lastEditedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      profile,
      generated: {
        ...generated,
        message: 'Company profile generated successfully. Please review and verify the information.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error generating company profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate company profile' },
      { status: 500 }
    );
  }
}
