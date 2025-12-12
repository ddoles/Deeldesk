'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlideViewer, SlideThumbnails } from '@/components/proposals/slide-viewer';
import { GenerationProgress } from '@/components/proposals/generation-progress';

interface Slide {
  slideNumber: number;
  type: string;
  title: string;
  content: {
    heading?: string;
    subheading?: string;
    bullets?: string[];
    body?: string;
    table?: {
      headers: string[];
      rows: string[][];
      footer?: string;
    };
    callout?: string;
  };
}

interface Proposal {
  id: string;
  version: number;
  status: string;
  prompt: string | null;
  slides: Slide[];
  createdAt: string;
  opportunity: {
    id: string;
    name: string;
    description: string | null;
  };
}

export default function ProposalViewerPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchProposal = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/proposals/${proposalId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Proposal not found');
        } else {
          setError('Failed to load proposal');
        }
        return;
      }
      const data = await response.json();
      setProposal(data);
    } catch {
      setError('Failed to load proposal');
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const handleGenerationComplete = useCallback(() => {
    fetchProposal();
  }, [fetchProposal]);

  const handleGenerationError = useCallback((message: string) => {
    setError(message);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading proposal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  // Show progress if still generating
  if (proposal.status === 'queued' || proposal.status === 'generating') {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <GenerationProgress
          proposalId={proposalId}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
        />
      </div>
    );
  }

  // Show error state
  if (proposal.status === 'error') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Generation Failed
            </h3>
            <p className="text-gray-500 mb-4">
              There was an error generating this proposal.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    `/opportunities/${proposal.opportunity.id}/proposals/new`
                  )
                }
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slides = proposal.slides as Slide[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link
              href={`/opportunities/${proposal.opportunity.id}`}
              className="hover:text-gray-700"
            >
              {proposal.opportunity.name}
            </Link>
            <span>/</span>
            <span>Proposal v{proposal.version}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Proposal v{proposal.version}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled>
            Export PPTX
          </Button>
          <Button
            onClick={() =>
              router.push(
                `/opportunities/${proposal.opportunity.id}/proposals/new`
              )
            }
          >
            Create New Version
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Slide thumbnails (sidebar) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Slides</CardTitle>
            </CardHeader>
            <CardContent>
              <SlideThumbnails
                slides={slides}
                currentSlide={currentSlide}
                onSlideChange={setCurrentSlide}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main slide viewer */}
        <div className="lg:col-span-3">
          <SlideViewer
            slides={slides}
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
          />
        </div>
      </div>

      {/* Prompt used */}
      {proposal.prompt && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Generation Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{proposal.prompt}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
