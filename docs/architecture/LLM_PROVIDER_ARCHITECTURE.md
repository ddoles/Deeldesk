# LLM Provider Architecture

## Overview

Deeldesk.ai implements a multi-provider LLM architecture to support enterprise data sovereignty requirements. This document describes the provider abstraction layer that enables seamless switching between LLM backends while maintaining consistent application behavior.

## Why Multi-Provider Support?

### The Enterprise Data Privacy Challenge

Enterprise sales professionals often work at organizations with strict data governance policies:

| User Segment | Data Sensitivity | Typical Policy |
|--------------|------------------|----------------|
| SMB AE | Low | Any approved SaaS tool |
| Mid-Market AE | Medium | Security questionnaire required |
| Enterprise AE | High | Data must stay in approved cloud |
| Regulated Industry | Critical | On-premise or specific cloud only |

**The Problem**: Our target users (enterprise AEs with complex, high-value deals) frequently cannot use tools that send confidential deal data to third-party APIs without lengthy security reviews.

**The Solution**: Offer data sovereignty options where customer data never leaves their cloud environment.

### Provider Comparison

| Provider | Model | Data Residency | Compliance | Latency | Cost |
|----------|-------|----------------|------------|---------|------|
| Anthropic API | Claude 3.5 Sonnet | Anthropic servers | SOC 2 Type II | Baseline | Baseline |
| AWS Bedrock | Claude 3.5 Sonnet | Customer VPC | HIPAA, SOC2, FedRAMP | +10-15% | +15-20% |
| Google Vertex AI | Claude 3.5 Sonnet | Customer GCP | HIPAA, SOC2, FedRAMP | +10-15% | +15-20% |
| Azure (future) | Claude (planned) | Customer Azure | TBD | TBD | TBD |

---

## Architecture

### Provider Abstraction Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  (Proposal Generation, Context Assembly, Knowledge Queries)      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLMProviderFactory                          │
│  getProvider(organizationId) → LLMProvider                       │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ AnthropicDirect │  │  BedrockProvider │  │  VertexProvider │
│    Provider     │  │                  │  │    (Phase 3)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Anthropic API  │  │   AWS Bedrock   │  │  Google Vertex  │
│   (Default)     │  │  (Enterprise)   │  │   (Phase 3)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Provider Selection Logic

```typescript
// lib/ai/provider-factory.ts

export async function getProviderForOrganization(
  organizationId: string
): Promise<LLMProvider> {
  const org = await getOrganization(organizationId);
  const settings = org.settings as OrganizationSettings;
  
  // Check plan tier eligibility
  const providerType = settings.llmProvider || 'anthropic_direct';
  
  if (providerType === 'bedrock' && !canUseBedrock(org.planTier)) {
    throw new Error('Bedrock provider requires Team or Enterprise plan');
  }
  
  switch (providerType) {
    case 'bedrock':
      return new BedrockProvider(settings.bedrockConfig);
    case 'vertex':
      return new VertexProvider(settings.vertexConfig);
    case 'anthropic_direct':
    default:
      return new AnthropicDirectProvider();
  }
}

function canUseBedrock(planTier: PlanTier): boolean {
  return ['team', 'enterprise'].includes(planTier);
}
```

---

## Interface Specification

### LLMProvider Interface

```typescript
// lib/ai/types.ts

export interface LLMProvider {
  /**
   * Provider identifier
   */
  readonly providerId: string;
  
  /**
   * Generate a completion (non-streaming)
   */
  generateCompletion(
    request: CompletionRequest
  ): Promise<CompletionResponse>;
  
  /**
   * Generate a streaming completion
   */
  streamCompletion(
    request: CompletionRequest
  ): AsyncGenerator<StreamEvent>;
  
  /**
   * Generate embeddings for text
   */
  generateEmbedding(
    text: string,
    options?: EmbeddingOptions
  ): Promise<number[]>;
  
  /**
   * Check provider health/availability
   */
  healthCheck(): Promise<HealthCheckResult>;
}

export interface CompletionRequest {
  model?: string;  // Defaults to provider's default model
  systemPrompt: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;  // For tracking/logging
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  stopReason: StopReason;
  latencyMs: number;
}

export interface StreamEvent {
  type: 'content_delta' | 'usage' | 'stop' | 'error';
  content?: string;
  usage?: Partial<TokenUsage>;
  stopReason?: StopReason;
  error?: Error;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence';

export interface HealthCheckResult {
  healthy: boolean;
  latencyMs: number;
  error?: string;
}
```

---

## Provider Implementations

### AnthropicDirectProvider

The default provider using the Anthropic API directly.

```typescript
// lib/ai/providers/anthropic-direct.ts

import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, CompletionRequest, CompletionResponse, StreamEvent } from '../types';

export class AnthropicDirectProvider implements LLMProvider {
  readonly providerId = 'anthropic_direct';
  private client: Anthropic;
  private defaultModel = 'claude-3-5-sonnet-20241022';

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    
    const response = await this.client.messages.create({
      model: request.model || this.defaultModel,
      max_tokens: request.maxTokens || 4096,
      system: request.systemPrompt,
      messages: request.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: request.temperature,
      stop_sequences: request.stopSequences,
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      stopReason: this.mapStopReason(response.stop_reason),
      latencyMs: Date.now() - startTime,
    };
  }

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<StreamEvent> {
    const stream = this.client.messages.stream({
      model: request.model || this.defaultModel,
      max_tokens: request.maxTokens || 4096,
      system: request.systemPrompt,
      messages: request.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: request.temperature,
      stop_sequences: request.stopSequences,
    });

    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta as { type: string; text?: string };
          if (delta.type === 'text_delta' && delta.text) {
            yield { type: 'content_delta', content: delta.text };
          }
        } else if (event.type === 'message_delta') {
          const messageDelta = event as { usage?: { output_tokens: number } };
          if (messageDelta.usage) {
            yield { 
              type: 'usage', 
              usage: { outputTokens: messageDelta.usage.output_tokens } 
            };
          }
        } else if (event.type === 'message_stop') {
          yield { type: 'stop', stopReason: 'end_turn' };
        }
      }
    } catch (error) {
      yield { type: 'error', error: error as Error };
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Anthropic doesn't have an embedding API, use OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return { healthy: true, latencyMs: Date.now() - startTime };
    } catch (error) {
      return { 
        healthy: false, 
        latencyMs: Date.now() - startTime,
        error: (error as Error).message 
      };
    }
  }

  private mapStopReason(reason: string | null): StopReason {
    switch (reason) {
      case 'end_turn': return 'end_turn';
      case 'max_tokens': return 'max_tokens';
      case 'stop_sequence': return 'stop_sequence';
      default: return 'end_turn';
    }
  }
}
```

### BedrockProvider

Provider using AWS Bedrock for data sovereignty.

```typescript
// lib/ai/providers/bedrock.ts

import { 
  BedrockRuntimeClient, 
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand 
} from '@aws-sdk/client-bedrock-runtime';
import type { LLMProvider, CompletionRequest, CompletionResponse, StreamEvent } from '../types';

export interface BedrockConfig {
  region: string;
  accessKeyId?: string;  // Optional if using IAM roles
  secretAccessKey?: string;
  modelId?: string;
}

export class BedrockProvider implements LLMProvider {
  readonly providerId = 'bedrock';
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(config: BedrockConfig) {
    this.client = new BedrockRuntimeClient({
      region: config.region,
      credentials: config.accessKeyId ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey!,
      } : undefined,  // Uses IAM role if not provided
    });
    this.modelId = config.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: request.maxTokens || 4096,
      system: request.systemPrompt,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature,
      stop_sequences: request.stopSequences,
    });

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: Buffer.from(body),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      content: responseBody.content[0].text,
      model: this.modelId,
      usage: {
        inputTokens: responseBody.usage.input_tokens,
        outputTokens: responseBody.usage.output_tokens,
        totalTokens: responseBody.usage.input_tokens + responseBody.usage.output_tokens,
      },
      stopReason: this.mapStopReason(responseBody.stop_reason),
      latencyMs: Date.now() - startTime,
    };
  }

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<StreamEvent> {
    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: request.maxTokens || 4096,
      system: request.systemPrompt,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature,
      stop_sequences: request.stopSequences,
    });

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: Buffer.from(body),
    });

    try {
      const response = await this.client.send(command);
      
      if (response.body) {
        for await (const event of response.body) {
          if (event.chunk?.bytes) {
            const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
            
            if (chunk.type === 'content_block_delta') {
              yield { type: 'content_delta', content: chunk.delta.text };
            } else if (chunk.type === 'message_delta') {
              yield { 
                type: 'usage', 
                usage: { outputTokens: chunk.usage?.output_tokens } 
              };
            } else if (chunk.type === 'message_stop') {
              yield { type: 'stop', stopReason: 'end_turn' };
            }
          }
        }
      }
    } catch (error) {
      yield { type: 'error', error: error as Error };
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Use Bedrock Titan embeddings for full data sovereignty
    const body = JSON.stringify({
      inputText: text,
    });

    const command = new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: Buffer.from(body),
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.embedding;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.generateCompletion({
        systemPrompt: 'You are a helpful assistant.',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 10,
      });
      return { healthy: true, latencyMs: Date.now() - startTime };
    } catch (error) {
      return { 
        healthy: false, 
        latencyMs: Date.now() - startTime,
        error: (error as Error).message 
      };
    }
  }

  private mapStopReason(reason: string): StopReason {
    switch (reason) {
      case 'end_turn': return 'end_turn';
      case 'max_tokens': return 'max_tokens';
      case 'stop_sequence': return 'stop_sequence';
      default: return 'end_turn';
    }
  }
}
```

---

## Configuration

### Organization Settings Schema

```typescript
// types/organization.ts

export interface OrganizationSettings {
  // LLM Provider configuration
  llmProvider: 'anthropic_direct' | 'bedrock' | 'vertex';
  
  // Bedrock-specific config (if llmProvider === 'bedrock')
  bedrockConfig?: {
    region: string;
    // Credentials stored securely, not in settings JSON
    useIAMRole: boolean;
  };
  
  // Vertex-specific config (if llmProvider === 'vertex')
  vertexConfig?: {
    projectId: string;
    region: string;
  };
  
  // Embedding provider (can differ from LLM provider)
  embeddingProvider: 'openai' | 'bedrock_titan' | 'vertex';
  
  // Other settings...
  safeModeDefault: boolean;
  defaultTemplateId?: string;
  brandColors?: BrandColors;
  defaultCurrency: string;
}
```

### Environment Variables

```env
# Anthropic Direct (default)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (for embeddings when using Anthropic Direct)
OPENAI_API_KEY=sk-...

# AWS Bedrock (for enterprise customers)
# Can use IAM roles instead of explicit credentials
AWS_BEDROCK_REGION=us-east-1
AWS_ACCESS_KEY_ID=...  # Optional if using IAM roles
AWS_SECRET_ACCESS_KEY=...  # Optional if using IAM roles

# Google Vertex AI (Phase 3)
# VERTEX_PROJECT_ID=...
# VERTEX_REGION=us-central1
```

### Secure Credential Storage

For enterprise customers using Bedrock/Vertex, credentials should be stored securely:

```typescript
// lib/ai/credentials.ts

export async function getBedrockCredentials(
  organizationId: string
): Promise<BedrockCredentials | null> {
  // Option 1: Use IAM roles (recommended for AWS-hosted deployments)
  // No credentials needed, SDK uses instance role
  
  // Option 2: Retrieve from secure storage (AWS Secrets Manager, Vault, etc.)
  const secret = await secretsManager.getSecret(`deeldesk/${organizationId}/bedrock`);
  
  return secret ? JSON.parse(secret) : null;
}
```

---

## Usage in Application Code

### Proposal Generation

```typescript
// lib/ai/proposal-generator.ts

import { getProviderForOrganization } from './provider-factory';
import type { LLMProvider, StreamEvent } from './types';

export async function* generateProposal(
  organizationId: string,
  context: AssembledContext,
  options: GenerationOptions
): AsyncGenerator<ProposalGenerationEvent> {
  // Get the correct provider for this organization
  const provider = await getProviderForOrganization(organizationId);
  
  yield { type: 'status', message: 'Starting generation...', provider: provider.providerId };
  
  const systemPrompt = buildProposalSystemPrompt(context, options);
  
  // Stream the completion
  const stream = provider.streamCompletion({
    systemPrompt,
    messages: [{ role: 'user', content: context.userPrompt }],
    maxTokens: 4096,
    metadata: {
      organizationId,
      proposalId: options.proposalId,
    },
  });
  
  let fullContent = '';
  
  for await (const event of stream) {
    if (event.type === 'content_delta') {
      fullContent += event.content;
      yield { type: 'content', content: event.content };
    } else if (event.type === 'error') {
      yield { type: 'error', error: event.error };
      return;
    }
  }
  
  // Parse and return final proposal
  const proposal = parseProposalContent(fullContent);
  yield { type: 'complete', proposal };
}
```

### Embedding Generation

```typescript
// lib/ai/embeddings.ts

import { getProviderForOrganization } from './provider-factory';

export async function generateEmbedding(
  organizationId: string,
  text: string
): Promise<number[]> {
  const provider = await getProviderForOrganization(organizationId);
  return provider.generateEmbedding(text);
}
```

---

## Error Handling & Fallback

### Graceful Degradation

```typescript
// lib/ai/provider-factory.ts

export async function getProviderWithFallback(
  organizationId: string
): Promise<LLMProvider> {
  const org = await getOrganization(organizationId);
  const primaryProvider = await getProviderForOrganization(organizationId);
  
  // Check if primary provider is healthy
  const health = await primaryProvider.healthCheck();
  
  if (health.healthy) {
    return primaryProvider;
  }
  
  // Log the issue
  console.error(`Primary provider ${primaryProvider.providerId} unhealthy: ${health.error}`);
  
  // Check if fallback is allowed for this organization
  if (org.settings.allowFallback === false) {
    throw new Error(`Primary provider unavailable and fallback disabled`);
  }
  
  // Fallback to Anthropic Direct (if not already using it)
  if (primaryProvider.providerId !== 'anthropic_direct') {
    console.warn(`Falling back to anthropic_direct for org ${organizationId}`);
    return new AnthropicDirectProvider();
  }
  
  throw new Error('No available LLM providers');
}
```

### Retry Logic

```typescript
// lib/ai/retry.ts

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, backoffMs = 1000, retryableErrors = ['RATE_LIMIT', 'TIMEOUT'] } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (!isRetryableError(error, retryableErrors)) {
        throw error;
      }
      
      const delay = backoffMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError;
}
```

---

## Monitoring & Observability

### Metrics to Track

```typescript
// lib/ai/metrics.ts

export interface ProviderMetrics {
  providerId: string;
  requestCount: number;
  errorCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export function trackProviderRequest(
  providerId: string,
  latencyMs: number,
  success: boolean,
  usage?: TokenUsage
): void {
  // Send to your metrics backend (Datadog, CloudWatch, etc.)
  metrics.increment(`llm.requests.${providerId}`, { success: String(success) });
  metrics.histogram(`llm.latency.${providerId}`, latencyMs);
  
  if (usage) {
    metrics.increment(`llm.tokens.input.${providerId}`, usage.inputTokens);
    metrics.increment(`llm.tokens.output.${providerId}`, usage.outputTokens);
  }
}
```

### Logging

```typescript
// Log provider selection for debugging
logger.info('LLM provider selected', {
  organizationId,
  providerId: provider.providerId,
  planTier: org.planTier,
});

// Log completion metadata
logger.info('LLM completion finished', {
  organizationId,
  providerId: provider.providerId,
  latencyMs: response.latencyMs,
  inputTokens: response.usage.inputTokens,
  outputTokens: response.usage.outputTokens,
});
```

---

## Plan Tier Integration

### Feature Gating

| Plan | Anthropic Direct | AWS Bedrock | Vertex AI | BYOL |
|------|-----------------|-------------|-----------|------|
| Free | ✓ (default) | ✗ | ✗ | ✗ |
| Pro | ✓ (default) | ✗ | ✗ | ✗ |
| Team | ✓ | ✓ | ✗ | ✗ |
| Enterprise | ✓ | ✓ | ✓ | ✓ |

### Pricing Implication

Consider a **Data Sovereignty Add-on** or include in Team/Enterprise tiers:

- **Pro**: $29/mo — Anthropic API only
- **Pro + Data Sovereignty**: $49/mo — Adds Bedrock option
- **Team**: $79/user/mo — Includes Bedrock option
- **Enterprise**: Custom — All providers + BYOL

---

## Future Considerations

### Phase 3: BYOL (Bring Your Own LLM)

For enterprise customers who want to use their own LLM endpoint:

```typescript
export class BYOLProvider implements LLMProvider {
  constructor(config: BYOLConfig) {
    // Customer provides their own endpoint URL and auth
    this.endpoint = config.endpoint;
    this.authHeader = config.authHeader;
    this.modelMapping = config.modelMapping;
  }
  
  // Implementation follows OpenAI-compatible API format
  // (most self-hosted LLMs use this format)
}
```

### Phase 3: Google Vertex AI

```typescript
export class VertexProvider implements LLMProvider {
  // Similar structure to BedrockProvider
  // Uses @google-cloud/aiplatform SDK
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/providers/anthropic-direct.test.ts

describe('AnthropicDirectProvider', () => {
  it('should generate completion', async () => {
    const provider = new AnthropicDirectProvider();
    const response = await provider.generateCompletion({
      systemPrompt: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    
    expect(response.content).toBeTruthy();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });
  
  it('should stream completion', async () => {
    const provider = new AnthropicDirectProvider();
    const events: StreamEvent[] = [];
    
    for await (const event of provider.streamCompletion({
      systemPrompt: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Say hello' }],
    })) {
      events.push(event);
    }
    
    expect(events.some(e => e.type === 'content_delta')).toBe(true);
    expect(events.some(e => e.type === 'stop')).toBe(true);
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/provider-parity.test.ts

describe('Provider Parity', () => {
  const providers = [
    new AnthropicDirectProvider(),
    new BedrockProvider({ region: 'us-east-1' }),
  ];
  
  providers.forEach(provider => {
    describe(provider.providerId, () => {
      it('should generate consistent output format', async () => {
        const response = await provider.generateCompletion({
          systemPrompt: 'Respond with exactly: PONG',
          messages: [{ role: 'user', content: 'PING' }],
          maxTokens: 10,
        });
        
        expect(response.content.trim()).toBe('PONG');
      });
    });
  });
});
```

---

## Embedding Provider Strategy

### The Embedding Compatibility Challenge

Different embedding providers produce vectors in different dimensional spaces that are **not interchangeable**:

| Provider | Model | Dimensions | Notes |
|----------|-------|------------|-------|
| OpenAI | text-embedding-3-small | 1536 | Default for Free/Pro tiers |
| AWS Bedrock | Titan Embed v2 | 1024 | For data sovereignty |
| Google Vertex | Gecko | 768 | Phase 3 |

**Critical Issue:** If an organization switches LLM providers (e.g., Anthropic Direct → Bedrock), and the embedding provider changes (OpenAI → Titan), all existing embeddings in the knowledge base become invalid because they exist in a different vector space.

### Embedding Provider Selection

```typescript
// lib/ai/embedding-provider.ts

export interface EmbeddingProviderConfig {
  provider: 'openai' | 'bedrock_titan' | 'vertex_gecko';
  dimensions: number;
}

export function getEmbeddingConfig(
  llmProvider: string,
  requiresDataSovereignty: boolean
): EmbeddingProviderConfig {
  // For data sovereignty, embedding provider must match LLM provider
  if (requiresDataSovereignty) {
    switch (llmProvider) {
      case 'bedrock':
        return { provider: 'bedrock_titan', dimensions: 1024 };
      case 'vertex':
        return { provider: 'vertex_gecko', dimensions: 768 };
      default:
        return { provider: 'openai', dimensions: 1536 };
    }
  }

  // Without data sovereignty requirements, standardize on OpenAI
  // for consistency and cost optimization
  return { provider: 'openai', dimensions: 1536 };
}
```

### Embedding Migration Strategy

When an organization changes providers and embedding migration is required:

#### 1. Detection

```typescript
// lib/ai/embedding-migration.ts

export async function checkEmbeddingMigrationNeeded(
  organizationId: string,
  newLLMProvider: string
): Promise<MigrationStatus> {
  const org = await getOrganization(organizationId);
  const currentEmbeddingProvider = org.settings.embeddingProvider || 'openai';
  const newEmbeddingConfig = getEmbeddingConfig(
    newLLMProvider,
    org.settings.requiresDataSovereignty
  );

  if (currentEmbeddingProvider === newEmbeddingConfig.provider) {
    return { migrationNeeded: false };
  }

  // Count items that need re-embedding
  const itemCounts = await prisma.$transaction([
    prisma.product.count({ where: { organizationId, embedding: { not: null } } }),
    prisma.battlecard.count({ where: { organizationId, embedding: { not: null } } }),
    prisma.playbook.count({ where: { organizationId, embedding: { not: null } } }),
    prisma.dealContextItem.count({ where: { opportunity: { organizationId }, embedding: { not: null } } }),
  ]);

  const totalItems = itemCounts.reduce((a, b) => a + b, 0);

  return {
    migrationNeeded: true,
    currentProvider: currentEmbeddingProvider,
    newProvider: newEmbeddingConfig.provider,
    itemsToMigrate: totalItems,
    estimatedTimeMinutes: Math.ceil(totalItems / 100), // ~100 embeddings/minute
  };
}
```

#### 2. Migration Job

```typescript
// workers/embedding-migration.ts

export async function migrateEmbeddings(
  organizationId: string,
  newProvider: EmbeddingProviderConfig
): Promise<MigrationResult> {
  const org = await getOrganization(organizationId);
  const provider = getEmbeddingProvider(newProvider.provider);

  const tables = ['products', 'battlecards', 'playbooks'];
  let migratedCount = 0;
  let errorCount = 0;

  for (const table of tables) {
    // Fetch items in batches
    const items = await prisma[table].findMany({
      where: { organizationId, embedding: { not: null } },
      select: { id: true, content: true }, // content field varies by table
    });

    for (const batch of chunk(items, 50)) {
      try {
        // Generate new embeddings
        const texts = batch.map(item => item.content);
        const embeddings = await provider.generateEmbeddings(texts);

        // Update in transaction
        await prisma.$transaction(
          batch.map((item, i) =>
            prisma[table].update({
              where: { id: item.id },
              data: { embedding: embeddings[i] },
            })
          )
        );

        migratedCount += batch.length;

        // Emit progress event
        await emitProgress(organizationId, {
          type: 'embedding_migration',
          progress: migratedCount / items.length,
          table,
        });
      } catch (error) {
        errorCount += batch.length;
        logger.error('Embedding migration batch failed', {
          organizationId,
          table,
          error,
        });
      }
    }
  }

  // Update organization settings
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      settings: {
        ...org.settings,
        embeddingProvider: newProvider.provider,
        embeddingDimensions: newProvider.dimensions,
        lastEmbeddingMigration: new Date().toISOString(),
      },
    },
  });

  return {
    success: errorCount === 0,
    migratedCount,
    errorCount,
    newProvider: newProvider.provider,
  };
}
```

#### 3. User Experience

When a user changes LLM provider in settings:

```typescript
// app/api/settings/llm-provider/route.ts

export async function PUT(request: NextRequest) {
  const { newProvider } = await request.json();
  const session = await getServerSession(authOptions);

  // Check if migration is needed
  const migrationStatus = await checkEmbeddingMigrationNeeded(
    session.organizationId,
    newProvider
  );

  if (migrationStatus.migrationNeeded) {
    return NextResponse.json({
      requiresConfirmation: true,
      warning: `Changing to ${newProvider} requires re-generating ${migrationStatus.itemsToMigrate} embeddings in your knowledge base. This will take approximately ${migrationStatus.estimatedTimeMinutes} minutes. Your knowledge base will remain usable during migration, but search results may be inconsistent until complete.`,
      estimatedTime: migrationStatus.estimatedTimeMinutes,
    });
  }

  // No migration needed, update directly
  await updateLLMProvider(session.organizationId, newProvider);
  return NextResponse.json({ success: true });
}

// Confirmation endpoint
export async function POST(request: NextRequest) {
  const { newProvider, confirmed } = await request.json();
  const session = await getServerSession(authOptions);

  if (!confirmed) {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
  }

  // Update LLM provider
  await updateLLMProvider(session.organizationId, newProvider);

  // Queue embedding migration job
  const job = await embeddingMigrationQueue.add('migrate', {
    organizationId: session.organizationId,
    newProvider: getEmbeddingConfig(newProvider, true),
  });

  return NextResponse.json({
    success: true,
    migrationJobId: job.id,
    message: 'LLM provider updated. Embedding migration started in background.',
  });
}
```

### Recommendation: Standardize When Possible

For organizations that don't require strict data sovereignty:

```typescript
// Consider standardizing on OpenAI embeddings regardless of LLM provider
// Benefits:
// 1. No migration when switching LLM providers
// 2. Lower cost (OpenAI embeddings are cheaper than Bedrock Titan)
// 3. Better quality (OpenAI text-embedding-3-small has strong performance)
//
// Only use provider-specific embeddings when data sovereignty is required

if (!org.settings.requiresDataSovereignty) {
  // Always use OpenAI for embeddings, regardless of LLM provider
  return { provider: 'openai', dimensions: 1536 };
}
```

### Database Schema Consideration

The `embedding` column dimension must accommodate the largest embedding model:

```sql
-- Current schema uses 1536 dimensions (OpenAI)
-- If supporting Bedrock Titan (1024) or Vertex Gecko (768),
-- the column can remain 1536 (larger than needed is OK)
-- OR use separate columns per provider (not recommended)

-- Recommended: Keep single column, pad smaller embeddings
embedding vector(1536)
```

---

## References

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [AWS Bedrock Developer Guide](https://docs.aws.amazon.com/bedrock/)
- [Google Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Context Assembly Architecture](./CONTEXT_ASSEMBLY.md) — How context is assembled for generation
- [Secrets Management](../security/SECRETS_MANAGEMENT.md) — Credential storage for providers
