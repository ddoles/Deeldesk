/**
 * AWS Bedrock Provider
 *
 * Provider for AWS Bedrock with Claude models.
 * Supports streaming and designed for enterprise data sovereignty.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
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

// Bedrock model IDs for Claude
const BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
const MAX_CONTEXT_TOKENS = 200000;

export class BedrockProvider implements LLMProvider {
  readonly providerId = 'aws-bedrock' as const;
  private client: BedrockRuntimeClient;
  private model: string;
  private region: string;

  constructor(options?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    model?: string;
  }) {
    this.region = options?.region || process.env.AWS_REGION || 'us-west-2';
    this.model = options?.model || BEDROCK_MODEL_ID;

    // Configure credentials
    const credentials =
      options?.accessKeyId && options?.secretAccessKey
        ? {
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
          }
        : undefined;

    this.client = new BedrockRuntimeClient({
      region: this.region,
      credentials,
    });
  }

  async generateCompletion(
    systemPrompt: string,
    messages: Message[],
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    try {
      const body = this.buildRequestBody(systemPrompt, messages, options);

      const command = new InvokeModelCommand({
        modelId: this.model,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      });

      const response = await this.client.send(command);

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      const textContent = responseBody.content?.find(
        (c: { type: string }) => c.type === 'text'
      );
      const content = textContent?.text || '';

      return {
        content,
        usage: {
          inputTokens: responseBody.usage?.input_tokens || 0,
          outputTokens: responseBody.usage?.output_tokens || 0,
        },
        stopReason: this.mapStopReason(responseBody.stop_reason),
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
      const body = this.buildRequestBody(systemPrompt, messages, options);

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: this.model,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      });

      const response = await this.client.send(command);

      yield { type: 'message_start' };

      let inputTokens = 0;
      let outputTokens = 0;

      if (response.body) {
        for await (const event of response.body) {
          if (event.chunk?.bytes) {
            const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

            // Handle different event types from Bedrock
            if (chunk.type === 'content_block_delta') {
              if (chunk.delta?.type === 'text_delta' && chunk.delta?.text) {
                yield {
                  type: 'content_delta',
                  content: chunk.delta.text,
                };
              }
            } else if (chunk.type === 'message_delta') {
              // Final usage stats
              if (chunk.usage) {
                outputTokens = chunk.usage.output_tokens || outputTokens;
              }
            } else if (chunk.type === 'message_start') {
              // Initial usage stats
              if (chunk.message?.usage) {
                inputTokens = chunk.message.usage.input_tokens || 0;
              }
            }
          }
        }
      }

      yield {
        type: 'message_stop',
        usage: {
          inputTokens,
          outputTokens,
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
      // Check if credentials are configured
      const hasRegion = !!this.region;
      const hasCredentials =
        (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
        // Also works if running in AWS with IAM roles
        process.env.AWS_EXECUTION_ENV;

      return hasRegion && !!hasCredentials;
    } catch {
      return false;
    }
  }

  getMetadata(): ProviderMetadata {
    return {
      name: 'AWS Bedrock',
      model: this.model,
      region: this.region,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      maxContextTokens: MAX_CONTEXT_TOKENS,
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private buildRequestBody(
    systemPrompt: string,
    messages: Message[],
    options?: CompletionOptions
  ): Record<string, unknown> {
    // Bedrock uses Claude's Messages API format
    return {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stop_sequences: options?.stopSequences,
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
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Rate limiting
      if (message.includes('throttl') || message.includes('rate limit')) {
        return new RateLimitError('aws-bedrock');
      }

      // Authentication errors
      if (
        message.includes('access denied') ||
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('credentials')
      ) {
        return new AuthenticationError('aws-bedrock');
      }

      // Bedrock-specific errors
      if (message.includes('model') && message.includes('not found')) {
        return new LLMProviderError(
          `Model ${this.model} not found in region ${this.region}`,
          'aws-bedrock',
          'MODEL_NOT_FOUND',
          false
        );
      }

      if (message.includes('validation')) {
        return new LLMProviderError(
          error.message,
          'aws-bedrock',
          'VALIDATION_ERROR',
          false
        );
      }

      // Service errors are typically retryable
      if (message.includes('service') || message.includes('internal')) {
        return new LLMProviderError(
          error.message,
          'aws-bedrock',
          'SERVICE_ERROR',
          true
        );
      }

      return new LLMProviderError(
        error.message,
        'aws-bedrock',
        'UNKNOWN',
        false
      );
    }

    return new LLMProviderError(
      'Unknown error',
      'aws-bedrock',
      'UNKNOWN',
      false
    );
  }
}
