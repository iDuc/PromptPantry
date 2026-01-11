import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  base_prompt: z.string().min(1, 'Prompt is required'),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  source_platform: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

// GET /api/prompts - List all prompts
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  // Build query
  let query = supabase
    .from('prompts')
    .select(`
      *,
      category:categories(id, name, slug, icon, color),
      variants:prompt_variants(id, platform, optimized_prompt, result_image_url, result_thumbnail_url, rating, is_best)
    `);

  // Filters
  const categorySlug = searchParams.get('category');
  const isFavorite = searchParams.get('favorite');
  const isArchived = searchParams.get('archived');
  const search = searchParams.get('search');
  const tag = searchParams.get('tag');

  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  if (isFavorite === 'true') {
    query = query.eq('is_favorite', true);
  }

  if (isArchived === 'true') {
    query = query.eq('is_archived', true);
  } else {
    query = query.eq('is_archived', false);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,base_prompt.ilike.%${search}%`);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  // Sorting
  const sortBy = searchParams.get('sort') || 'created_at';
  const sortOrder = searchParams.get('order') === 'asc' ? true : false;

  if (sortBy === 'rating') {
    // For rating, we'd need a computed column or do it client-side
    query = query.order('created_at', { ascending: false });
  } else if (sortBy === 'use_count') {
    query = query.order('use_count', { ascending: sortOrder });
  } else {
    query = query.order('created_at', { ascending: sortOrder });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/prompts - Create a new prompt
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createPromptSchema.parse(body);

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        title: validated.title,
        base_prompt: validated.base_prompt,
        description: validated.description || null,
        category_id: validated.category_id || null,
        source_platform: validated.source_platform || null,
        tags: validated.tags,
        user_id: user.id,
      })
      .select(`
        *,
        category:categories(id, name, slug, icon, color)
      `)
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
