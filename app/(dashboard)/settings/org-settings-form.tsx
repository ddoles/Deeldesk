'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organization } from '@prisma/client';

interface Props {
  organization: Organization;
  canEdit: boolean;
}

type LLMProvider = 'anthropic-direct' | 'aws-bedrock';

export function OrgSettingsForm({ organization, canEdit }: Props) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const settings = organization.settings as Record<string, unknown> | null;
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(
    (settings?.llmProvider as LLMProvider) || 'anthropic-direct'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canUseBedrock = organization.planTier === 'team' || organization.planTier === 'enterprise';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: Record<string, unknown> = {};

      if (name !== organization.name) {
        payload.name = name;
      }

      const currentProvider = (settings?.llmProvider as LLMProvider) || 'anthropic-direct';
      if (llmProvider !== currentProvider) {
        payload.settings = { llmProvider };
      }

      if (Object.keys(payload).length === 0) {
        setSuccess(true);
        return;
      }

      const response = await fetch('/api/v1/organizations/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update organization');
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    name !== organization.name ||
    llmProvider !== ((settings?.llmProvider as LLMProvider) || 'anthropic-direct');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>Organization updated successfully</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit || isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Organization Slug</Label>
        <Input
          id="slug"
          type="text"
          value={organization.slug}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">The slug cannot be changed</p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
          <CardDescription>
            Choose which AI provider to use for proposal generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="llmProvider"
                value="anthropic-direct"
                checked={llmProvider === 'anthropic-direct'}
                onChange={() => setLlmProvider('anthropic-direct')}
                disabled={!canEdit}
                className="mt-1"
              />
              <div>
                <p className="font-medium">Anthropic Direct</p>
                <p className="text-sm text-gray-500">
                  Default provider. Uses Anthropic&apos;s API directly. Best for most use cases.
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 ${canUseBedrock ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
              <input
                type="radio"
                name="llmProvider"
                value="aws-bedrock"
                checked={llmProvider === 'aws-bedrock'}
                onChange={() => canUseBedrock && setLlmProvider('aws-bedrock')}
                disabled={!canEdit || !canUseBedrock}
                className="mt-1"
              />
              <div>
                <p className="font-medium">
                  AWS Bedrock
                  {!canUseBedrock && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Team/Enterprise only
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  Enterprise-grade data sovereignty. Your data stays within your AWS account.
                </p>
              </div>
            </label>
          </div>

          {llmProvider === 'aws-bedrock' && canUseBedrock && (
            <Alert>
              <AlertDescription>
                AWS Bedrock requires AWS credentials to be configured on the server. Contact your administrator if you encounter issues.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <Button type="submit" disabled={isLoading || !hasChanges} className="mt-6">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
    </form>
  );
}
