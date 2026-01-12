import { createClient } from '@/lib/supabase/server';
import { PromptGrid } from '@/components/prompts/prompt-grid';

export default async function FavoritesPage() {
  const supabase = await createClient();

  const { data: prompts } = await supabase
    .from('prompts')
    .select(`
      *,
      category:categories(id, name, slug, icon, color),
      variants:prompt_variants(id, platform, optimized_prompt, result_image_url, result_thumbnail_url, rating, is_best)
    `)
    .eq('is_favorite', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">
          Your favorite prompts for quick access
        </p>
      </div>
      <PromptGrid prompts={prompts || []} emptyVariant="favorites" />
    </div>
  );
}
