import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { platforms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/platforms/[id]/test - Test a platform's optimization prompt
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { testPrompt, optimizationPrompt: customPrompt } = await request.json();

    if (!testPrompt) {
      return NextResponse.json(
        { error: 'testPrompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get the platform
    const platform = await db.query.platforms.findFirst({
      where: eq(platforms.id, id),
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    // Use custom optimization prompt if provided (for testing changes before save)
    // Otherwise use the platform's stored prompt
    const systemPrompt = customPrompt || platform.optimizationPrompt;

    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'Platform has no optimization prompt configured' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `${systemPrompt}

---

USER'S BASE PROMPT: "${testPrompt}"

---

Your task: Transform this base prompt into an optimized version specifically for ${platform.name}.

Apply all the best practices above. Be creative but faithful to the user's intent.

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text):
{
  "optimized_prompt": "the fully optimized prompt text following all best practices above",
  "negative_prompt": ${platform.supportsNegativePrompt ? '"things to avoid"' : 'null'},
  "parameters": {
    "key": "value pairs for platform-specific parameters"
  },
  "reasoning": "2-3 sentences explaining key optimizations made"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    let parsed;
    try {
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleanText);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: 'Failed to parse AI response', rawResponse: text },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      platform: {
        name: platform.name,
        slug: platform.slug,
        supportsNegativePrompt: platform.supportsNegativePrompt,
      },
      testInput: testPrompt,
      result: {
        optimizedPrompt: parsed.optimized_prompt || parsed.optimizedPrompt,
        negativePrompt: parsed.negative_prompt || parsed.negativePrompt || null,
        parameters: parsed.parameters || {},
        reasoning: parsed.reasoning || null,
      },
    });
  } catch (error) {
    console.error('Platform test error:', error);
    return NextResponse.json(
      { error: 'Failed to test platform optimization' },
      { status: 500 }
    );
  }
}
