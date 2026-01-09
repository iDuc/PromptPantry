import { createClient } from '@/lib/supabase/server';
import { SettingsPage } from '@/components/settings/settings-page';

export default async function Settings() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return <SettingsPage categories={categories || []} />;
}
