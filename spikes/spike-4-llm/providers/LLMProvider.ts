/**
 * LLM Provider Interface Specification
 *
 * This interface abstracts LLM providers to enable:
 * - Anthropic Direct API (default for Free/Pro tiers)
 * - AWS Bedrock (Team/Enterprise tiers with data sovereignty)
 * - Future: Google Vertex AI, BYOL
 *
 * Validated in Spike 4 - December 2025
 */

// ============================================
// CORE TYPES
// ============================================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface CompletionResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence';
}

export interface StreamEvent {
  type: 'content_delta' | 'message_start' | 'message_stop' | 'error';
  content?: string;
  error?: string;
}

// ============================================
// PROVIDER INTERFACE
// ============================================

export interface LLMProvider {
  /**
   * Provider identifier
   */
  readonly providerId: 'anthropic-direct' | 'aws-bedrock' | 'google-vertex';

  /**
   * Generate a completion (non-streaming)
   */
  generateCompletion(
    systemPrompt: string,
    messages: Message[],
    options?: CompletionOptions
  ): Promise<CompletionResponse>;

  /**
   * Generate a streaming completion
   * Returns an async generator that yields content chunks
   */
  streamCompletion(
    systemPrompt: string,
    messages: Message[],
    options?: CompletionOptions
  ): AsyncGenerator<StreamEvent>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider-specific metadata
   */
  getMetadata(): ProviderMetadata;
}

export interface ProviderMetadata {
  name: string;
  model: string;
  region?: string;
  supportsStreaming: boolean;
  supportsSystemPrompt: boolean;
  maxContextTokens: number;
}

// ============================================
// PROVIDER FACTORY
// ============================================

export interface ProviderConfig {
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  bedrock?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    model?: string;
  };
}

/**
 * Get the appropriate provider for an organization
 *
 * Selection logic:
 * 1. Check org settings for preferred provider
 * 2. Check plan tier (Bedrock requires Team/Enterprise)
 * 3. Fall back to Anthropic Direct
 */
export async function getProviderForOrganization(
  organizationId: string
): Promise<LLMProvider> {
  // Implementation would:
  // 1. Query org settings from database
  // 2. Determine provider based on settings + plan tier
  // 3. Return appropriate provider instance
  throw new Error('Implementation in Sprint 2');
}

/**
 * Create a provider instance directly (for testing)
 */
export function createProvider(
  type: 'anthropic-direct' | 'aws-bedrock',
  config: ProviderConfig
): LLMProvider {
  // Implementation would instantiate the appropriate provider
  throw new Error('Implementation in Sprint 2');
}

// ============================================
// ERROR HANDLING
// ============================================

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class RateLimitError extends LLMProviderError {
  constructor(provider: string, retryAfterMs?: number) {
    super('Rate limit exceeded', provider, 'RATE_LIMIT', true);
    this.retryAfterMs = retryAfterMs;
  }
  retryAfterMs?: number;
}

export class AuthenticationError extends LLMProviderError {
  constructor(provider: string) {
    super('Authentication failed', provider, 'AUTH_ERROR', false);
  }
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// In proposal generation worker:

import { getProviderForOrganization } from '@/lib/ai/provider-factory';

async function generateProposal(orgId: string, prompt: string) {
  const provider = await getProviderForOrganization(orgId);

  const systemPrompt = buildSystemPrompt(context);
  const messages = [{ role: 'user', content: prompt }];

  // Streaming for real-time progress
  for await (const event of provider.streamCompletion(systemPrompt, messages)) {
    if (event.type === 'content_delta') {
      // Send to SSE endpoint
      yield { type: 'content', content: event.content };
    }
  }
}
*/
