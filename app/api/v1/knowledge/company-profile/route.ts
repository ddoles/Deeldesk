/**
 * Company Profile API
 * GET /api/v1/knowledge/company-profile - Get company profile
 * PUT /api/v1/knowledge/company-profile - Update company profile
 * POST /api/v1/knowledge/company-profile/generate - Generate with AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updateProfileSchema = z.object({
  summary: z.string().optional().nullable(),
  companyOverview: z.string().optional().nullable(),
  valueProposition: z.string().optional().nullable(),
  targetCustomers: z.string().optional().nullable(),
  revenueModel: z.string().optional().nullable(),
  keyDifferentiators: z.array(z.string()).optional(),
  industry: z.string().max(100).optional().nullable(),
  marketSegment: z.string().max(100).optional().nullable(),
  companySize: z.string().max(50).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
  headquarters: z.string().max(255).optional().nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
});

// ============================================
// GET - Get Company Profile
// ============================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.companyProfile.findUnique({
      where: { organizationId: session.user.organizationId },
      include: {
        lastEditedBy: {
          select: { name: true, email: true },
        },
      },
    });

    // Also get organization name for context
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true },
    });

    return NextResponse.json({
      profile,
      organizationName: organization?.name,
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update Company Profile
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Check if profile exists
    const existing = await prisma.companyProfile.findUnique({
      where: { organizationId: session.user.organizationId },
    });

    let profile;

    if (existing) {
      // Update existing profile
      profile = await prisma.companyProfile.update({
        where: { organizationId: session.user.organizationId },
        data: {
          ...validated,
          lastEditedById: session.user.id,
          lastEditedAt: new Date(),
          version: { increment: 1 },
        },
      });
    } else {
      // Create new profile
      profile = await prisma.companyProfile.create({
        data: {
          organizationId: session.user.organizationId,
          ...validated,
          keyDifferentiators: validated.keyDifferentiators || [],
          lastEditedById: session.user.id,
          lastEditedAt: new Date(),
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating company profile:', error);
    return NextResponse.json(
      { error: 'Failed to update company profile' },
      { status: 500 }
    );
  }
}
