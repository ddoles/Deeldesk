import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import Anthropic from '@anthropic-ai/sdk';
import {
  BATTLECARD_EXTRACTION_PROMPT,
  BattlecardExtractionResult,
} from '@/lib/ai/extraction-prompts';

// Lazy initialization to ensure env vars are loaded
function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Supported image types for Claude Vision
const SUPPORTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

function isSupportedMediaType(type: string): type is SupportedMediaType {
  return SUPPORTED_MEDIA_TYPES.includes(type as SupportedMediaType);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { image } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Validate base64 image format
    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URL.' },
        { status: 400 }
      );
    }

    const [, mediaType, base64Data] = matches;

    if (!isSupportedMediaType(mediaType)) {
      return NextResponse.json(
        {
          error: `Unsupported image type: ${mediaType}. Supported: ${SUPPORTED_MEDIA_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check base64 data size (rough estimate: 10MB limit)
    const estimatedSize = (base64Data.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Call Claude Vision API
    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: BATTLECARD_EXTRACTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Extract competitor intelligence from this image. Return only valid JSON.',
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let extracted: BattlecardExtractionResult;
    try {
      // Handle potential markdown code blocks in response
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      extracted = JSON.parse(jsonText.trim());
    } catch {
      console.error('Failed to parse extraction response:', textContent.text);
      return NextResponse.json(
        { error: 'Failed to parse extracted data' },
        { status: 500 }
      );
    }

    // Check for extraction error
    if (extracted.error) {
      return NextResponse.json(
        { success: false, error: extracted.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extracted,
    });
  } catch (error) {
    console.error('Battlecard extraction error:', error);

    // Handle specific Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to extract competitor information' },
      { status: 500 }
    );
  }
}
