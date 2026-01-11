import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const generateFieldSchema = z.object({
  fieldType: z.enum(['title', 'description']),
  basePrompt: z.string().min(1, 'Base prompt is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  existingTitle: z.string().optional(), // Used when generating description
});

const TITLE_PROMPT = `Generate a compelling, artistic title (3-7 words) for this artwork.

Requirements:
- Evocative and memorable
- Suitable for art marketplace listings (Etsy, Redbubble, Society6)
- No technical AI terms or platform names like "Midjourney", "AI", "generated"
- Capture the essence and mood of the artwork
- Should work well as a product title

Base prompt: "{basePrompt}"
{categoryLine}
{tagsLine}

Return ONLY the title text, no quotes, no explanation.`;

const DESCRIPTION_PROMPT = `Write a brief marketplace description (2-3 sentences) for this artwork.

Requirements:
- Describe visual elements, mood, and atmosphere
- Professional and engaging tone suitable for art marketplaces
- Do NOT mention AI, prompts, algorithms, or how it was created
- Focus on what the viewer will see and feel
- Make it appealing to potential buyers
- Should work well for print-on-demand products

Base prompt: "{basePrompt}"
{titleLine}
{categoryLine}
{tagsLine}

Return ONLY the description text, no quotes, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateFieldSchema.parse(body);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const { fieldType, basePrompt, category, tags, existingTitle } = validated;

    // Build the prompt
    let systemPrompt = fieldType === 'title' ? TITLE_PROMPT : DESCRIPTION_PROMPT;

    // Replace placeholders
    systemPrompt = systemPrompt.replace('{basePrompt}', basePrompt);
    systemPrompt = systemPrompt.replace(
      '{categoryLine}',
      category ? `Category: ${category}` : ''
    );
    systemPrompt = systemPrompt.replace(
      '{tagsLine}',
      tags && tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''
    );
    systemPrompt = systemPrompt.replace(
      '{titleLine}',
      existingTitle ? `Title: "${existingTitle}"` : ''
    );

    // Clean up empty lines
    systemPrompt = systemPrompt.replace(/\n\n\n+/g, '\n\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    let text = response.text().trim();

    // Clean up any quotes that might have been added
    text = text.replace(/^["']|["']$/g, '');

    return NextResponse.json({ value: text });
  } catch (error) {
    console.error('Generate field error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
