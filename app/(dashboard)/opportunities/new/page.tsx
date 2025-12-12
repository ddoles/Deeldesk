'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewOpportunityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          expectedValue: expectedValue ? parseFloat(expectedValue) : undefined,
          expectedCloseDate: expectedCloseDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create opportunity');
        return;
      }

      router.push(`/opportunities/${data.id}`);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Opportunity</h1>
        <p className="text-sm text-gray-500">
          Create an opportunity to start generating AI-powered proposals
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity Details</CardTitle>
          <CardDescription>
            Enter the basic information about this sales opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Opportunity Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Acme Corp - Enterprise License"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Brief description of the opportunity, key stakeholders, or specific requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expectedValue">Expected Value ($)</Label>
                <Input
                  id="expectedValue"
                  type="number"
                  placeholder="100000"
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(e.target.value)}
                  disabled={isLoading}
                  min="0"
                  step="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? 'Creating...' : 'Create Opportunity'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
