/**
 * Business Model Generator
 *
 * Uses LLM to generate a company profile/business model summary
 * based on company name and optional website content.
 */

import { getProviderForOrganization } from './provider-factory';

// ============================================
// TYPES
// ============================================

export interface BusinessModelInput {
  companyName: string;
  website?: string;
  industry?: string;
  additionalContext?: string;
}

export interface GeneratedBusinessModel {
  summary: string;
  companyOverview: string;
  valueProposition: string;
  targetCustomers: string;
  revenueModel: string;
  keyDifferentiators: string[];
  industry: string;
  marketSegment: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are an expert business analyst. Your task is to generate a comprehensive business model summary for a company based on available information.

You must respond with valid JSON in the following format:
{
  "summary": "A 2-3 sentence executive summary of the company and what they do",
  "companyOverview": "A paragraph describing the company, its history, size, and market position",
  "valueProposition": "What unique value the company provides to its customers",
  "targetCustomers": "Who the ideal customers are (industries, company sizes, roles)",
  "revenueModel": "How the company makes money (subscription, licensing, services, etc.)",
  "keyDifferentiators": ["Array of 3-5 key differentiators that set the company apart"],
  "industry": "Primary industry classification",
  "marketSegment": "Market segment (SMB, Mid-Market, Enterprise, etc.)",
  "confidence": "high, medium, or low based on information available"
}

Guidelines:
- If you don't have enough information about a field, make reasonable inferences based on industry norms
- Be professional and factual in tone
- Focus on business-relevant information
- Set confidence to "low" if working with minimal information, "medium" if making inferences, "high" if well-informed
- Your entire response must be valid JSON. Do not include any text before or after the JSON.`;

// ============================================
// GENERATOR FUNCTION
// ============================================

/**
 * Generate a business model summary using LLM
 */
export async function generateBusinessModel(
  organizationId: string,
  input: BusinessModelInput
): Promise<GeneratedBusinessModel> {
  const provider = await getProviderForOrganization(organizationId);

  const userPrompt = buildUserPrompt(input);

  const response = await provider.generateCompletion(
    SYSTEM_PROMPT,
    [{ role: 'user', content: userPrompt }],
    {
      maxTokens: 2048,
      temperature: 0.7,
    }
  );

  try {
    // Extract JSON from response
    let jsonStr = response.content.trim();

    // Handle markdown code blocks
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate required fields
    if (!parsed.summary || !parsed.companyOverview) {
      throw new Error('Missing required fields in response');
    }

    return {
      summary: parsed.summary,
      companyOverview: parsed.companyOverview,
      valueProposition: parsed.valueProposition || '',
      targetCustomers: parsed.targetCustomers || '',
      revenueModel: parsed.revenueModel || '',
      keyDifferentiators: Array.isArray(parsed.keyDifferentiators) ? parsed.keyDifferentiators : [],
      industry: parsed.industry || '',
      marketSegment: parsed.marketSegment || '',
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
    };
  } catch (error) {
    console.error('Failed to parse business model response:', error);
    console.error('Raw response:', response.content);
    throw new Error('Failed to generate business model - invalid response format');
  }
}

// ============================================
// HELPERS
// ============================================

function buildUserPrompt(input: BusinessModelInput): string {
  const parts: string[] = [];

  parts.push(`Generate a business model summary for: ${input.companyName}`);

  if (input.website) {
    parts.push(`\nWebsite: ${input.website}`);
  }

  if (input.industry) {
    parts.push(`\nIndustry: ${input.industry}`);
  }

  if (input.additionalContext) {
    parts.push(`\nAdditional context:\n${input.additionalContext}`);
  }

  if (!input.website && !input.industry && !input.additionalContext) {
    parts.push('\n\nNote: Limited information available. Please make reasonable inferences based on the company name and set confidence accordingly.');
  }

  return parts.join('');
}
