'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompanyProfile {
  id: string;
  summary: string | null;
  companyOverview: string | null;
  valueProposition: string | null;
  targetCustomers: string | null;
  revenueModel: string | null;
  keyDifferentiators: string[];
  industry: string | null;
  marketSegment: string | null;
  website: string | null;
  generatedAt: string | null;
  generatedBy: string | null;
  confidence: string | null;
  isVerified: boolean;
  lastEditedAt: string | null;
  version: number;
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmCompanyName, setConfirmCompanyName] = useState('');
  const [confirmWebsite, setConfirmWebsite] = useState('');
  const [confirmIndustry, setConfirmIndustry] = useState('');
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const [formData, setFormData] = useState({
    summary: '',
    companyOverview: '',
    valueProposition: '',
    targetCustomers: '',
    revenueModel: '',
    keyDifferentiators: [] as string[],
    industry: '',
    marketSegment: '',
    website: '',
  });

  const [newDifferentiator, setNewDifferentiator] = useState('');

  useEffect(() => {
    fetchProfile();
    setPortalContainer(document.body);
  }, []);

  async function fetchProfile() {
    try {
      const response = await fetch('/api/v1/knowledge/company-profile');
      if (response.ok) {
        const data = await response.json();
        setOrganizationName(data.organizationName || '');
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            summary: data.profile.summary || '',
            companyOverview: data.profile.companyOverview || '',
            valueProposition: data.profile.valueProposition || '',
            targetCustomers: data.profile.targetCustomers || '',
            revenueModel: data.profile.revenueModel || '',
            keyDifferentiators: data.profile.keyDifferentiators || [],
            industry: data.profile.industry || '',
            marketSegment: data.profile.marketSegment || '',
            website: data.profile.website || '',
          });
        }
      }
    } catch (_err) {
      setError('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function addDifferentiator() {
    if (newDifferentiator.trim()) {
      updateField('keyDifferentiators', [...formData.keyDifferentiators, newDifferentiator.trim()]);
      setNewDifferentiator('');
    }
  }

  function removeDifferentiator(index: number) {
    updateField('keyDifferentiators', formData.keyDifferentiators.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        summary: formData.summary || null,
        companyOverview: formData.companyOverview || null,
        valueProposition: formData.valueProposition || null,
        targetCustomers: formData.targetCustomers || null,
        revenueModel: formData.revenueModel || null,
        keyDifferentiators: formData.keyDifferentiators,
        industry: formData.industry || null,
        marketSegment: formData.marketSegment || null,
        website: formData.website || null,
      };

      const response = await fetch('/api/v1/knowledge/company-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      const data = await response.json();
      setProfile(data);
      setSuccess('Company profile saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function openGenerateModal() {
    // Pre-fill the confirmation form with current values
    setConfirmCompanyName(organizationName || '');
    setConfirmWebsite(formData.website || '');
    setConfirmIndustry(formData.industry || '');
    setShowConfirmModal(true);
  }

  async function handleConfirmedGenerate() {
    if (!confirmCompanyName.trim()) {
      setError('Please enter your company name');
      return;
    }

    setShowConfirmModal(false);
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/knowledge/company-profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: confirmCompanyName.trim(),
          website: confirmWebsite || undefined,
          industry: confirmIndustry || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setFormData({
        summary: data.profile.summary || '',
        companyOverview: data.profile.companyOverview || '',
        valueProposition: data.profile.valueProposition || '',
        targetCustomers: data.profile.targetCustomers || '',
        revenueModel: data.profile.revenueModel || '',
        keyDifferentiators: data.profile.keyDifferentiators || [],
        industry: data.profile.industry || '',
        marketSegment: data.profile.marketSegment || '',
        website: data.profile.website || '',
      });
      setSuccess('Company profile generated! Please review and edit as needed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate profile');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Company Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your company information is used to personalize proposals.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={openGenerateModal}
            disabled={generating}
          >
            {generating ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                Generate with AI
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {profile?.generatedBy === 'ai' && !profile.isVerified && (
        <Alert>
          <AlertDescription>
            This profile was generated by AI. Please review and verify the information is accurate.
            {profile.confidence && (
              <span className="ml-2 font-medium">
                Confidence: {profile.confidence}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Summary Card */}
      {formData.summary && (
        <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-200">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Summary */}
              <p className="text-gray-700 leading-relaxed">{formData.summary}</p>

              {/* Key Info Row */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
                {formData.industry && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Industry:</span>
                    <span className="font-medium text-gray-900">{formData.industry}</span>
                  </div>
                )}
                {formData.marketSegment && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Segment:</span>
                    <span className="font-medium text-gray-900">{formData.marketSegment}</span>
                  </div>
                )}
                {formData.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Website:</span>
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {formData.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {/* Differentiators */}
              {formData.keyDifferentiators.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Differentiators</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keyDifferentiators.slice(0, 4).map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {item.length > 50 ? item.substring(0, 50) + '...' : item}
                      </span>
                    ))}
                    {formData.keyDifferentiators.length > 4 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{formData.keyDifferentiators.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Basic company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Executive Summary</Label>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="A brief summary of your company..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyOverview">Company Overview</Label>
              <textarea
                id="companyOverview"
                value={formData.companyOverview}
                onChange={(e) => updateField('companyOverview', e.target.value)}
                placeholder="Detailed description of your company..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  placeholder="e.g., Software, Healthcare"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketSegment">Market Segment</Label>
                <select
                  id="marketSegment"
                  value={formData.marketSegment}
                  onChange={(e) => updateField('marketSegment', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Select segment</option>
                  <option value="SMB">SMB</option>
                  <option value="Mid-Market">Mid-Market</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="All">All Segments</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Model</CardTitle>
            <CardDescription>How your company creates and delivers value</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valueProposition">Value Proposition</Label>
              <textarea
                id="valueProposition"
                value={formData.valueProposition}
                onChange={(e) => updateField('valueProposition', e.target.value)}
                placeholder="What unique value do you provide to customers?"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCustomers">Target Customers</Label>
              <textarea
                id="targetCustomers"
                value={formData.targetCustomers}
                onChange={(e) => updateField('targetCustomers', e.target.value)}
                placeholder="Who are your ideal customers?"
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueModel">Revenue Model</Label>
              <Input
                id="revenueModel"
                value={formData.revenueModel}
                onChange={(e) => updateField('revenueModel', e.target.value)}
                placeholder="e.g., SaaS subscription, Professional services"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Key Differentiators</CardTitle>
            <CardDescription>What sets you apart from competitors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newDifferentiator}
                onChange={(e) => setNewDifferentiator(e.target.value)}
                placeholder="Add a key differentiator..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDifferentiator(); } }}
              />
              <Button type="button" variant="outline" onClick={addDifferentiator}>Add</Button>
            </div>
            {formData.keyDifferentiators.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keyDifferentiators.map((item, index) => (
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Additional company information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {profile && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {profile.lastEditedAt ? new Date(profile.lastEditedAt).toLocaleString() : 'Never'}
          {' '}| Version: {profile.version}
        </p>
      )}

      {/* Company Name Confirmation Modal */}
      {showConfirmModal && portalContainer && createPortal(
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
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
            }}
            onClick={() => setShowConfirmModal(false)}
          />
          <div
            className="bg-white rounded-lg shadow-xl mx-4 w-full max-w-md"
            style={{ position: 'relative', zIndex: 10000 }}
          >
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Confirm Your Company</h2>
              <p className="text-sm text-gray-500 mt-1">
                Please confirm your company details so AI can generate an accurate profile.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-company-name">Company Name *</Label>
                <Input
                  id="confirm-company-name"
                  value={confirmCompanyName}
                  onChange={(e) => setConfirmCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  This is YOUR company, not the software you&apos;re using.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-website">Website (optional)</Label>
                <Input
                  id="confirm-website"
                  type="url"
                  value={confirmWebsite}
                  onChange={(e) => setConfirmWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                />
                <p className="text-xs text-gray-500">
                  Helps AI find accurate information about your company.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-industry">Industry (optional)</Label>
                <Input
                  id="confirm-industry"
                  value={confirmIndustry}
                  onChange={(e) => setConfirmIndustry(e.target.value)}
                  placeholder="e.g., Software, Healthcare, Finance"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmedGenerate} disabled={!confirmCompanyName.trim()}>
                Generate Profile
              </Button>
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </div>
  );
}
