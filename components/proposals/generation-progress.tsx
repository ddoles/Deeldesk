'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================
// TYPES
// ============================================

type GenerationStage =
  | 'queued'
  | 'understanding'
  | 'crafting'
  | 'generating'
  | 'complete'
  | 'error';

interface ProgressData {
  stage: GenerationStage;
  slideIndex?: number;
  totalSlides?: number;
  message?: string;
}

interface GenerationProgressProps {
  proposalId: string;
  onComplete: () => void;
  onError: (message: string) => void;
}

// ============================================
// STAGE CONFIGURATION
// ============================================

const stageConfig: Record<
  GenerationStage,
  { label: string; description: string; progress: number }
> = {
  queued: {
    label: 'Queued',
    description: 'Waiting to start generation...',
    progress: 0,
  },
  understanding: {
    label: 'Understanding',
    description: 'Analyzing your request...',
    progress: 20,
  },
  crafting: {
    label: 'Crafting',
    description: 'Designing proposal structure...',
    progress: 40,
  },
  generating: {
    label: 'Generating',
    description: 'Creating slides...',
    progress: 60,
  },
  complete: {
    label: 'Complete',
    description: 'Proposal ready!',
    progress: 100,
  },
  error: {
    label: 'Error',
    description: 'Generation failed',
    progress: 0,
  },
};

// ============================================
// COMPONENT
// ============================================

export function GenerationProgress({
  proposalId,
  onComplete,
  onError,
}: GenerationProgressProps) {
  const [progress, setProgress] = useState<ProgressData>({ stage: 'queued' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/v1/proposals/${proposalId}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          setProgress({
            stage: data.stage,
            slideIndex: data.slideIndex,
            totalSlides: data.totalSlides,
          });
        } else if (data.type === 'complete') {
          setProgress({ stage: 'complete' });
          eventSource.close();
          onComplete();
        } else if (data.type === 'error') {
          setError(data.message || 'Generation failed');
          setProgress({ stage: 'error', message: data.message });
          eventSource.close();
          onError(data.message || 'Generation failed');
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      setError('Connection lost. Please refresh the page.');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [proposalId, onComplete, onError]);

  const config = stageConfig[progress.stage];
  const slideProgress =
    progress.stage === 'generating' && progress.totalSlides
      ? Math.round(
          40 + (progress.slideIndex! / progress.totalSlides) * 40
        )
      : config.progress;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Generating Proposal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <div className="text-center">
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
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : progress.stage === 'complete' ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-green-600 font-medium">Proposal ready!</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{config.label}</span>
                <span className="text-gray-500">{slideProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${slideProgress}%` }}
                />
              </div>
            </div>

            {/* Status description */}
            <p className="text-center text-gray-600">{config.description}</p>

            {/* Slide progress */}
            {progress.stage === 'generating' &&
              progress.slideIndex !== undefined && (
                <p className="text-center text-sm text-gray-500">
                  Slide {progress.slideIndex} of {progress.totalSlides}
                </p>
              )}

            {/* Loading animation */}
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
