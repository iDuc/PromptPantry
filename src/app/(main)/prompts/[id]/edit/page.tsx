import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PromptForm } from '@/components/prompts/prompt-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPromptPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [promptResult, categoriesResult] = await Promise.all([
    supabase
      .from('prompts')
      .select('id, title, base_prompt, category_id, tags')
      .eq('id', id)
      .single(),
    supabase
      .from('categories')
      .select('id, name, slug, icon, color')
      .order('sort_order', { ascending: true }),
  ]);

  if (promptResult.error || !promptResult.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/prompts/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Prompt</h1>
          <p className="text-sm text-muted-foreground">
            Update your prompt details
          </p>
        </div>
      </div>

      <PromptForm
        categories={categoriesResult.data || []}
        initialData={promptResult.data}
      />
    </div>
  );
}
