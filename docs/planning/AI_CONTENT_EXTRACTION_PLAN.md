# AI-Powered Content Extraction for Knowledge Base

**Feature:** Screenshot/Image Upload with Claude Vision AI Extraction
**Created:** December 13, 2025
**Status:** Implemented (Sprint 3.5)
**Priority:** High - Significantly improves KB onboarding UX

---

## Problem Statement

While Sprint 3 delivered a complete Knowledge Base with Products and Battlecards, the current implementation requires manual form input for all fields. User research indicates:

1. **Sales reps screenshot competitor pages** rather than typing information
2. **Product managers have spec sheets** (images/PDFs) they want to import
3. **Manual entry takes 5-10 minutes per item** vs 30 seconds for AI extraction
4. **Cold start friction** - KB population is the #1 barrier to first proposal

## Solution Overview

Enable users to paste screenshots or upload images that Claude Vision AI processes to extract structured data, pre-filling form fields for review before saving.

```
User pastes/uploads image → Claude Vision extracts data → Form pre-fills → User reviews & saves
```

### Key Advantages

- **Leverages existing infrastructure**: Uses Anthropic Claude API already in codebase
- **No persistent storage needed**: Images processed and discarded (no S3 complexity)
- **Fast implementation**: ~1-2 days for MVP
- **Delightful UX**: "Paste → Magic" is an instant wow moment
- **Maintains data quality**: User reviews extracted data before saving

---

## Implementation Phases

### Phase 1: Clipboard Paste + Vision (MVP)
**Effort:** ~4-6 hours
**Priority:** Immediate

Add clipboard paste support to both Product and Battlecard forms with Claude Vision extraction.

### Phase 2: Drag-Drop Image Upload
**Effort:** ~2-4 hours
**Priority:** Quick follow-up

Add explicit file upload as alternative to paste.

### Phase 3: URL Scraping for Battlecards (Optional)
**Effort:** ~4-6 hours
**Priority:** Future enhancement

Fetch competitor URLs and extract intelligence.

---

## Detailed Implementation Plan

### Phase 1: Clipboard Paste + Vision

#### 1.1 Create Vision Extraction API Endpoints

**Files to create:**
- `app/api/v1/extract/product/route.ts`
- `app/api/v1/extract/battlecard/route.ts`

**API Specification:**

```typescript
// POST /api/v1/extract/product
// Request:
{
  "image": "data:image/png;base64,..." // Base64 encoded image
}

// Response:
{
  "success": true,
  "data": {
    "name": "Acme Pro Suite",
    "description": "Enterprise productivity platform...",
    "category": "Software",
    "features": ["Real-time collaboration", "AI assistance", "Cloud sync"],
    "useCases": ["Enterprise teams", "Remote work", "Project management"],
    "pricingModel": "subscription",
    "basePrice": 99,
    "billingFrequency": "monthly",
    "currency": "USD"
  },
  "confidence": {
    "overall": 0.85,
    "fields": {
      "name": 0.95,
      "basePrice": 0.70  // Lower confidence = user should verify
    }
  }
}
```

```typescript
// POST /api/v1/extract/battlecard
// Request:
{
  "image": "data:image/png;base64,..."
}

// Response:
{
  "success": true,
  "data": {
    "competitorName": "CompetitorX",
    "competitorWebsite": "https://competitorx.com",
    "strengths": ["Strong brand recognition", "Large market share"],
    "weaknesses": ["Higher pricing", "Limited customization"],
    "keyDifferentiators": ["AI-native architecture", "Better integrations"],
    "pricingIntel": "Enterprise tier starts at $500/user/year",
    "targetMarket": "Mid-market and Enterprise"
  },
  "confidence": {
    "overall": 0.82
  }
}
```

#### 1.2 Extraction Prompts

**Product Extraction System Prompt:**
```
You are a product information extractor. Analyze the provided image and extract product details.

RULES:
- Only extract information that is clearly visible in the image
- Use null for any field where information is not present or unclear
- Never invent or hallucinate data
- For pricing, only extract if exact numbers are visible
- Return valid JSON matching the schema exactly

SCHEMA:
{
  "name": string | null,
  "description": string | null,
  "category": string | null,  // One of: Software, Hardware, Service, Platform, Other
  "features": string[] | null,  // List of product features/capabilities
  "useCases": string[] | null,  // Target use cases or customer segments
  "pricingModel": "subscription" | "one_time" | "usage_based" | "tiered" | "custom" | null,
  "basePrice": number | null,  // Base price as a number (no currency symbols)
  "billingFrequency": "monthly" | "annual" | "one_time" | null,
  "currency": "USD" | "EUR" | "GBP" | "CAD" | "AUD" | null
}

If the image doesn't appear to contain product information, return:
{ "error": "No product information detected in image" }
```

**Battlecard Extraction System Prompt:**
```
You are a competitive intelligence extractor. Analyze the provided image and extract information about a competitor.

RULES:
- Only extract information that is clearly visible in the image
- Use null for any field where information is not present
- Never invent claims or competitive positioning
- Be objective - extract what's stated, not interpretations
- Return valid JSON matching the schema exactly

SCHEMA:
{
  "competitorName": string | null,
  "competitorWebsite": string | null,
  "strengths": string[] | null,  // Competitor's advantages/strong points
  "weaknesses": string[] | null,  // Competitor's disadvantages/weak points
  "keyDifferentiators": string[] | null,  // How we differ from them
  "pricingIntel": string | null,  // Any pricing information (keep as text)
  "targetMarket": string | null  // Who they target
}

If the image doesn't appear to contain competitor information, return:
{ "error": "No competitor information detected in image" }
```

#### 1.3 API Implementation

```typescript
// app/api/v1/extract/product/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const PRODUCT_EXTRACTION_PROMPT = `...`; // System prompt from above

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { image } = await request.json();

    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      );
    }

    // Extract base64 and media type
    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    const [, mediaType, base64Data] = matches;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Extract product information from this image. Return only valid JSON.',
            },
          ],
        },
      ],
      system: PRODUCT_EXTRACTION_PROMPT,
    });

    // Parse the response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const extracted = JSON.parse(textContent.text);

    if (extracted.error) {
      return NextResponse.json(
        { success: false, error: extracted.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extracted,
      confidence: { overall: 0.85 }, // Could enhance with actual confidence scoring
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract product information' },
      { status: 500 }
    );
  }
}
```

#### 1.4 Form Component Enhancement

**Add to ProductForm (`components/knowledge/product-form.tsx`):**

```typescript
// New imports
import { useState, useCallback } from 'react';
import { ImageIcon, ClipboardPaste, Loader2 } from 'lucide-react';

// Add extraction state
const [isExtracting, setIsExtracting] = useState(false);
const [extractionError, setExtractionError] = useState<string | null>(null);

// Add paste handler
const handlePaste = useCallback(async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;

      setIsExtracting(true);
      setExtractionError(null);

      try {
        const base64 = await fileToBase64(file);
        const response = await fetch('/api/v1/extract/product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });

        const result = await response.json();

        if (result.success) {
          // Pre-fill form with extracted data
          setFormData(prev => ({
            ...prev,
            name: result.data.name || prev.name,
            description: result.data.description || prev.description,
            category: result.data.category || prev.category,
            features: result.data.features || prev.features,
            useCases: result.data.useCases || prev.useCases,
            pricingModel: result.data.pricingModel || prev.pricingModel,
            basePrice: result.data.basePrice?.toString() || prev.basePrice,
            billingFrequency: result.data.billingFrequency || prev.billingFrequency,
            currency: result.data.currency || prev.currency,
          }));
        } else {
          setExtractionError(result.error || 'Failed to extract data');
        }
      } catch (error) {
        setExtractionError('Failed to process image');
      } finally {
        setIsExtracting(false);
      }
    }
  }
}, []);

// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Add effect to register paste listener
useEffect(() => {
  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, [handlePaste]);
```

**Add UI elements:**

```tsx
{/* Add at top of form */}
<div className="mb-6 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
  <div className="flex items-center gap-3 text-muted-foreground">
    <ClipboardPaste className="h-5 w-5" />
    <div>
      <p className="font-medium text-foreground">Paste a screenshot to auto-fill</p>
      <p className="text-sm">Copy an image of a product page, spec sheet, or pricing table and paste here (Cmd/Ctrl+V)</p>
    </div>
  </div>

  {isExtracting && (
    <div className="mt-3 flex items-center gap-2 text-sm text-primary">
      <Loader2 className="h-4 w-4 animate-spin" />
      Extracting product information...
    </div>
  )}

  {extractionError && (
    <div className="mt-3 text-sm text-destructive">
      {extractionError}
    </div>
  )}
</div>
```

#### 1.5 Preview Modal (Optional Enhancement)

For better UX, show a preview modal before applying extracted data:

```tsx
// components/knowledge/extraction-preview-modal.tsx
interface ExtractionPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  extractedData: Record<string, unknown>;
  type: 'product' | 'battlecard';
}

export function ExtractionPreviewModal({
  open,
  onClose,
  onApply,
  extractedData,
  type,
}: ExtractionPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Extracted Data</DialogTitle>
          <DialogDescription>
            We extracted the following information. Review and apply to pre-fill the form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(extractedData).map(([key, value]) => (
            value && (
              <div key={key} className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="col-span-2 text-sm">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            )
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onApply}>Apply to Form</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 2: Drag-Drop Image Upload

#### 2.1 Create Reusable Drop Zone Component

```typescript
// components/knowledge/image-drop-zone.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDropZoneProps {
  onExtract: (base64: string) => Promise<void>;
  isExtracting: boolean;
  className?: string;
}

export function ImageDropZone({ onExtract, isExtracting, className }: ImageDropZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image must be smaller than 10MB');
      return;
    }

    setError(null);

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Convert to base64 and extract
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await onExtract(base64);
    };
    reader.readAsDataURL(file);
  }, [onExtract]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    disabled: isExtracting,
  });

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
  };

  return (
    <div className={cn('relative', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isExtracting && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Upload preview"
              className="max-h-48 mx-auto rounded"
            />
            {!isExtracting && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearPreview();
                }}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isDragActive ? (
              <>
                <Upload className="h-8 w-8 text-primary" />
                <p>Drop the image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8" />
                <p>Drag & drop an image, or click to select</p>
                <p className="text-xs">PNG, JPG, WebP up to 10MB</p>
              </>
            )}
          </div>
        )}

        {isExtracting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Extracting information...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

#### 2.2 Install Dependency

```bash
npm install react-dropzone
```

---

### Phase 3: URL Scraping (Future)

For battlecards, add ability to fetch competitor URL:

```typescript
// app/api/v1/extract/url/route.ts
export async function POST(request: NextRequest) {
  const { url } = await request.json();

  // Fetch URL content
  const response = await fetch(url);
  const html = await response.text();

  // Convert HTML to clean text (use cheerio or similar)
  const text = extractTextFromHtml(html);

  // Send to Claude for extraction
  const extracted = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: BATTLECARD_URL_EXTRACTION_PROMPT,
    messages: [
      { role: 'user', content: `Extract competitor intelligence from this webpage content:\n\n${text}` }
    ]
  });

  return NextResponse.json({ success: true, data: extracted });
}
```

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `app/api/v1/extract/product/route.ts` | Product extraction endpoint |
| `app/api/v1/extract/battlecard/route.ts` | Battlecard extraction endpoint |
| `components/knowledge/image-drop-zone.tsx` | Reusable drop zone component |
| `components/knowledge/extraction-preview-modal.tsx` | Preview modal (optional) |
| `lib/ai/extraction-prompts.ts` | Centralized extraction prompts |

### Modified Files

| File | Changes |
|------|---------|
| `components/knowledge/product-form.tsx` | Add paste handler, extraction UI |
| `components/knowledge/battlecard-form.tsx` | Add paste handler, extraction UI |
| `package.json` | Add `react-dropzone` dependency |

---

## Testing Plan

### Manual Test Cases

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| EX-01 | Paste screenshot of product pricing page | Form pre-fills with extracted name, price, features |
| EX-02 | Paste screenshot of competitor About page | Battlecard form pre-fills with competitor info |
| EX-03 | Paste non-relevant image (photo, etc.) | Shows error: "No product information detected" |
| EX-04 | Paste very large image (>10MB) | Shows error about file size |
| EX-05 | Drag-drop product spec sheet PNG | Same as EX-01 |
| EX-06 | Extract from partially visible screenshot | Only visible fields populated, others null |
| EX-07 | User edits extracted data before save | Edits preserved, saved correctly |

### Edge Cases

- Blurry images → Should return lower confidence or null fields
- Non-English content → Test with French/German/Japanese product pages
- Tables/charts → Should extract tabular pricing data
- Multiple products in one image → Should extract primary/most prominent

---

## Cost Analysis

### Claude Vision API Costs

- Claude Sonnet 4: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Average image: ~1,000 tokens
- Average extraction output: ~500 tokens
- **Cost per extraction: ~$0.01**

### Expected Usage (MVP)

- 100 users × 10 extractions/month = 1,000 extractions
- Monthly cost: ~$10
- Negligible compared to proposal generation costs

---

## Security Considerations

1. **Image validation**: Verify image format before sending to API
2. **Size limits**: Enforce 10MB max to prevent abuse
3. **No persistent storage**: Images are base64 encoded, sent to API, and discarded
4. **Authentication required**: All extraction endpoints require valid session
5. **Rate limiting**: Apply standard rate limits to extraction endpoints

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| KB item creation time | <1 min (from 5-10 min) | Time from start to save |
| Extraction accuracy | >80% fields correct | User edits before save |
| Feature adoption | >50% of KB items use extraction | API call logs |
| User satisfaction | Positive qualitative feedback | User interviews |

---

## Timeline

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Clipboard Paste | 4-6 hours | None |
| Phase 2: Drag-Drop Upload | 2-4 hours | Phase 1 |
| Phase 3: URL Scraping | 4-6 hours | Phase 1 (optional) |

**Total MVP (Phases 1-2): 6-10 hours**

---

## Implementation Notes (Sprint 3.5)

### What Was Implemented

1. **Clipboard Paste + Vision Extraction** - Users can paste screenshots directly into Product and Battlecard forms
2. **Drag-Drop Image Upload** - Alternative to paste with visual preview
3. **Bulk Product Import** - When multiple products/tiers are detected in an image (e.g., pricing tables), a modal allows selecting which products to import

### Key Implementation Details

**Bulk Import Modal (`components/knowledge/bulk-product-import-modal.tsx`):**
- Uses React Portal to render outside form container for proper viewport positioning
- Shows all extracted products with checkboxes for selection
- Displays product name, category, price, and features preview
- Allows select/deselect all functionality
- Creates multiple KB entries in parallel on import

**Extraction Prompt Changes:**
- Product extraction prompt returns `{ products: [...] }` array format
- Supports extracting ALL products/tiers from multi-row pricing tables
- Increased `max_tokens` to 4096 for multi-product responses

**Files Created:**
- `app/api/v1/extract/product/route.ts` - Product extraction API
- `app/api/v1/extract/battlecard/route.ts` - Battlecard extraction API
- `components/knowledge/image-drop-zone.tsx` - Reusable drop zone component
- `components/knowledge/bulk-product-import-modal.tsx` - Bulk import modal
- `lib/ai/extraction-prompts.ts` - Centralized extraction prompts and types

**Files Modified:**
- `components/knowledge/product-form.tsx` - Added extraction UI and bulk import handling
- `components/knowledge/battlecard-form.tsx` - Added extraction UI

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project context and patterns
- [Context Assembly](../architecture/CONTEXT_ASSEMBLY.md) - How KB content feeds into proposals
- [Sprint 3 Test Plan](../testing/SPRINT_3_UX_TEST_PLAN.md) - KB feature tests

---

**Document Version:** 1.1
**Last Updated:** December 13, 2025
