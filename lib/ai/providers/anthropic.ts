/**
 * Anthropic Direct API Provider
 *
 * Default provider for Free/Pro tiers.
 * Uses the official Anthropic SDK.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  LLMProvider,
  Message,
  CompletionOptions,
  CompletionResponse,
  StreamEvent,
  ProviderMetadata,
  LLMProviderError,
  RateLimitError,
  AuthenticationError,
} from '../types';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MAX_CONTEXT_TOKENS = 200000;

export class AnthropicDirectProvider implements LLMProvider {
  readonly providerId = 'anthropic-direct' as const;
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = model || DEFAULT_MODEL;
  }

  async generateCompletion(
    systemPrompt: string,
    messages: Message[],
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stop_sequences: options?.stopSequences,
      });

      const textContent = response.content.find((c) => c.type === 'text');
      const content = textContent?.type === 'text' ? textContent.text : '';

      return {
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        stopReason: this.mapStopReason(response.stop_reason),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *streamCompletion(
    systemPrompt: string,
    messages: Message[],
    options?: CompletionOptions
  ): AsyncGenerator<StreamEvent> {
    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stop_sequences: options?.stopSequences,
      });

      yield { type: 'message_start' };

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield {
            type: 'content_delta',
            content: event.delta.text,
          };
        }
      }

      const finalMessage = await stream.finalMessage();

      yield {
        type: 'message_stop',
        usage: {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
        },
      };
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      throw this.handleError(error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check - just verify we can create a minimal request
      const apiKey = process.env.ANTHROPIC_API_KEY;
      return !!apiKey && apiKey.length > 0;
    } catch {
      return false;
    }
  }

  getMetadata(): ProviderMetadata {
    return {
      name: 'Anthropic Direct',
      model: this.model,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      maxContextTokens: MAX_CONTEXT_TOKENS,
    };
  }

  private mapStopReason(
    reason: string | null
  ): 'end_turn' | 'max_tokens' | 'stop_sequence' {
    switch (reason) {
      case 'end_turn':
        return 'end_turn';
      case 'max_tokens':
        return 'max_tokens';
      case 'stop_sequence':
        return 'stop_sequence';
      default:
        return 'end_turn';
    }
  }

  private handleError(error: unknown): LLMProviderError {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'];
        return new RateLimitError(
          'anthropic-direct',
          retryAfter ? parseInt(retryAfter) * 1000 : undefined
        );
      }
      if (error.status === 401) {
        return new AuthenticationError('anthropic-direct');
      }
      return new LLMProviderError(
        error.message,
        'anthropic-direct',
        `HTTP_${error.status}`,
        error.status >= 500
      );
    }

    if (error instanceof Error) {
      return new LLMProviderError(
        error.message,
        'anthropic-direct',
        'UNKNOWN',
        false
      );
    }

    return new LLMProviderError(
      'Unknown error',
      'anthropic-direct',
      'UNKNOWN',
      false
    );
  }
}
