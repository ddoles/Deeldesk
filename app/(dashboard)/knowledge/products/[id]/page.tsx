import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { ProductForm } from '@/components/knowledge/product-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.organizationId) {
    return null;
  }

  const product = await prisma.product.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!product) {
    notFound();
  }

  const initialData = {
    name: product.name,
    description: product.description || '',
    category: product.category || '',
    pricingModel: product.pricingModel || '',
    basePrice: product.basePrice?.toString() || '',
    currency: product.currency || 'USD',
    billingFrequency: product.billingFrequency || '',
    features: (product.features as string[]) || [],
    useCases: (product.useCases as string[]) || [],
    isActive: product.isActive,
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/knowledge/products" className="hover:text-gray-700">
            Products
          </Link>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-700">{product.name}</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update product information and pricing.
        </p>
      </div>

      <ProductForm initialData={initialData} productId={id} isEdit />
    </div>
  );
}
