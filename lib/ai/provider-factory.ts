/**
 * LLM Provider Factory
 *
 * Selects the appropriate LLM provider based on organization settings and plan tier.
 *
 * Selection logic:
 * 1. Check org settings for preferred provider
 * 2. Check plan tier (Bedrock requires Team/Enterprise)
 * 3. Fall back to Anthropic Direct
 */

import { prisma } from '@/lib/db/prisma';
import { LLMProvider, ProviderId } from './types';
import { AnthropicDirectProvider } from './providers/anthropic';
import { BedrockProvider } from './providers/bedrock';

// Cache providers to avoid recreating them on every request
const providerCache = new Map<string, LLMProvider>();

/**
 * Get the appropriate provider for an organization
 */
export async function getProviderForOrganization(
  organizationId: string
): Promise<LLMProvider> {
  // Check cache first
  const cached = providerCache.get(organizationId);
  if (cached) {
    return cached;
  }

  // Get org settings to determine provider
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      planTier: true,
      settings: true,
    },
  });

  if (!org) {
    // Fall back to default provider for unknown org
    return getDefaultProvider();
  }

  // Extract provider preference from settings
  const settings = org.settings as Record<string, unknown> | null;
  const preferredProvider = settings?.llmProvider as ProviderId | undefined;

  // Determine which provider to use
  let provider: LLMProvider;

  if (preferredProvider === 'aws-bedrock') {
    // Bedrock requires Team or Enterprise tier
    if (org.planTier === 'team' || org.planTier === 'enterprise') {
      // Check if Bedrock is available
      const bedrockAvailable = await isProviderAvailable('aws-bedrock');
      if (bedrockAvailable) {
        provider = new BedrockProvider();
      } else {
        console.warn(
          `Bedrock requested for org ${organizationId} but AWS credentials not configured. Using Anthropic Direct.`
        );
        provider = new AnthropicDirectProvider();
      }
    } else {
      console.warn(
        `Bedrock requested for org ${organizationId} but plan tier is ${org.planTier}. Using Anthropic Direct.`
      );
      provider = new AnthropicDirectProvider();
    }
  } else {
    // Default to Anthropic Direct
    provider = new AnthropicDirectProvider();
  }

  // Cache the provider
  providerCache.set(organizationId, provider);

  return provider;
}

/**
 * Get the default provider (Anthropic Direct)
 */
export function getDefaultProvider(): LLMProvider {
  return new AnthropicDirectProvider();
}

/**
 * Create a specific provider instance (for testing or direct use)
 */
export function createProvider(
  type: ProviderId,
  options?: {
    apiKey?: string;
    model?: string;
    region?: string;
  }
): LLMProvider {
  switch (type) {
    case 'anthropic-direct':
      return new AnthropicDirectProvider(options?.apiKey, options?.model);

    case 'aws-bedrock':
      return new BedrockProvider({
        accessKeyId: options?.apiKey,
        region: options?.region,
        model: options?.model,
      });

    case 'google-vertex':
      // Will be implemented in Phase 3
      throw new Error('VertexProvider not yet implemented. Planned for Phase 3.');

    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

/**
 * Clear the provider cache (useful for testing or when settings change)
 */
export function clearProviderCache(organizationId?: string): void {
  if (organizationId) {
    providerCache.delete(organizationId);
  } else {
    providerCache.clear();
  }
}

/**
 * Check if a provider is available for use
 */
export async function isProviderAvailable(type: ProviderId): Promise<boolean> {
  try {
    switch (type) {
      case 'anthropic-direct':
        return !!process.env.ANTHROPIC_API_KEY;

      case 'aws-bedrock':
        return !!(
          process.env.AWS_ACCESS_KEY_ID &&
          process.env.AWS_SECRET_ACCESS_KEY &&
          process.env.AWS_REGION
        );

      case 'google-vertex':
        return false; // Not implemented yet

      default:
        return false;
    }
  } catch {
    return false;
  }
}
