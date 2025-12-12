import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { getProposalJobStatus, type ProposalJobProgress } from '@/lib/queue';

/**
 * GET /api/v1/proposals/[id]/stream
 *
 * Server-Sent Events endpoint for real-time proposal generation progress.
 *
 * Events:
 * - progress: { stage, slideIndex, totalSlides, message }
 * - complete: { proposalId }
 * - error: { message }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id: proposalId } = await params;

  // Verify proposal belongs to user's organization
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      organizationId: session.user.organizationId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!proposal) {
    return new Response('Proposal not found', { status: 404 });
  }

  // If proposal is already complete or errored, return immediately
  if (proposal.status === 'complete') {
    return new Response(
      `data: ${JSON.stringify({ type: 'complete', proposalId })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );
  }

  if (proposal.status === 'error') {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Generation failed' })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let lastStage: string | null = null;
      let pollCount = 0;
      const maxPolls = 120; // 2 minutes at 1 poll/second

      const poll = async () => {
        try {
          // Check job status from BullMQ
          const jobStatus = await getProposalJobStatus(proposalId);

          if (jobStatus) {
            // Only send if stage changed
            if (jobStatus.stage !== lastStage) {
              lastStage = jobStatus.stage;

              if (jobStatus.stage === 'complete') {
                sendEvent({ type: 'complete', proposalId });
                controller.close();
                return;
              }

              if (jobStatus.stage === 'error') {
                sendEvent({
                  type: 'error',
                  message: jobStatus.message || 'Generation failed',
                });
                controller.close();
                return;
              }

              sendEvent({
                type: 'progress',
                stage: jobStatus.stage,
                slideIndex: jobStatus.slideIndex,
                totalSlides: jobStatus.totalSlides,
              });
            }
          } else {
            // Job not found - check proposal status directly
            const currentProposal = await prisma.proposal.findUnique({
              where: { id: proposalId },
              select: { status: true, errorMessage: true },
            });

            if (currentProposal?.status === 'complete') {
              sendEvent({ type: 'complete', proposalId });
              controller.close();
              return;
            }

            if (currentProposal?.status === 'error') {
              sendEvent({
                type: 'error',
                message: currentProposal.errorMessage || 'Generation failed',
              });
              controller.close();
              return;
            }
          }

          pollCount++;
          if (pollCount >= maxPolls) {
            sendEvent({ type: 'error', message: 'Generation timeout' });
            controller.close();
            return;
          }

          // Continue polling
          setTimeout(poll, 1000);
        } catch (error) {
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.close();
        }
      };

      // Start polling
      poll();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
