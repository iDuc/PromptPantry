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

  return (
    <AppLayout categories={categories || []}>
      {children}
    </AppLayout>
  );
}
