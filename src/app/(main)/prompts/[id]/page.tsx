import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PromptDetail } from '@/components/prompts/prompt-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PromptDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select(`
      *,
      category:categories(id, name, slug, icon, color),
      variants:prompt_variants(*)
    `)
    .eq('id', id)
    .single();

  if (error || !prompt) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{prompt.title}</h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(prompt.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/prompts/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <PromptDetail prompt={prompt} />
    </div>
  );
}
