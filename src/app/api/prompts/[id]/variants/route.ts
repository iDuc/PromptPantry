import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createVariantSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  optimized_prompt: z.string().min(1, 'Prompt is required'),
  negative_prompt: z.string().nullable().optional(),
  parameters: z.record(z.string(), z.unknown()).default({}),
  result_image_url: z.string().url().nullable().optional(),
  result_thumbnail_url: z.string().url().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
  is_best: z.boolean().default(false),
  model_version: z.string().nullable().optional(),
});

// POST /api/prompts/[id]/variants - Add a variant to a prompt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createVariantSchema.parse(body);

    // Verify prompt exists and belongs to user (RLS will handle this)
    const { error: promptError } = await supabase
      .from('prompts')
      .select('id')
      .eq('id', id)
      .single();

    if (promptError) {
      if (promptError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }
      return NextResponse.json({ error: promptError.message }, { status: 500 });
    }

    // If this is marked as best, unset other best variants for this prompt
    if (validated.is_best) {
      await supabase
        .from('prompt_variants')
        .update({ is_best: false })
        .eq('prompt_id', id);
    }

    const { data, error } = await supabase
      .from('prompt_variants')
      .insert({
        prompt_id: id,
        platform: validated.platform,
        optimized_prompt: validated.optimized_prompt,
        negative_prompt: validated.negative_prompt || null,
        parameters: validated.parameters,
        result_image_url: validated.result_image_url || null,
        result_thumbnail_url: validated.result_thumbnail_url || null,
        rating: validated.rating || null,
        notes: validated.notes || null,
        is_best: validated.is_best,
        model_version: validated.model_version || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
