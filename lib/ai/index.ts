/**
 * AI Module - LLM Provider Abstraction Layer
 *
 * Usage:
 * ```typescript
 * import { getProviderForOrganization } from '@/lib/ai';
 *
 * const provider = await getProviderForOrganization(organizationId);
 * const response = await provider.generateCompletion(systemPrompt, messages);
 * ```
 */

// Types
export * from './types';

// Provider factory
export {
  getProviderForOrganization,
  getDefaultProvider,
  createProvider,
  clearProviderCache,
  isProviderAvailable,
} from './provider-factory';

// Providers (for direct use in tests or specific scenarios)
export { AnthropicDirectProvider } from './providers/anthropic';
