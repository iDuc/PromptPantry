import { createClient } from '@/lib/supabase/server';
import { PromptForm } from '@/components/prompts/prompt-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function NewPromptPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon, color')
    .order('sort_order', { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Prompt</h1>
          <p className="text-sm text-muted-foreground">
            Create a new prompt for your library
          </p>
        </div>
      </div>

      <PromptForm categories={categories || []} />
    </div>
  );
}
