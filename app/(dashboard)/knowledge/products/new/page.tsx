import Link from 'next/link';
import { ProductForm } from '@/components/knowledge/product-form';

export default function NewProductPage() {
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
          <span className="text-gray-700">New Product</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add a product to your knowledge base for accurate proposal generation.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}
