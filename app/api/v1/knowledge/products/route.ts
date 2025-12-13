/**
 * Products API - Collection endpoints
 * GET /api/v1/knowledge/products - List products
 * POST /api/v1/knowledge/products - Create product
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { updateProductEmbedding } from '@/lib/ai/embeddings';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
  pricingModel: z.string().max(50).optional(),
  basePrice: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  billingFrequency: z.string().max(20).optional(),
  pricingTiers: z.array(z.object({
    name: z.string(),
    price: z.number(),
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
  })).optional(),
  features: z.array(z.string()).optional(),
  useCases: z.array(z.string()).optional(),
});

// ============================================
// GET - List Products
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('active');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId,
    };

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        pricingModel: true,
        basePrice: true,
        currency: true,
        billingFrequency: true,
        features: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get unique categories for filtering
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        organizationId: session.user.organizationId,
        category: { not: null },
      },
    });

    return NextResponse.json({
      products,
      categories: categories.map((c) => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create Product
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        organizationId: session.user.organizationId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        pricingModel: validated.pricingModel,
        basePrice: validated.basePrice,
        currency: validated.currency,
        billingFrequency: validated.billingFrequency,
        pricingTiers: validated.pricingTiers || [],
        features: validated.features || [],
        useCases: validated.useCases || [],
      },
    });

    // Generate embedding asynchronously (don't wait for it)
    updateProductEmbedding(product.id).catch((err) => {
      console.error('Failed to generate product embedding:', err);
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
