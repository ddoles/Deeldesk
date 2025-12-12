/**
 * Queue Module - BullMQ Job Processing
 *
 * Usage:
 * ```typescript
 * import { enqueueProposalGeneration, startProposalWorker } from '@/lib/queue';
 *
 * // Enqueue a job
 * await enqueueProposalGeneration({ proposalId, organizationId, ... });
 *
 * // Start the worker (in a separate process or on server startup)
 * startProposalWorker();
 * ```
 */

export {
  getProposalQueue,
  enqueueProposalGeneration,
  getProposalJobStatus,
  startProposalWorker,
  stopProposalWorker,
  type ProposalJobData,
  type ProposalJobProgress,
} from './proposal-queue';

export {
  getRedisConnection,
  createRedisConnection,
  closeRedisConnection,
} from './redis';
