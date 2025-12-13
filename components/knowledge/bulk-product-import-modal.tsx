'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExtractedProduct } from '@/lib/ai/extraction-prompts';
import { Button } from '@/components/ui/button';

interface BulkProductImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ExtractedProduct[];
  onImport: (products: ExtractedProduct[]) => void;
  isImporting?: boolean;
}

export function BulkProductImportModal({
  open,
  onOpenChange,
  products,
  onImport,
  isImporting = false,
}: BulkProductImportModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(products.map((_, i) => i))
  );

  // Reset selection when products change
  useEffect(() => {
    setSelectedIndices(new Set(products.map((_, i) => i)));
  }, [products]);

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIndices.size === products.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(products.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const selectedProducts = products.filter((_, i) => selectedIndices.has(i));
    onImport(selectedProducts);
  };

  const formatPrice = (product: ExtractedProduct) => {
    if (product.basePrice === null) return null;
    const currency = product.currency || 'USD';
    const frequency = product.billingFrequency
      ? `/${product.billingFrequency}`
      : '';
    return `${currency} ${product.basePrice}${frequency}`;
  };

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  if (!open || !portalContainer) {
    return null;
  }

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9998,
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div
        className="w-full max-w-2xl bg-white rounded-lg shadow-lg mx-4 flex flex-col"
        style={{ position: 'relative', zIndex: 10000, maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="p-6 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Import Extracted Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} extracted
            from the image. Select which ones to import.
          </p>
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-1 rounded-sm hover:bg-gray-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2 px-6 py-3 border-b bg-gray-50 flex-shrink-0">
          <input
            type="checkbox"
            checked={selectedIndices.size === products.length}
            onChange={toggleAll}
            id="select-all"
            className="rounded border-gray-300"
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            Select All ({selectedIndices.size}/{products.length})
          </label>
        </div>

        {/* Product List - Table Style */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 hidden sm:table-cell">Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    selectedIndices.has(index)
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSelection(index)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(index)}
                      onChange={() => toggleSelection(index)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {product.name || 'Unnamed Product'}
                    </div>
                    {product.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPrice(product) ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.currency || 'USD'} {product.basePrice}
                        </div>
                        {product.billingFrequency && (
                          <div className="text-xs text-gray-500">
                            per {product.billingFrequency}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {product.features && product.features.length > 0 ? (
                      <div className="text-sm text-gray-500">
                        {product.features.length} feature{product.features.length !== 1 ? 's' : ''}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIndices.size === 0 || isImporting}
          >
            {isImporting
              ? 'Importing...'
              : `Import ${selectedIndices.size} Product${selectedIndices.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalContainer);
}
