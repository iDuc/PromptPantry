import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { platforms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getDefaultPlatform } from '@/lib/platforms/defaults';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { basePrompt, targetPlatform } = await request.json();

    if (!basePrompt || !targetPlatform) {
      return NextResponse.json(
        { error: 'Base prompt and target platform are required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Fetch platform from database
    const platform = await db.query.platforms.findFirst({
      where: and(
        eq(platforms.slug, targetPlatform),
        eq(platforms.isActive, true)
      ),
    });

    // If not found in database, try defaults as fallback
    let platformName: string;
    let systemPrompt: string | null;
    let supportsNegative: boolean;

    if (platform) {
      platformName = platform.name;
      systemPrompt = platform.optimizationPrompt;
      supportsNegative = platform.supportsNegativePrompt ?? false;
    } else {
      // Fallback to default platforms
      const defaultPlatform = getDefaultPlatform(targetPlatform);
      if (!defaultPlatform) {
        return NextResponse.json(
          { error: 'Invalid platform' },
          { status: 400 }
        );
      }
      platformName = defaultPlatform.name;
      systemPrompt = defaultPlatform.optimizationPrompt;
      supportsNegative = defaultPlatform.supportsNegativePrompt;
    }

    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'Platform has no optimization prompt configured' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `${systemPrompt}

---

USER'S BASE PROMPT: "${basePrompt}"

---

Your task: Transform this base prompt into an optimized version specifically for ${platformName}.

Apply all the best practices above. Be creative but faithful to the user's intent.

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text):
{
  "optimized_prompt": "the fully optimized prompt text following all best practices above",
  "negative_prompt": ${supportsNegative ? '"things to avoid (or null if not needed)"' : 'null'},
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
      // Remove potential markdown code blocks
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleanText);
    } catch {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse Gemini response:', text);
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      optimizedPrompt: parsed.optimized_prompt || parsed.optimizedPrompt,
      negativePrompt: parsed.negative_prompt || parsed.negativePrompt || null,
      parameters: parsed.parameters || {},
      reasoning: parsed.reasoning || null,
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize prompt' },
      { status: 500 }
    );
  }
}
