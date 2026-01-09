import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateVariantSchema = z.object({
  platform: z.string().min(1).optional(),
  optimized_prompt: z.string().min(1).optional(),
  negative_prompt: z.string().nullable().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  result_image_url: z.string().url().nullable().optional(),
  result_thumbnail_url: z.string().url().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
  is_best: z.boolean().optional(),
});

// PATCH /api/prompts/[id]/variants/[vid] - Update a variant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const supabase = await createClient();
  const { id, vid } = await params;

  try {
    const body = await request.json();
    const validated = updateVariantSchema.parse(body);

    // If this is marked as best, unset other best variants for this prompt
    if (validated.is_best) {
      await supabase
        .from('prompt_variants')
        .update({ is_best: false })
        .eq('prompt_id', id)
        .neq('id', vid);
    }

    const { data, error } = await supabase
      .from('prompt_variants')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vid)
      .eq('prompt_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE /api/prompts/[id]/variants/[vid] - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const supabase = await createClient();
  const { id, vid } = await params;

  const { error } = await supabase
    .from('prompt_variants')
    .delete()
    .eq('id', vid)
    .eq('prompt_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
