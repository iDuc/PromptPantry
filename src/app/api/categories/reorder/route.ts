import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

// POST /api/categories/reorder - Reorder categories
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { orderedIds } = reorderSchema.parse(body);

    // Update each category's sort_order based on position in array
    const updates = orderedIds.map((id, index) =>
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
  }
}
