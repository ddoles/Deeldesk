/**
 * Proposal Generation Queue
 *
 * BullMQ queue for async proposal generation jobs.
 */

import { Queue, Worker, Job } from 'bullmq';
import { createRedisConnection } from './redis';
import { prisma } from '@/lib/db/prisma';
import { getProviderForOrganization } from '@/lib/ai';
import { generateProposalWithContext } from '@/lib/ai/proposal-generator';
import type { ProposalStatus } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface ProposalJobData {
  proposalId: string;
  organizationId: string;
  userId: string;
  opportunityId: string;
  prompt: string;
}

export interface ProposalJobProgress {
  stage: 'queued' | 'understanding' | 'crafting' | 'generating' | 'complete' | 'error';
  slideIndex?: number;
  totalSlides?: number;
  message?: string;
}

// ============================================
// QUEUE SETUP
// ============================================

const QUEUE_NAME = 'proposal-generation';

let proposalQueue: Queue<ProposalJobData> | null = null;

export function getProposalQueue(): Queue<ProposalJobData> {
  if (!proposalQueue) {
    proposalQueue = new Queue<ProposalJobData>(QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 50, // Keep last 50 failed jobs
        },
      },
    });
  }
  return proposalQueue;
}

// ============================================
// JOB MANAGEMENT
// ============================================

/**
 * Add a proposal generation job to the queue
 */
export async function enqueueProposalGeneration(
  data: ProposalJobData
): Promise<Job<ProposalJobData>> {
  const queue = getProposalQueue();

  // Update proposal status to queued
  await prisma.proposal.update({
    where: { id: data.proposalId },
    data: { status: 'queued' },
  });

  // Add job to queue
  const job = await queue.add('generate', data, {
    jobId: data.proposalId, // Use proposal ID as job ID for easy tracking
  });

  return job;
}

/**
 * Get the status of a proposal job
 */
export async function getProposalJobStatus(
  proposalId: string
): Promise<ProposalJobProgress | null> {
  const queue = getProposalQueue();
  const job = await queue.getJob(proposalId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress as ProposalJobProgress | undefined;

  if (state === 'completed') {
    return { stage: 'complete' };
  } else if (state === 'failed') {
    return { stage: 'error', message: job.failedReason };
  } else if (progress) {
    return progress;
  } else if (state === 'waiting' || state === 'delayed') {
    return { stage: 'queued' };
  } else {
    return { stage: 'understanding' };
  }
}

// ============================================
// WORKER
// ============================================

let proposalWorker: Worker<ProposalJobData> | null = null;

/**
 * Start the proposal generation worker
 */
export function startProposalWorker(): Worker<ProposalJobData> {
  if (proposalWorker) {
    return proposalWorker;
  }

  proposalWorker = new Worker<ProposalJobData>(
    QUEUE_NAME,
    async (job) => {
      const { proposalId, organizationId, opportunityId, prompt } = job.data;

      try {
        // Update status to generating
        await updateProposalStatus(proposalId, 'generating');
        await job.updateProgress({ stage: 'understanding' });

        // Get LLM provider for this organization
        const provider = await getProviderForOrganization(organizationId);

        // Update progress
        await job.updateProgress({ stage: 'crafting' });

        // Generate the proposal slides with full context
        const { slides, context } = await generateProposalWithContext(
          provider,
          organizationId,
          opportunityId,
          prompt,
          async (progress) => {
            await job.updateProgress({
              stage: 'generating',
              slideIndex: progress.slideIndex,
              totalSlides: progress.totalSlides,
            });
          }
        );

        // Save the generated slides
        await prisma.proposal.update({
          where: { id: proposalId },
          data: {
            slides: JSON.parse(JSON.stringify(slides)),
            status: 'complete',
            generationMetadata: {
              completedAt: new Date().toISOString(),
              provider: provider.providerId,
              model: provider.getMetadata().model,
              contextTokens: context.tokenEstimate,
              contextTruncated: context.truncated,
            },
          },
        });

        await job.updateProgress({ stage: 'complete' });

        return { success: true, slideCount: slides.length };
      } catch (error) {
        // Update proposal with error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await prisma.proposal.update({
          where: { id: proposalId },
          data: {
            status: 'error',
            errorMessage,
            errorDetails: {
              timestamp: new Date().toISOString(),
              error: errorMessage,
            },
          },
        });

        throw error; // Re-throw to trigger retry logic
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 2, // Process up to 2 jobs concurrently
    }
  );

  // Worker event handlers
  proposalWorker.on('completed', (job) => {
    console.log(`Proposal ${job.data.proposalId} generation completed`);
  });

  proposalWorker.on('failed', (job, error) => {
    console.error(`Proposal ${job?.data.proposalId} generation failed:`, error);
  });

  return proposalWorker;
}

/**
 * Stop the proposal worker
 */
export async function stopProposalWorker(): Promise<void> {
  if (proposalWorker) {
    await proposalWorker.close();
    proposalWorker = null;
  }
}

// ============================================
// HELPERS
// ============================================

async function updateProposalStatus(
  proposalId: string,
  status: ProposalStatus
): Promise<void> {
  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status },
  });
}
