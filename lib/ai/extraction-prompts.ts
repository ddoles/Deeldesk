/**
 * AI Content Extraction Prompts for Knowledge Base
 *
 * These prompts are used with Claude Vision API to extract structured data
 * from screenshots and images for Products and Battlecards.
 */

export const PRODUCT_EXTRACTION_PROMPT = `You are a product information extractor. Analyze the provided image and extract product details.

RULES:
- Only extract information that is clearly visible in the image
- Use null for any field where information is not present or unclear
- Never invent or hallucinate data
- For pricing, only extract if exact numbers are visible
- Return valid JSON matching the schema exactly
- If multiple products/tiers/plans are shown, extract ALL of them as an array

SCHEMA - Return an object with a "products" array:
{
  "products": [
    {
      "name": string | null,
      "description": string | null,
      "category": string | null,
      "features": string[] | null,
      "useCases": string[] | null,
      "pricingModel": "per_user" | "per_seat" | "flat_rate" | "tiered" | "usage_based" | "custom" | null,
      "basePrice": number | null,
      "billingFrequency": "month" | "year" | "quarter" | "one-time" | null,
      "currency": "USD" | "EUR" | "GBP" | "CAD" | "AUD" | null
    }
  ]
}

FIELD GUIDANCE:
- name: The product, plan, or tier name (e.g., "Basic", "Pro", "Enterprise")
- description: A brief description of what the product/tier offers
- category: Type of product (Software, Hardware, Service, Platform, etc.)
- features: List of product features or capabilities mentioned for this tier
- useCases: Target use cases, industries, or customer segments
- pricingModel: How the product is priced
- basePrice: The starting or base price as a number (no currency symbols)
- billingFrequency: How often payment is made
- currency: Currency code if visible, default to USD if price shown but currency unclear

EXAMPLES:
- Pricing table with 3 tiers → return 3 products in the array
- Single product page → return 1 product in the array
- Product comparison chart → return each product as a separate item

If the image doesn't appear to contain product information, return:
{ "error": "No product information detected in image" }

Return ONLY valid JSON, no other text.`;

export const BATTLECARD_EXTRACTION_PROMPT = `You are a competitive intelligence extractor. Analyze the provided image and extract information about a competitor.

RULES:
- Only extract information that is clearly visible in the image
- Use null for any field where information is not present
- Never invent claims or competitive positioning
- Be objective - extract what's stated, not interpretations
- Return valid JSON matching the schema exactly

SCHEMA:
{
  "competitorName": string | null,
  "competitorWebsite": string | null,
  "strengths": string[] | null,
  "weaknesses": string[] | null,
  "keyDifferentiators": string[] | null,
  "pricingIntel": string | null,
  "targetMarket": string | null
}

FIELD GUIDANCE:
- competitorName: The company or product name being analyzed
- competitorWebsite: Their website URL if visible
- strengths: What they do well, their advantages, positive attributes
- weaknesses: Their disadvantages, limitations, areas where they fall short
- keyDifferentiators: What makes them unique or different from others
- pricingIntel: Any pricing information (keep as descriptive text)
- targetMarket: Who they sell to, their ideal customer profile

If the image doesn't appear to contain competitor information, return:
{ "error": "No competitor information detected in image" }

Return ONLY valid JSON, no other text.`;

export interface ExtractedProduct {
  name: string | null;
  description: string | null;
  category: string | null;
  features: string[] | null;
  useCases: string[] | null;
  pricingModel: 'per_user' | 'per_seat' | 'flat_rate' | 'tiered' | 'usage_based' | 'custom' | null;
  basePrice: number | null;
  billingFrequency: 'month' | 'year' | 'quarter' | 'one-time' | null;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | null;
}

export interface ProductExtractionResult {
  products?: ExtractedProduct[];
  error?: string;
}

export interface BattlecardExtractionResult {
  competitorName: string | null;
  competitorWebsite: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  keyDifferentiators: string[] | null;
  pricingIntel: string | null;
  targetMarket: string | null;
  error?: string;
}
