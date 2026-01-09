import { createClient } from '@/lib/supabase/server';
import { ImportForm } from '@/components/import/import-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function ImportPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon, color')
    .order('sort_order', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Prompts</h1>
          <p className="text-sm text-muted-foreground">
            Import your prompts from Midjourney or other sources
          </p>
        </div>
      </div>

      <ImportForm categories={categories || []} />
    </div>
  );
}
