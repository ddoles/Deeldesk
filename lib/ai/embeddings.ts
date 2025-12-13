/**
 * Embedding Generation and Vector Search Utilities
 *
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 * for generating embeddings and performing similarity search.
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';

// ============================================
// CONSTANTS
// ============================================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_TOKENS_PER_CHUNK = 8000; // Safe limit for embedding model
const CHARS_PER_TOKEN = 4; // Rough estimate

// ============================================
// CLIENT
// ============================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// ============================================
// EMBEDDING GENERATION
// ============================================

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

/**
 * Generate embedding for a single text string
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const client = getOpenAIClient();

  // Truncate if too long
  const truncatedText = truncateForEmbedding(text);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedText,
  });

  return {
    embedding: response.data[0].embedding,
    tokenCount: response.usage.total_tokens,
  };
}

/**
 * Generate embeddings for multiple texts in a batch
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) {
    return [];
  }

  const client = getOpenAIClient();

  // Truncate each text
  const truncatedTexts = texts.map(truncateForEmbedding);

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedTexts,
  });

  const tokensPerText = Math.ceil(response.usage.total_tokens / texts.length);

  return response.data.map((item) => ({
    embedding: item.embedding,
    tokenCount: tokensPerText,
  }));
}

/**
 * Truncate text to fit within token limit for embedding
 */
function truncateForEmbedding(text: string): string {
  const maxChars = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN;
  if (text.length <= maxChars) {
    return text;
  }
  return text.substring(0, maxChars);
}

// ============================================
// VECTOR SEARCH
// ============================================

export interface SearchResult<T> {
  item: T;
  similarity: number;
}

export type SearchableEntity = 'products' | 'battlecards' | 'playbooks' | 'deal_context_items';

/**
 * Search for similar products using vector similarity
 */
export async function searchProducts(
  organizationId: string,
  queryEmbedding: number[],
  limit: number = 5,
  minSimilarity: number = 0.5
): Promise<SearchResult<{ id: string; name: string; description: string | null; category: string | null }>[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      similarity: number;
    }>
  >`
    SELECT
      id,
      name,
      description,
      category,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM products
    WHERE organization_id = ${organizationId}::uuid
      AND is_active = true
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    item: {
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
    },
    similarity: r.similarity,
  }));
}

/**
 * Search for similar battlecards using vector similarity
 */
export async function searchBattlecards(
  organizationId: string,
  queryEmbedding: number[],
  limit: number = 3,
  minSimilarity: number = 0.5
): Promise<SearchResult<{ id: string; competitorName: string; rawContent: string | null }>[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      competitor_name: string;
      raw_content: string | null;
      similarity: number;
    }>
  >`
    SELECT
      id,
      competitor_name,
      raw_content,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM battlecards
    WHERE organization_id = ${organizationId}::uuid
      AND is_active = true
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    item: {
      id: r.id,
      competitorName: r.competitor_name,
      rawContent: r.raw_content,
    },
    similarity: r.similarity,
  }));
}

/**
 * Search for similar playbooks using vector similarity
 */
export async function searchPlaybooks(
  organizationId: string,
  queryEmbedding: number[],
  limit: number = 3,
  minSimilarity: number = 0.5
): Promise<SearchResult<{ id: string; name: string; content: string; category: string | null }>[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      content: string;
      category: string | null;
      similarity: number;
    }>
  >`
    SELECT
      id,
      name,
      content,
      category,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM playbooks
    WHERE organization_id = ${organizationId}::uuid
      AND is_active = true
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    item: {
      id: r.id,
      name: r.name,
      content: r.content,
      category: r.category,
    },
    similarity: r.similarity,
  }));
}

/**
 * Search deal context items for an opportunity
 */
export async function searchDealContext(
  opportunityId: string,
  queryEmbedding: number[],
  limit: number = 5,
  minSimilarity: number = 0.4
): Promise<SearchResult<{ id: string; sourceType: string; rawContent: string }>[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      source_type: string;
      raw_content: string;
      similarity: number;
    }>
  >`
    SELECT
      id,
      source_type,
      raw_content,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM deal_context_items
    WHERE opportunity_id = ${opportunityId}::uuid
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    item: {
      id: r.id,
      sourceType: r.source_type,
      rawContent: r.raw_content,
    },
    similarity: r.similarity,
  }));
}

// ============================================
// HYBRID SEARCH (Vector + Full-Text)
// ============================================

export interface HybridSearchOptions {
  limit?: number;
  minSimilarity?: number;
  textWeight?: number;
  vectorWeight?: number;
}

/**
 * Hybrid search combining vector similarity and full-text search
 * Uses reciprocal rank fusion (RRF) to combine results
 */
export async function hybridSearchProducts(
  organizationId: string,
  query: string,
  options: HybridSearchOptions = {}
): Promise<SearchResult<{ id: string; name: string; description: string | null; category: string | null }>[]> {
  const { limit = 5, minSimilarity = 0.3, textWeight = 0.4, vectorWeight = 0.6 } = options;

  // Generate embedding for query
  const { embedding } = await generateEmbedding(query);
  const embeddingStr = `[${embedding.join(',')}]`;

  // Perform hybrid search with RRF
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      rrf_score: number;
    }>
  >`
    WITH vector_search AS (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY embedding <=> ${embeddingStr}::vector) as rank,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM products
      WHERE organization_id = ${organizationId}::uuid
        AND is_active = true
        AND embedding IS NOT NULL
    ),
    text_search AS (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY ts_rank(
          to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(searchable_content, '')),
          plainto_tsquery('english', ${query})
        ) DESC) as rank
      FROM products
      WHERE organization_id = ${organizationId}::uuid
        AND is_active = true
        AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(searchable_content, '')) @@ plainto_tsquery('english', ${query})
    )
    SELECT
      p.id,
      p.name,
      p.description,
      p.category,
      (
        COALESCE(${vectorWeight}::float / (60 + v.rank), 0) +
        COALESCE(${textWeight}::float / (60 + t.rank), 0)
      ) as rrf_score
    FROM products p
    LEFT JOIN vector_search v ON p.id = v.id
    LEFT JOIN text_search t ON p.id = t.id
    WHERE p.organization_id = ${organizationId}::uuid
      AND p.is_active = true
      AND (v.id IS NOT NULL OR t.id IS NOT NULL)
      AND (v.similarity IS NULL OR v.similarity > ${minSimilarity})
    ORDER BY rrf_score DESC
    LIMIT ${limit}
  `;

  return results.map((r) => ({
    item: {
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
    },
    similarity: r.rrf_score,
  }));
}

// ============================================
// EMBEDDING UPDATE UTILITIES
// ============================================

/**
 * Update embedding for a product
 */
export async function updateProductEmbedding(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      description: true,
      category: true,
      features: true,
      useCases: true,
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Build searchable content
  const searchableContent = buildProductSearchableContent(product);

  // Generate embedding
  const { embedding } = await generateEmbedding(searchableContent);
  const embeddingStr = `[${embedding.join(',')}]`;

  // Update product with embedding
  await prisma.$executeRaw`
    UPDATE products
    SET
      searchable_content = ${searchableContent},
      embedding = ${embeddingStr}::vector,
      updated_at = NOW()
    WHERE id = ${productId}::uuid
  `;
}

/**
 * Update embedding for a battlecard
 */
export async function updateBattlecardEmbedding(battlecardId: string): Promise<void> {
  const battlecard = await prisma.battlecard.findUnique({
    where: { id: battlecardId },
    select: {
      competitorName: true,
      rawContent: true,
      structuredContent: true,
    },
  });

  if (!battlecard) {
    throw new Error('Battlecard not found');
  }

  // Build searchable content
  const searchableContent = buildBattlecardSearchableContent(battlecard);

  // Generate embedding
  const { embedding } = await generateEmbedding(searchableContent);
  const embeddingStr = `[${embedding.join(',')}]`;

  // Update battlecard with embedding
  await prisma.$executeRaw`
    UPDATE battlecards
    SET
      searchable_content = ${searchableContent},
      embedding = ${embeddingStr}::vector,
      updated_at = NOW()
    WHERE id = ${battlecardId}::uuid
  `;
}

/**
 * Update embedding for a deal context item
 */
export async function updateDealContextEmbedding(contextItemId: string): Promise<void> {
  const item = await prisma.dealContextItem.findUnique({
    where: { id: contextItemId },
    select: {
      rawContent: true,
      sourceType: true,
    },
  });

  if (!item) {
    throw new Error('Deal context item not found');
  }

  // Generate embedding
  const { embedding } = await generateEmbedding(item.rawContent);
  const embeddingStr = `[${embedding.join(',')}]`;

  // Update with embedding
  await prisma.$executeRaw`
    UPDATE deal_context_items
    SET
      embedding = ${embeddingStr}::vector
    WHERE id = ${contextItemId}::uuid
  `;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildProductSearchableContent(product: {
  name: string;
  description: string | null;
  category: string | null;
  features: unknown;
  useCases: unknown;
}): string {
  const parts: string[] = [product.name];

  if (product.description) {
    parts.push(product.description);
  }

  if (product.category) {
    parts.push(`Category: ${product.category}`);
  }

  if (Array.isArray(product.features) && product.features.length > 0) {
    parts.push(`Features: ${product.features.join(', ')}`);
  }

  if (Array.isArray(product.useCases) && product.useCases.length > 0) {
    parts.push(`Use Cases: ${product.useCases.join(', ')}`);
  }

  return parts.join('\n');
}

function buildBattlecardSearchableContent(battlecard: {
  competitorName: string;
  rawContent: string | null;
  structuredContent: unknown;
}): string {
  const parts: string[] = [`Competitor: ${battlecard.competitorName}`];

  if (battlecard.rawContent) {
    parts.push(battlecard.rawContent);
  }

  if (battlecard.structuredContent && typeof battlecard.structuredContent === 'object') {
    const structured = battlecard.structuredContent as Record<string, unknown>;
    for (const [key, value] of Object.entries(structured)) {
      if (typeof value === 'string') {
        parts.push(`${key}: ${value}`);
      } else if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(', ')}`);
      }
    }
  }

  return parts.join('\n');
}

// ============================================
// EXPORTS
// ============================================

export {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};
