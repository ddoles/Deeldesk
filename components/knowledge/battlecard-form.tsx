'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageDropZone } from '@/components/knowledge/image-drop-zone';
import { BattlecardExtractionResult } from '@/lib/ai/extraction-prompts';

interface StructuredContent {
  strengths: string[];
  weaknesses: string[];
  objectionHandling: Array<{ objection: string; response: string }>;
  keyDifferentiators: string[];
  pricingIntel: string;
  targetMarket: string;
}

interface BattlecardFormData {
  competitorName: string;
  competitorWebsite: string;
  rawContent: string;
  structuredContent: StructuredContent;
  isActive: boolean;
}

interface BattlecardFormProps {
  initialData?: Partial<BattlecardFormData>;
  battlecardId?: string;
  isEdit?: boolean;
}

export function BattlecardForm({ initialData, battlecardId, isEdit = false }: BattlecardFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSuccess, setExtractionSuccess] = useState(false);

  const [formData, setFormData] = useState<BattlecardFormData>({
    competitorName: initialData?.competitorName || '',
    competitorWebsite: initialData?.competitorWebsite || '',
    rawContent: initialData?.rawContent || '',
    structuredContent: {
      strengths: initialData?.structuredContent?.strengths || [],
      weaknesses: initialData?.structuredContent?.weaknesses || [],
      objectionHandling: initialData?.structuredContent?.objectionHandling || [],
      keyDifferentiators: initialData?.structuredContent?.keyDifferentiators || [],
      pricingIntel: initialData?.structuredContent?.pricingIntel || '',
      targetMarket: initialData?.structuredContent?.targetMarket || '',
    },
    isActive: initialData?.isActive ?? true,
  });

  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newDifferentiator, setNewDifferentiator] = useState('');
  const [newObjection, setNewObjection] = useState({ objection: '', response: '' });

  function updateField<K extends keyof BattlecardFormData>(field: K, value: BattlecardFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateStructuredField<K extends keyof StructuredContent>(field: K, value: StructuredContent[K]) {
    setFormData((prev) => ({
      ...prev,
      structuredContent: { ...prev.structuredContent, [field]: value },
    }));
  }

  function addStrength() {
    if (newStrength.trim()) {
      updateStructuredField('strengths', [...formData.structuredContent.strengths, newStrength.trim()]);
      setNewStrength('');
    }
  }

  function removeStrength(index: number) {
    updateStructuredField('strengths', formData.structuredContent.strengths.filter((_, i) => i !== index));
  }

  function addWeakness() {
    if (newWeakness.trim()) {
      updateStructuredField('weaknesses', [...formData.structuredContent.weaknesses, newWeakness.trim()]);
      setNewWeakness('');
    }
  }

  function removeWeakness(index: number) {
    updateStructuredField('weaknesses', formData.structuredContent.weaknesses.filter((_, i) => i !== index));
  }

  function addDifferentiator() {
    if (newDifferentiator.trim()) {
      updateStructuredField('keyDifferentiators', [...formData.structuredContent.keyDifferentiators, newDifferentiator.trim()]);
      setNewDifferentiator('');
    }
  }

  function removeDifferentiator(index: number) {
    updateStructuredField('keyDifferentiators', formData.structuredContent.keyDifferentiators.filter((_, i) => i !== index));
  }

  function addObjection() {
    if (newObjection.objection.trim() && newObjection.response.trim()) {
      updateStructuredField('objectionHandling', [...formData.structuredContent.objectionHandling, newObjection]);
      setNewObjection({ objection: '', response: '' });
    }
  }

  function removeObjection(index: number) {
    updateStructuredField('objectionHandling', formData.structuredContent.objectionHandling.filter((_, i) => i !== index));
  }

  const handleExtraction = useCallback(async (base64Image: string) => {
    setIsExtracting(true);
    setExtractionError(null);
    setExtractionSuccess(false);

    try {
      const response = await fetch('/api/v1/extract/battlecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract competitor information');
      }

      if (!result.success) {
        throw new Error(result.error || 'No competitor information detected');
      }

      const data = result.data as BattlecardExtractionResult;

      // Update form with extracted data (only non-null values)
      setFormData((prev) => ({
        ...prev,
        competitorName: data.competitorName || prev.competitorName,
        competitorWebsite: data.competitorWebsite || prev.competitorWebsite,
        structuredContent: {
          ...prev.structuredContent,
          strengths: data.strengths && data.strengths.length > 0 ? data.strengths : prev.structuredContent.strengths,
          weaknesses: data.weaknesses && data.weaknesses.length > 0 ? data.weaknesses : prev.structuredContent.weaknesses,
          keyDifferentiators: data.keyDifferentiators && data.keyDifferentiators.length > 0 ? data.keyDifferentiators : prev.structuredContent.keyDifferentiators,
          pricingIntel: data.pricingIntel || prev.structuredContent.pricingIntel,
          targetMarket: data.targetMarket || prev.structuredContent.targetMarket,
        },
      }));

      setExtractionSuccess(true);
      // Clear success message after 5 seconds
      setTimeout(() => setExtractionSuccess(false), 5000);
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        competitorName: formData.competitorName,
        competitorWebsite: formData.competitorWebsite || undefined,
        rawContent: formData.rawContent || undefined,
        structuredContent: formData.structuredContent,
        isActive: formData.isActive,
      };

      const url = isEdit
        ? `/api/v1/knowledge/battlecards/${battlecardId}`
        : '/api/v1/knowledge/battlecards';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save battlecard');
      }

      router.push('/knowledge/battlecards');
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

      {/* AI Extraction Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            Quick Fill with AI
          </CardTitle>
          <CardDescription>
            Paste a screenshot or drag an image of a competitor page, comparison chart, or sales intel to auto-fill the form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageDropZone
            onImageSelect={handleExtraction}
            isProcessing={isExtracting}
            error={extractionError}
          />
          {extractionSuccess && (
            <div className="mt-3 rounded-md bg-green-50 p-3">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Competitor intelligence extracted! Review and edit the fields below.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competitor Information</CardTitle>
          <CardDescription>Basic information about the competitor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="competitorName">Competitor Name *</Label>
            <Input
              id="competitorName"
              value={formData.competitorName}
              onChange={(e) => updateField('competitorName', e.target.value)}
              placeholder="e.g., Competitor Inc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitorWebsite">Website</Label>
            <Input
              id="competitorWebsite"
              type="url"
              value={formData.competitorWebsite}
              onChange={(e) => updateField('competitorWebsite', e.target.value)}
              placeholder="https://competitor.com"
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
              <Label htmlFor="isActive">Active (use in proposals)</Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Content</CardTitle>
          <CardDescription>Paste any competitive intelligence (emails, notes, research)</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.rawContent}
            onChange={(e) => updateField('rawContent', e.target.value)}
            placeholder="Paste competitive intelligence here..."
            rows={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strengths</CardTitle>
          <CardDescription>What this competitor does well</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
              placeholder="Add a strength..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStrength(); } }}
            />
            <Button type="button" variant="outline" onClick={addStrength}>Add</Button>
          </div>
          {formData.structuredContent.strengths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.structuredContent.strengths.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                  {item}
                  <button type="button" onClick={() => removeStrength(index)} className="ml-1 hover:text-green-900">
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
          <CardTitle>Weaknesses</CardTitle>
          <CardDescription>Where this competitor falls short</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newWeakness}
              onChange={(e) => setNewWeakness(e.target.value)}
              placeholder="Add a weakness..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWeakness(); } }}
            />
            <Button type="button" variant="outline" onClick={addWeakness}>Add</Button>
          </div>
          {formData.structuredContent.weaknesses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.structuredContent.weaknesses.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
                  {item}
                  <button type="button" onClick={() => removeWeakness(index)} className="ml-1 hover:text-red-900">
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
          <CardTitle>Key Differentiators</CardTitle>
          <CardDescription>How you differentiate against this competitor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newDifferentiator}
              onChange={(e) => setNewDifferentiator(e.target.value)}
              placeholder="Add a differentiator..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDifferentiator(); } }}
            />
            <Button type="button" variant="outline" onClick={addDifferentiator}>Add</Button>
          </div>
          {formData.structuredContent.keyDifferentiators.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.structuredContent.keyDifferentiators.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                  {item}
                  <button type="button" onClick={() => removeDifferentiator(index)} className="ml-1 hover:text-blue-900">
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
          <CardTitle>Objection Handling</CardTitle>
          <CardDescription>Common objections and how to respond</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              value={newObjection.objection}
              onChange={(e) => setNewObjection({ ...newObjection, objection: e.target.value })}
              placeholder="Objection (e.g., 'They're cheaper')"
            />
            <textarea
              value={newObjection.response}
              onChange={(e) => setNewObjection({ ...newObjection, response: e.target.value })}
              placeholder="Response..."
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <Button type="button" variant="outline" onClick={addObjection}>Add Objection</Button>
          </div>
          {formData.structuredContent.objectionHandling.length > 0 && (
            <div className="space-y-3">
              {formData.structuredContent.objectionHandling.map((item, index) => (
                <div key={index} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">&ldquo;{item.objection}&rdquo;</p>
                      <p className="mt-1 text-sm text-gray-600">{item.response}</p>
                    </div>
                    <button type="button" onClick={() => removeObjection(index)} className="text-gray-400 hover:text-red-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Intelligence</CardTitle>
          <CardDescription>Pricing information and target market</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pricingIntel">Pricing Intelligence</Label>
            <textarea
              id="pricingIntel"
              value={formData.structuredContent.pricingIntel}
              onChange={(e) => updateStructuredField('pricingIntel', e.target.value)}
              placeholder="What do you know about their pricing?"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetMarket">Target Market</Label>
            <Input
              id="targetMarket"
              value={formData.structuredContent.targetMarket}
              onChange={(e) => updateStructuredField('targetMarket', e.target.value)}
              placeholder="Who do they typically sell to?"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Battlecard'}
        </Button>
      </div>
    </form>
  );
}
