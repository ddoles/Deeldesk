'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  pricingModel: string;
  basePrice: string;
  currency: string;
  billingFrequency: string;
  features: string[];
  useCases: string[];
  isActive: boolean;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  productId?: string;
  isEdit?: boolean;
}

const pricingModels = [
  { value: '', label: 'Select pricing model' },
  { value: 'per_user', label: 'Per User' },
  { value: 'per_seat', label: 'Per Seat' },
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'tiered', label: 'Tiered' },
  { value: 'usage_based', label: 'Usage Based' },
  { value: 'custom', label: 'Custom' },
];

const billingFrequencies = [
  { value: '', label: 'Select frequency' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'one-time', label: 'One-time' },
];

export function ProductForm({ initialData, productId, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    pricingModel: initialData?.pricingModel || '',
    basePrice: initialData?.basePrice || '',
    currency: initialData?.currency || 'USD',
    billingFrequency: initialData?.billingFrequency || '',
    features: initialData?.features || [],
    useCases: initialData?.useCases || [],
    isActive: initialData?.isActive ?? true,
  });

  const [newFeature, setNewFeature] = useState('');
  const [newUseCase, setNewUseCase] = useState('');

  function updateField<K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function addFeature() {
    if (newFeature.trim()) {
      updateField('features', [...formData.features, newFeature.trim()]);
      setNewFeature('');
    }
  }

  function removeFeature(index: number) {
    updateField('features', formData.features.filter((_, i) => i !== index));
  }

  function addUseCase() {
    if (newUseCase.trim()) {
      updateField('useCases', [...formData.useCases, newUseCase.trim()]);
      setNewUseCase('');
    }
  }

  function removeUseCase(index: number) {
    updateField('useCases', formData.useCases.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        pricingModel: formData.pricingModel || undefined,
        basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
        currency: formData.currency,
        billingFrequency: formData.billingFrequency || undefined,
        features: formData.features,
        useCases: formData.useCases,
        isActive: formData.isActive,
      };

      const url = isEdit
        ? `/api/v1/knowledge/products/${productId}`
        : '/api/v1/knowledge/products';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save product');
      }

      router.push('/knowledge/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Product name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Enterprise Suite"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your product..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              placeholder="e.g., Software, Services"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active (visible in proposals)</Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Configure pricing information for accurate proposals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pricingModel">Pricing Model</Label>
              <select
                id="pricingModel"
                value={formData.pricingModel}
                onChange={(e) => updateField('pricingModel', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {pricingModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingFrequency">Billing Frequency</Label>
              <select
                id="billingFrequency"
                value={formData.billingFrequency}
                onChange={(e) => updateField('billingFrequency', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {billingFrequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => updateField('basePrice', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Key features of this product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addFeature();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addFeature}>
              Add
            </Button>
          </div>
          {formData.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Use Cases</CardTitle>
          <CardDescription>Common use cases for this product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newUseCase}
              onChange={(e) => setNewUseCase(e.target.value)}
              placeholder="Add a use case..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUseCase();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addUseCase}>
              Add
            </Button>
          </div>
          {formData.useCases.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.useCases.map((useCase, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700"
                >
                  {useCase}
                  <button
                    type="button"
                    onClick={() => removeUseCase(index)}
                    className="ml-1 hover:text-green-900"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
