/**
 * Context Assembly Engine
 *
 * Assembles context from various sources for proposal generation.
 * Implements RAG (Retrieval-Augmented Generation) with knowledge base.
 *
 * Context Layers (per CLAUDE.md):
 * 1. Company Profile (foundational, never truncated)
 * 2. Brand Context (foundational, never truncated)
 * 3. Session Context (prompt, template, preferences)
 * 4. Deal Context (opportunity-specific info)
 * 5. Business Context (products, competitors, playbooks)
 */

import { prisma } from '@/lib/db/prisma';
import {
  generateEmbedding,
  searchProducts,
  searchBattlecards,
  SearchResult,
} from './embeddings';

// ============================================
// TYPES
// ============================================

export interface AssembledContext {
  // Organization context
  organizationName: string;
  brandContext?: BrandContext;
  companyProfile?: CompanyProfileContext;

  // Opportunity context
  opportunityName: string;
  opportunityDescription?: string;
  dealSummary?: Record<string, unknown>;

  // Deal context items
  dealContext: DealContextItem[];

  // Knowledge base (RAG-retrieved)
  products: ProductContext[];
  battlecards: BattlecardContext[];

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
  contentStyle?: string;
  competitivePositioning?: string;
}

export interface CompanyProfileContext {
  summary?: string;
  valueProposition?: string;
  targetCustomers?: string;
  keyDifferentiators?: string[];
}

export interface DealContextItem {
  type: string;
  content: string;
  source?: string;
}

export interface ProductContext {
  name: string;
  description?: string;
  category?: string;
  relevanceScore: number;
}

export interface BattlecardContext {
  competitorName: string;
  strengths?: string[];
  weaknesses?: string[];
  keyDifferentiators?: string[];
  relevanceScore: number;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_CONTEXT_TOKENS = 100000; // Conservative limit for Claude
const TOKENS_PER_CHAR = 0.25; // Rough estimate

// Token budgets by category (percentages of remaining space after foundational)
const _TOKEN_BUDGETS = {
  companyProfile: 500, // Fixed ~500 tokens (foundational)
  brandContext: 200, // Fixed ~200 tokens (foundational)
  dealContext: 0.40, // 40% of remaining
  products: 0.30, // 30% of remaining
  battlecards: 0.20, // 20% of remaining
  playbooks: 0.10, // 10% of remaining
};

// RAG search settings
const RAG_SETTINGS = {
  maxProducts: 5,
  maxBattlecards: 3,
  minSimilarity: 0.4,
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Assemble context for proposal generation with RAG retrieval
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

  // Fetch foundational context (company profile and brand settings)
  const [companyProfile, brandSettings] = await Promise.all([
    prisma.companyProfile.findUnique({
      where: { organizationId },
      select: {
        summary: true,
        valueProposition: true,
        targetCustomers: true,
        keyDifferentiators: true,
      },
    }),
    prisma.brandSettings.findUnique({
      where: { organizationId },
      select: {
        tone: true,
        formality: true,
        keyMessages: true,
        contentStyle: true,
        competitivePositioning: true,
      },
    }),
  ]);

  // Build brand context
  const brandContext: BrandContext = {
    companyName: organization.name,
    tone: brandSettings?.tone || undefined,
    formality: brandSettings?.formality || undefined,
    keyMessages: brandSettings?.keyMessages || undefined,
    contentStyle: brandSettings?.contentStyle || undefined,
    competitivePositioning: brandSettings?.competitivePositioning || undefined,
  };

  // Build company profile context
  const companyProfileContext: CompanyProfileContext | undefined = companyProfile
    ? {
        summary: companyProfile.summary || undefined,
        valueProposition: companyProfile.valueProposition || undefined,
        targetCustomers: companyProfile.targetCustomers || undefined,
        keyDifferentiators: companyProfile.keyDifferentiators || undefined,
      }
    : undefined;

  // Build deal context items
  const dealContext: DealContextItem[] = opportunity.dealContextItems.map(
    (item: { sourceType: string; rawContent: string; sourceMetadata: unknown }) => ({
      type: item.sourceType,
      content: item.rawContent,
      source:
        typeof item.sourceMetadata === 'object' && item.sourceMetadata !== null
          ? (item.sourceMetadata as Record<string, string>).name || undefined
          : undefined,
    })
  );

  // RAG retrieval - search knowledge base based on user prompt
  let products: ProductContext[] = [];
  let battlecards: BattlecardContext[] = [];

  try {
    // Generate embedding for the user prompt
    const { embedding } = await generateEmbedding(userPrompt);

    // Search for relevant products and battlecards in parallel
    const [productResults, battlecardResults] = await Promise.all([
      searchProducts(
        organizationId,
        embedding,
        RAG_SETTINGS.maxProducts,
        RAG_SETTINGS.minSimilarity
      ),
      searchBattlecards(
        organizationId,
        embedding,
        RAG_SETTINGS.maxBattlecards,
        RAG_SETTINGS.minSimilarity
      ),
    ]);

    // Map product results
    products = productResults.map((r: SearchResult<{ id: string; name: string; description: string | null; category: string | null }>) => ({
      name: r.item.name,
      description: r.item.description || undefined,
      category: r.item.category || undefined,
      relevanceScore: r.similarity,
    }));

    // Map battlecard results - fetch full structured content
    if (battlecardResults.length > 0) {
      const battlecardIds = battlecardResults.map((r: SearchResult<{ id: string; competitorName: string; rawContent: string | null }>) => r.item.id);
      const fullBattlecards = await prisma.battlecard.findMany({
        where: { id: { in: battlecardIds } },
        select: {
          id: true,
          competitorName: true,
          structuredContent: true,
        },
      });

      const battlecardMap = new Map(fullBattlecards.map((b) => [b.id, b]));

      battlecards = battlecardResults.map((r: SearchResult<{ id: string; competitorName: string; rawContent: string | null }>) => {
        const full = battlecardMap.get(r.item.id);
        const structured = full?.structuredContent as {
          strengths?: string[];
          weaknesses?: string[];
          keyDifferentiators?: string[];
        } | null;

        return {
          competitorName: r.item.competitorName,
          strengths: structured?.strengths,
          weaknesses: structured?.weaknesses,
          keyDifferentiators: structured?.keyDifferentiators,
          relevanceScore: r.similarity,
        };
      });
    }
  } catch (error) {
    console.error('RAG retrieval failed, continuing without KB context:', error);
    truncationWarnings.push('Knowledge base search failed - using basic context only.');
  }

  // Estimate tokens
  const contextString = buildContextString({
    organizationName: organization.name,
    brandContext,
    companyProfile: companyProfileContext,
    opportunityName: opportunity.name,
    opportunityDescription: opportunity.description || undefined,
    dealSummary: opportunity.dealSummary as Record<string, unknown> | undefined,
    dealContext,
    products,
    battlecards,
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
    companyProfile: companyProfileContext,
    opportunityName: opportunity.name,
    opportunityDescription: opportunity.description || undefined,
    dealSummary: opportunity.dealSummary as Record<string, unknown> | undefined,
    dealContext,
    products,
    battlecards,
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

  // Company profile (foundational - never truncated)
  if (context.companyProfile) {
    parts.push('\n=== ABOUT YOUR COMPANY ===');
    if (context.companyProfile.summary) {
      parts.push(context.companyProfile.summary);
    }
    if (context.companyProfile.valueProposition) {
      parts.push(`\nVALUE PROPOSITION: ${context.companyProfile.valueProposition}`);
    }
    if (context.companyProfile.targetCustomers) {
      parts.push(`TARGET CUSTOMERS: ${context.companyProfile.targetCustomers}`);
    }
    if (context.companyProfile.keyDifferentiators && context.companyProfile.keyDifferentiators.length > 0) {
      parts.push(`KEY DIFFERENTIATORS:\n${context.companyProfile.keyDifferentiators.map((d) => `- ${d}`).join('\n')}`);
    }
  }

  // Brand context (foundational - never truncated)
  if (context.brandContext) {
    parts.push('\n=== BRAND GUIDELINES ===');
    if (context.brandContext.tone) {
      parts.push(`TONE: ${context.brandContext.tone}`);
    }
    if (context.brandContext.formality) {
      parts.push(`FORMALITY: ${context.brandContext.formality}`);
    }
    if (context.brandContext.contentStyle) {
      parts.push(`CONTENT STYLE: ${context.brandContext.contentStyle}`);
    }
    if (context.brandContext.competitivePositioning) {
      parts.push(`POSITIONING: ${context.brandContext.competitivePositioning}`);
    }
    if (context.brandContext.keyMessages && context.brandContext.keyMessages.length > 0) {
      parts.push(`\nKEY MESSAGES:\n${context.brandContext.keyMessages.map((m) => `- ${m}`).join('\n')}`);
    }
  }

  // Opportunity context
  parts.push('\n=== OPPORTUNITY ===');
  parts.push(`NAME: ${context.opportunityName}`);
  if (context.opportunityDescription) {
    parts.push(`DESCRIPTION: ${context.opportunityDescription}`);
  }

  // Deal context
  if (context.dealContext.length > 0) {
    parts.push('\n=== DEAL CONTEXT ===');
    parts.push('The following information was provided about this deal:');
    context.dealContext.forEach((item, index) => {
      const source = item.source ? ` (${item.source})` : '';
      parts.push(`\n[${index + 1}] ${item.type.replace('_', ' ').toUpperCase()}${source}:`);
      parts.push(item.content);
    });
  }

  // Deal summary
  if (context.dealSummary && Object.keys(context.dealSummary).length > 0) {
    parts.push('\n=== DEAL SUMMARY ===');
    parts.push(JSON.stringify(context.dealSummary, null, 2));
  }

  // Products (RAG-retrieved)
  if (context.products && context.products.length > 0) {
    parts.push('\n=== RELEVANT PRODUCTS ===');
    parts.push('These products from our catalog may be relevant to this proposal:');
    context.products.forEach((product, index) => {
      parts.push(`\n[${index + 1}] ${product.name}`);
      if (product.category) {
        parts.push(`   Category: ${product.category}`);
      }
      if (product.description) {
        parts.push(`   ${product.description}`);
      }
    });
  }

  // Battlecards (RAG-retrieved)
  if (context.battlecards && context.battlecards.length > 0) {
    parts.push('\n=== COMPETITIVE INTELLIGENCE ===');
    parts.push('Relevant competitor information:');
    context.battlecards.forEach((bc) => {
      parts.push(`\nCOMPETITOR: ${bc.competitorName}`);
      if (bc.weaknesses && bc.weaknesses.length > 0) {
        parts.push(`Their Weaknesses: ${bc.weaknesses.join(', ')}`);
      }
      if (bc.keyDifferentiators && bc.keyDifferentiators.length > 0) {
        parts.push(`Our Differentiators vs Them: ${bc.keyDifferentiators.join(', ')}`);
      }
    });
  }

  // Output instructions
  parts.push(`
=== OUTPUT FORMAT ===
You must respond with valid JSON containing an array of slides. Each slide has:
- slideNumber: number (1-indexed)
- type: one of "title", "executive_summary", "solution", "investment", "next_steps", "custom"
- title: string (slide title)
- content: object with relevant fields (heading, subheading, bullets, body, table, callout)

=== GUIDELINES ===
- Be concise and impactful
- Use active voice
- Focus on benefits, not features
- Reference our company differentiators when relevant
- Use competitive insights when appropriate (without naming competitors negatively)

=== CRITICAL PRICING RULES (MUST FOLLOW) ===
- NEVER perform math or calculations on prices
- NEVER derive per-user, per-month, or unit prices from totals
- ONLY use exact dollar amounts that appear verbatim in the provided context
- For ANY calculated, derived, or uncertain price: use [ENTER VALUE] placeholder
- When in doubt, use [ENTER VALUE] - it's better to ask than to guess wrong

IMPORTANT: Your entire response must be valid JSON. Do not include any text before or after the JSON array.`);

  return parts.join('\n');
}

// ============================================
// HELPERS
// ============================================

function buildContextString(context: Record<string, unknown>): string {
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
