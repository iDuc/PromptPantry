import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query prompts and aggregate tags in JS
  // This is simpler than creating an RPC function and works well for small datasets
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('tags')
    .eq('is_archived', false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate tags with counts
  const tagCounts = new Map<string, number>();
  prompts?.forEach(p => {
    p.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  // Convert to array and sort by count
  let tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Filter by search if provided
  if (search) {
    const searchLower = search.toLowerCase();
    tags = tags.filter(t => t.name.toLowerCase().includes(searchLower));
  }

  return NextResponse.json({ tags: tags.slice(0, limit) });
}
