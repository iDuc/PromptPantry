import { createClient } from '@/lib/supabase/server';
import { PromptGrid } from '@/components/prompts/prompt-grid';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import Link from 'next/link';

interface HomePageProps {
  searchParams: Promise<{
    search?: string;
    tag?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const tag = params.tag || '';

  const supabase = await createClient();

  let query = supabase
    .from('prompts')
    .select(`
      *,
      category:categories(id, name, slug, icon, color),
      variants:prompt_variants(id, platform, optimized_prompt, result_image_url, result_thumbnail_url, rating, is_best)
    `)
    .eq('is_archived', false);

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,base_prompt.ilike.%${search}%`);
  }

  // Apply tag filter
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data: prompts } = await query.order('created_at', { ascending: false });

  const hasFilters = search || tag;
  const resultCount = prompts?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Prompts</h1>
        <p className="text-muted-foreground">
          Manage and organize your AI generation prompts
        </p>
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
            {search && ` for "${search}"`}
          </span>

          {tag && (
            <Link href={search ? `/?search=${encodeURIComponent(search)}` : '/'}>
              <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
                Tag: {tag}
                <X className="h-3 w-3" />
              </Badge>
            </Link>
          )}

          {(search || tag) && (
            <Link href="/" className="text-sm text-primary hover:underline">
              Clear all
            </Link>
          )}
        </div>
      )}

      <PromptGrid prompts={prompts || []} />
    </div>
  );
}
