import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PromptGrid } from '@/components/prompts/prompt-grid';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // Get prompts for this category
  const { data: prompts } = await supabase
    .from('prompts')
    .select(`
      *,
      category:categories(id, name, slug, icon, color),
      variants:prompt_variants(id, platform, optimized_prompt, result_image_url, result_thumbnail_url, rating, is_best)
    `)
    .eq('category_id', category.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        <p className="text-muted-foreground">
          Prompts in the {category.name.toLowerCase()} category
        </p>
      </div>
      <PromptGrid prompts={prompts || []} />
    </div>
  );
}
