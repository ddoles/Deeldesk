/**
 * Proposal Generator
 *
 * Generates proposal slides using LLM with streaming.
 */

import { LLMProvider, Message } from './types';
import { assembleContext, buildSystemPrompt, AssembledContext } from './context-assembly';

// ============================================
// TYPES
// ============================================

export interface Slide {
  slideNumber: number;
  type: 'title' | 'executive_summary' | 'solution' | 'investment' | 'next_steps' | 'custom';
  title: string;
  content: SlideContent;
}

export interface SlideContent {
  heading?: string;
  subheading?: string;
  bullets?: string[];
  body?: string;
  table?: TableData;
  callout?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  footer?: string;
}

export interface GenerationProgress {
  slideIndex: number;
  totalSlides: number;
  currentSlide?: string;
}

// ============================================
// SYSTEM PROMPT
// ============================================

const PROPOSAL_SYSTEM_PROMPT = `You are an expert sales proposal writer for Deeldesk.ai. Your job is to generate professional, compelling sales proposals.

OUTPUT FORMAT:
You must respond with valid JSON containing an array of slides. Each slide has:
- slideNumber: number (1-indexed)
- type: one of "title", "executive_summary", "solution", "investment", "next_steps", "custom"
- title: string (slide title)
- content: object with relevant fields (heading, subheading, bullets, body, table, callout)

SLIDE STRUCTURE (5 slides minimum):
1. Title Slide - Company name, prospect name, date
2. Executive Summary - Key value propositions (3-5 bullets)
3. Solution Overview - How we solve their problem
4. Investment - Pricing (use [ENTER VALUE] for unknown prices)
5. Next Steps - Clear action items with timeline

GUIDELINES:
- Be concise and impactful
- Use active voice
- Focus on benefits, not features
- For pricing: ONLY use specific numbers if explicitly provided. Otherwise use [ENTER VALUE] placeholder
- Never hallucinate company names, prices, or specific claims
- If information is missing, use reasonable placeholders like [COMPANY NAME] or [PROSPECT NAME]

IMPORTANT: Your entire response must be valid JSON. Do not include any text before or after the JSON array.`;

// ============================================
// GENERATOR
// ============================================

/**
 * Generate proposal slides from a user prompt
 */
export async function generateProposalSlides(
  provider: LLMProvider,
  prompt: string,
  onProgress?: (progress: GenerationProgress) => Promise<void>
): Promise<Slide[]> {
  const messages: Message[] = [
    {
      role: 'user',
      content: `Generate a professional sales proposal based on the following request:\n\n${prompt}\n\nRespond with a JSON array of slides.`,
    },
  ];

  // Notify progress - starting
  if (onProgress) {
    await onProgress({ slideIndex: 0, totalSlides: 5 });
  }

  // Use streaming to get the response
  let fullContent = '';

  for await (const event of provider.streamCompletion(PROPOSAL_SYSTEM_PROMPT, messages, {
    maxTokens: 4096,
    temperature: 0.7,
  })) {
    if (event.type === 'content_delta' && event.content) {
      fullContent += event.content;

      // Try to estimate progress based on content length
      // Rough estimate: each slide is ~500 chars
      const estimatedSlides = Math.min(5, Math.floor(fullContent.length / 500) + 1);
      if (onProgress) {
        await onProgress({
          slideIndex: estimatedSlides,
          totalSlides: 5,
        });
      }
    }
  }

  // Parse the response
  const slides = parseSlideResponse(fullContent);

  // Final progress update
  if (onProgress) {
    await onProgress({
      slideIndex: slides.length,
      totalSlides: slides.length,
    });
  }

  return slides;
}

/**
 * Parse LLM response into slides array
 */
function parseSlideResponse(content: string): Slide[] {
  try {
    // Try to extract JSON from the response
    // Sometimes the LLM adds extra text before/after
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', content.substring(0, 200));
      return getDefaultSlides();
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      console.error('Parsed content is not an array');
      return getDefaultSlides();
    }

    // Validate and normalize slides
    return parsed.map((slide, index) => normalizeSlide(slide, index + 1));
  } catch (error) {
    console.error('Failed to parse slide response:', error);
    return getDefaultSlides();
  }
}

/**
 * Normalize a slide object to ensure it has required fields
 */
function normalizeSlide(slide: unknown, defaultNumber: number): Slide {
  const s = slide as Record<string, unknown>;

  return {
    slideNumber: typeof s.slideNumber === 'number' ? s.slideNumber : defaultNumber,
    type: isValidSlideType(s.type) ? s.type : 'custom',
    title: typeof s.title === 'string' ? s.title : `Slide ${defaultNumber}`,
    content: normalizeContent(s.content),
  };
}

function isValidSlideType(type: unknown): type is Slide['type'] {
  return (
    typeof type === 'string' &&
    ['title', 'executive_summary', 'solution', 'investment', 'next_steps', 'custom'].includes(type)
  );
}

function normalizeContent(content: unknown): SlideContent {
  if (!content || typeof content !== 'object') {
    return {};
  }

  const c = content as Record<string, unknown>;

  return {
    heading: typeof c.heading === 'string' ? c.heading : undefined,
    subheading: typeof c.subheading === 'string' ? c.subheading : undefined,
    bullets: Array.isArray(c.bullets)
      ? c.bullets.filter((b): b is string => typeof b === 'string')
      : undefined,
    body: typeof c.body === 'string' ? c.body : undefined,
    callout: typeof c.callout === 'string' ? c.callout : undefined,
    table: normalizeTable(c.table),
  };
}

function normalizeTable(table: unknown): TableData | undefined {
  if (!table || typeof table !== 'object') {
    return undefined;
  }

  const t = table as Record<string, unknown>;

  if (!Array.isArray(t.headers) || !Array.isArray(t.rows)) {
    return undefined;
  }

  return {
    headers: t.headers.filter((h): h is string => typeof h === 'string'),
    rows: t.rows
      .filter(Array.isArray)
      .map((row) => row.filter((cell): cell is string => typeof cell === 'string')),
    footer: typeof t.footer === 'string' ? t.footer : undefined,
  };
}

/**
 * Generate proposal slides with full context assembly
 */
export async function generateProposalWithContext(
  provider: LLMProvider,
  organizationId: string,
  opportunityId: string,
  prompt: string,
  onProgress?: (progress: GenerationProgress) => Promise<void>
): Promise<{ slides: Slide[]; context: AssembledContext }> {
  // Assemble context from database
  const context = await assembleContext(organizationId, opportunityId, prompt);

  // Build system prompt with context
  const systemPrompt = buildSystemPrompt(context);

  // Generate slides
  const slides = await generateProposalSlidesWithSystemPrompt(
    provider,
    systemPrompt,
    prompt,
    onProgress
  );

  return { slides, context };
}

/**
 * Generate slides with a custom system prompt
 */
async function generateProposalSlidesWithSystemPrompt(
  provider: LLMProvider,
  systemPrompt: string,
  userPrompt: string,
  onProgress?: (progress: GenerationProgress) => Promise<void>
): Promise<Slide[]> {
  const messages: Message[] = [
    {
      role: 'user',
      content: `Generate a professional sales proposal based on the following request:\n\n${userPrompt}\n\nRespond with a JSON array of slides.`,
    },
  ];

  // Notify progress - starting
  if (onProgress) {
    await onProgress({ slideIndex: 0, totalSlides: 5 });
  }

  // Use streaming to get the response
  let fullContent = '';

  for await (const event of provider.streamCompletion(systemPrompt, messages, {
    maxTokens: 4096,
    temperature: 0.7,
  })) {
    if (event.type === 'content_delta' && event.content) {
      fullContent += event.content;

      // Estimate progress
      const estimatedSlides = Math.min(5, Math.floor(fullContent.length / 500) + 1);
      if (onProgress) {
        await onProgress({
          slideIndex: estimatedSlides,
          totalSlides: 5,
        });
      }
    }
  }

  // Parse the response
  const slides = parseSlideResponse(fullContent);

  // Final progress update
  if (onProgress) {
    await onProgress({
      slideIndex: slides.length,
      totalSlides: slides.length,
    });
  }

  return slides;
}

/**
 * Get default slides if parsing fails
 */
function getDefaultSlides(): Slide[] {
  return [
    {
      slideNumber: 1,
      type: 'title',
      title: 'Proposal',
      content: {
        heading: '[COMPANY NAME]',
        subheading: 'Prepared for [PROSPECT NAME]',
      },
    },
    {
      slideNumber: 2,
      type: 'executive_summary',
      title: 'Executive Summary',
      content: {
        bullets: [
          'We understand your challenges',
          'Our solution addresses your key needs',
          'Together we can achieve your goals',
        ],
      },
    },
    {
      slideNumber: 3,
      type: 'solution',
      title: 'Our Solution',
      content: {
        body: 'Details about how we can help solve your challenges.',
      },
    },
    {
      slideNumber: 4,
      type: 'investment',
      title: 'Investment',
      content: {
        body: 'Pricing details will be provided separately.',
        callout: 'Contact us for a custom quote',
      },
    },
    {
      slideNumber: 5,
      type: 'next_steps',
      title: 'Next Steps',
      content: {
        bullets: [
          'Schedule a follow-up call',
          'Review proposal details',
          'Finalize agreement',
        ],
      },
    },
  ];
}
