import { createClient } from '@/lib/supabase/server';
import { PromptGrid } from '@/components/prompts/prompt-grid';

export default async function ArchivePage() {
  const supabase = await createClient();

  const { data: prompts } = await supabase
    .from('prompts')
    .select(`
      *,
      category:categories(id, name, slug, icon, color),
      variants:prompt_variants(id, platform, optimized_prompt, result_image_url, result_thumbnail_url, rating, is_best)
    `)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="text-muted-foreground">
          Archived prompts you no longer actively use
        </p>
      </div>
      <PromptGrid prompts={prompts || []} emptyVariant="archive" />
    </div>
  );
}
