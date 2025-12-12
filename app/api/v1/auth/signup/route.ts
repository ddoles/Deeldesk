import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255),
  organizationName: z.string().min(1, 'Organization name is required').max(255).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate unique slug for organization
      const orgName = validated.organizationName || `${validated.name}'s Organization`;
      const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const timestamp = Date.now().toString(36);
      const slug = `${baseSlug}-${timestamp}`;

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          planTier: 'free',
          maxProposalsPerMonth: 5,
          maxKnowledgeItems: 50,
          maxCompetitors: 3,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          passwordHash,
        },
      });

      // Create organization membership
      await tx.organizationMembership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'owner',
          isDefault: true,
          acceptedAt: new Date(),
        },
      });

      return { user, organization };
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
