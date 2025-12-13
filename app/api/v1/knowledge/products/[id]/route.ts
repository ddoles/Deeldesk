/**
 * Products API - Individual item endpoints
 * GET /api/v1/knowledge/products/[id] - Get product
 * PUT /api/v1/knowledge/products/[id] - Update product
 * DELETE /api/v1/knowledge/products/[id] - Delete product
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { updateProductEmbedding } from '@/lib/ai/embeddings';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().max(100).optional().nullable(),
  pricingModel: z.string().max(50).optional().nullable(),
  basePrice: z.number().positive().optional().nullable(),
  currency: z.string().length(3).optional(),
  billingFrequency: z.string().max(20).optional().nullable(),
  pricingTiers: z.array(z.object({
    name: z.string(),
    price: z.number(),
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
  })).optional(),
  features: z.array(z.string()).optional(),
  useCases: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// GET - Get Product
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update Product
// ============================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateProductSchema.parse(body);

    // Verify product belongs to organization
    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: validated,
    });

    // Regenerate embedding if content changed
    const contentChanged =
      validated.name !== undefined ||
      validated.description !== undefined ||
      validated.features !== undefined ||
      validated.useCases !== undefined;

    if (contentChanged) {
      updateProductEmbedding(product.id).catch((err) => {
        console.error('Failed to update product embedding:', err);
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete Product
// ============================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify product belongs to organization
    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
