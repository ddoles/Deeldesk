'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewProposalPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;

  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create proposal');
        return;
      }

      // Redirect to the proposal view (which will show progress)
      router.push(`/proposals/${data.id}`);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const examplePrompts = [
    'Create a proposal for a 50-user enterprise license with premium support',
    'Generate a proposal for our standard SaaS offering with annual billing',
    'Create a competitive proposal highlighting our AI capabilities',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Proposal</h1>
        <p className="text-sm text-gray-500">
          Describe what you want in your proposal and our AI will generate it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Prompt</CardTitle>
          <CardDescription>
            Describe the proposal you want to create. Include details like
            product, pricing, customer needs, and any specific requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="prompt">Your Request</Label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a proposal for Acme Corp for our enterprise plan with 100 users, 24/7 support, and custom integrations..."
                className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500">
                Minimum 10 characters. The more detail you provide, the better
                the proposal.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || prompt.length < 10}>
                {isSubmitting ? 'Starting Generation...' : 'Generate Proposal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example Prompts</CardTitle>
          <CardDescription>
            Click any example to use it as a starting point
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="w-full text-left p-3 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
