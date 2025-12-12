/**
 * LLM Provider Types
 *
 * Core types for the multi-provider LLM abstraction layer.
 * Supports Anthropic Direct, AWS Bedrock, and future providers.
 */

// ============================================
// MESSAGE TYPES
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

// ============================================
// STREAMING TYPES
// ============================================

export type StreamEventType =
  | 'message_start'
  | 'content_delta'
  | 'message_stop'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============================================
// PROVIDER INTERFACE
// ============================================

export type ProviderId = 'anthropic-direct' | 'aws-bedrock' | 'google-vertex';

export interface ProviderMetadata {
  name: string;
  model: string;
  region?: string;
  supportsStreaming: boolean;
  supportsSystemPrompt: boolean;
  maxContextTokens: number;
}

export interface LLMProvider {
  /**
   * Provider identifier
   */
  readonly providerId: ProviderId;

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

// ============================================
// ERROR TYPES
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
  retryAfterMs?: number;

  constructor(provider: string, retryAfterMs?: number) {
    super('Rate limit exceeded', provider, 'RATE_LIMIT', true);
    this.retryAfterMs = retryAfterMs;
  }
}

export class AuthenticationError extends LLMProviderError {
  constructor(provider: string) {
    super('Authentication failed', provider, 'AUTH_ERROR', false);
  }
}

export class ContextLengthError extends LLMProviderError {
  constructor(provider: string, maxTokens: number) {
    super(
      `Context length exceeded. Maximum: ${maxTokens} tokens`,
      provider,
      'CONTEXT_LENGTH',
      false
    );
  }
}
