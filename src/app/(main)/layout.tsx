import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication - redirect to login if not authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon, color')
    .order('sort_order', { ascending: true });

  // Fetch tags with counts for sidebar
  const { data: prompts } = await supabase
    .from('prompts')
    .select('tags')
    .eq('is_archived', false);

  // Aggregate tags with counts
  const tagCounts = new Map<string, number>();
  prompts?.forEach(p => {
    p.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  // Get top 5 tags sorted by count
  const topTags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <AppLayout categories={categories || []} tags={topTags}>
      {children}
    </AppLayout>
  );
}
