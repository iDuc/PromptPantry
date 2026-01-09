import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon, color')
    .order('sort_order', { ascending: true });

  return (
    <AppLayout categories={categories || []}>
      {children}
    </AppLayout>
  );
}
