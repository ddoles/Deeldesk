'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Organization } from '@prisma/client';

interface Props {
  organization: Organization;
  canEdit: boolean;
}

export function OrgSettingsForm({ organization, canEdit }: Props) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/v1/organizations/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
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

      {canEdit && (
        <Button type="submit" disabled={isLoading || name === organization.name}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
    </form>
  );
}
