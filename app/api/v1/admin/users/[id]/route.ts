import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const updateUserSchema = z.object({
  isPlatformAdmin: z.boolean().optional(),
  name: z.string().min(1).max(255).optional(),
});

// PATCH /api/v1/admin/users/[id] - Update user (platform admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// GET /api/v1/admin/users/[id] - Get user details (platform admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { organization: true },
      },
      _count: {
        select: {
          opportunities: true,
          proposals: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
