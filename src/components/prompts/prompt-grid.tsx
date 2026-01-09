'use client';

import { PromptCard } from './prompt-card';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface Variant {
  id: string;
  platform: string;
  optimized_prompt: string;
  result_image_url: string | null;
  result_thumbnail_url: string | null;
  rating: number | null;
  is_best: boolean;
}

interface Prompt {
  id: string;
  title: string;
  base_prompt: string;
  category: Category | null;
  tags: string[];
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  variants: Variant[];
}

interface PromptGridProps {
  prompts: Prompt[];
}

export function PromptGrid({ prompts }: PromptGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No prompts yet</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Get started by creating your first prompt
        </p>
        <Button asChild className="mt-4">
          <Link href="/prompts/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Prompt
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
