/**
 * Context Assembly Engine (Basic Version)
 *
 * Assembles context from various sources for proposal generation.
 * Sprint 2: Basic implementation with opportunity context
 * Sprint 3: Full RAG with knowledge base retrieval
 */

import { prisma } from '@/lib/db/prisma';

// ============================================
// TYPES
// ============================================

export interface AssembledContext {
  // Organization context
  organizationName: string;
  brandContext?: BrandContext;

  // Opportunity context
  opportunityName: string;
  opportunityDescription?: string;
  dealSummary?: Record<string, unknown>;

  // Deal context items
  dealContext: DealContextItem[];

  // Knowledge base (Sprint 3)
  products?: unknown[];
  battlecards?: unknown[];

  // User prompt
  userPrompt: string;

  // Metadata
  tokenEstimate: number;
  truncated: boolean;
  truncationWarnings: string[];
}

export interface BrandContext {
  companyName: string;
  tone?: string;
  formality?: string;
  keyMessages?: string[];
}

export interface DealContextItem {
  type: string;
  content: string;
  source?: string;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_CONTEXT_TOKENS = 100000; // Conservative limit for Claude
const TOKENS_PER_CHAR = 0.25; // Rough estimate

// Token budgets by category (percentages of available space)
const TOKEN_BUDGETS = {
  brandContext: 0.05, // 5%
  dealContext: 0.40, // 40%
  products: 0.30, // 30%
  battlecards: 0.20, // 20%
  playbooks: 0.05, // 5%
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Assemble context for proposal generation
 */
export async function assembleContext(
  organizationId: string,
  opportunityId: string,
  userPrompt: string
): Promise<AssembledContext> {
  const truncationWarnings: string[] = [];

  // Fetch organization
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      settings: true,
    },
  });

  if (!organization) {
    throw new Error('Organization not found');
  }

  // Fetch opportunity with deal context
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      dealContextItems: {
        select: {
          sourceType: true,
          rawContent: true,
          sourceMetadata: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Limit to most recent
      },
    },
  });

  if (!opportunity) {
    throw new Error('Opportunity not found');
  }

  // Fetch brand settings (if available)
  const brandSettings = await prisma.brandSettings.findUnique({
    where: { organizationId },
    select: {
      tone: true,
      formality: true,
      keyMessages: true,
    },
  });

  // Build brand context
  const brandContext: BrandContext = {
    companyName: organization.name,
    tone: brandSettings?.tone || undefined,
    formality: brandSettings?.formality || undefined,
    keyMessages: brandSettings?.keyMessages || undefined,
  };

  // Build deal context items
  const dealContext: DealContextItem[] = opportunity.dealContextItems.map(
    (item: { sourceType: string; rawContent: string; sourceMetadata: unknown }) => ({
      type: item.sourceType,
      content: item.rawContent,
      source: typeof item.sourceMetadata === 'object' && item.sourceMetadata !== null
        ? (item.sourceMetadata as Record<string, string>).name || undefined
        : undefined,
    })
  );

  // Estimate tokens
  const contextString = buildContextString({
    organizationName: organization.name,
    brandContext,
    opportunityName: opportunity.name,
    opportunityDescription: opportunity.description || undefined,
    dealSummary: opportunity.dealSummary as Record<string, unknown> | undefined,
    dealContext,
    userPrompt,
  });

  const tokenEstimate = Math.ceil(contextString.length * TOKENS_PER_CHAR);
  const truncated = tokenEstimate > MAX_CONTEXT_TOKENS;

  if (truncated) {
    truncationWarnings.push(
      `Context was truncated. Estimated ${tokenEstimate} tokens exceeds limit of ${MAX_CONTEXT_TOKENS}.`
    );
  }

  return {
    organizationName: organization.name,
    brandContext,
    opportunityName: opportunity.name,
    opportunityDescription: opportunity.description || undefined,
    dealSummary: opportunity.dealSummary as Record<string, unknown> | undefined,
    dealContext,
    userPrompt,
    tokenEstimate,
    truncated,
    truncationWarnings,
  };
}

/**
 * Build system prompt with assembled context
 */
export function buildSystemPrompt(context: AssembledContext): string {
  const parts: string[] = [];

  // Base instructions
  parts.push(`You are an expert sales proposal writer for ${context.organizationName}.`);
  parts.push('Your job is to generate professional, compelling sales proposals.');

  // Brand context
  if (context.brandContext) {
    if (context.brandContext.tone) {
      parts.push(`\nBRAND TONE: ${context.brandContext.tone}`);
    }
    if (context.brandContext.formality) {
      parts.push(`BRAND FORMALITY: ${context.brandContext.formality}`);
    }
    if (context.brandContext.keyMessages && context.brandContext.keyMessages.length > 0) {
      parts.push(`\nKEY MESSAGES:\n${context.brandContext.keyMessages.map(m => `- ${m}`).join('\n')}`);
    }
  }

  // Opportunity context
  parts.push(`\nOPPORTUNITY: ${context.opportunityName}`);
  if (context.opportunityDescription) {
    parts.push(`DESCRIPTION: ${context.opportunityDescription}`);
  }

  // Deal context
  if (context.dealContext.length > 0) {
    parts.push('\nDEAL CONTEXT:');
    context.dealContext.forEach((item, index) => {
      parts.push(`[${index + 1}] ${item.type}: ${item.content}`);
    });
  }

  // Deal summary
  if (context.dealSummary && Object.keys(context.dealSummary).length > 0) {
    parts.push('\nDEAL SUMMARY:');
    parts.push(JSON.stringify(context.dealSummary, null, 2));
  }

  // Output instructions
  parts.push(`
OUTPUT FORMAT:
You must respond with valid JSON containing an array of slides. Each slide has:
- slideNumber: number (1-indexed)
- type: one of "title", "executive_summary", "solution", "investment", "next_steps", "custom"
- title: string (slide title)
- content: object with relevant fields (heading, subheading, bullets, body, table, callout)

GUIDELINES:
- Be concise and impactful
- Use active voice
- Focus on benefits, not features
- For pricing: ONLY use specific numbers if explicitly provided. Otherwise use [ENTER VALUE] placeholder
- Never hallucinate company names, prices, or specific claims

IMPORTANT: Your entire response must be valid JSON. Do not include any text before or after the JSON array.`);

  return parts.join('\n');
}

// ============================================
// HELPERS
// ============================================

function buildContextString(context: Partial<AssembledContext>): string {
  return JSON.stringify(context);
}

/**
 * Estimate token count for a string
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length * TOKENS_PER_CHAR);
}

/**
 * Truncate text to fit within token budget
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number
): { text: string; truncated: boolean } {
  const estimatedTokens = estimateTokens(text);

  if (estimatedTokens <= maxTokens) {
    return { text, truncated: false };
  }

  // Truncate to approximate character limit
  const maxChars = Math.floor(maxTokens / TOKENS_PER_CHAR);
  const truncatedText = text.substring(0, maxChars) + '... [truncated]';

  return { text: truncatedText, truncated: true };
}
