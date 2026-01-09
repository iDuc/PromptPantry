'use client';

import { useState } from 'react';
import { Copy, Check, Heart, Plus, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VariantCard } from './variant-card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PLATFORMS } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface Variant {
  id: string;
  prompt_id: string;
  platform: string;
  optimized_prompt: string;
  negative_prompt: string | null;
  parameters: Record<string, unknown>;
  result_image_url: string | null;
  result_thumbnail_url: string | null;
  rating: number | null;
  notes: string | null;
  is_best: boolean;
  created_at: string;
}

interface Prompt {
  id: string;
  title: string;
  base_prompt: string;
  category: Category | null;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  variants: Variant[];
}

interface PromptDetailProps {
  prompt: Prompt;
}

export function PromptDetail({ prompt }: PromptDetailProps) {
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(prompt.is_favorite);

  // Get best variant for hero image
  const bestVariant = prompt.variants?.find((v) => v.is_best);
  const heroImage = bestVariant?.result_image_url || bestVariant?.result_thumbnail_url;

  // Group variants by platform
  const variantsByPlatform = prompt.variants?.reduce((acc, variant) => {
    const platform = variant.platform;
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(variant);
    return acc;
  }, {} as Record<string, Variant[]>) || {};

  const platforms = Object.keys(variantsByPlatform);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.base_prompt);
      setCopied(true);
      toast.success('Base prompt copied to clipboard');

      // Increment use count
      await fetch(`/api/prompts/${prompt.id}/copy`, { method: 'POST' });

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleFavorite = async () => {
    try {
      const newFavorite = !isFavorite;
      setIsFavorite(newFavorite);

      await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: newFavorite }),
      });

      toast.success(newFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      setIsFavorite(!isFavorite);
      toast.error('Failed to update favorite');
    }
  };

  const handleRatingChange = async (variantId: string, rating: number) => {
    try {
      await fetch(`/api/prompts/${prompt.id}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      toast.success('Rating updated');
    } catch {
      toast.error('Failed to update rating');
    }
  };

  const handleSetBest = async (variantId: string) => {
    try {
      await fetch(`/api/prompts/${prompt.id}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_best: true }),
      });
      toast.success('Set as best variant');
      // Reload to reflect changes
      window.location.reload();
    } catch {
      toast.error('Failed to set best variant');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Hero Image */}
        {heroImage && (
          <div className="overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={prompt.title}
              className="w-full object-contain"
            />
          </div>
        )}

        {/* Base Prompt */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Base Prompt</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFavorite}
              >
                <Heart
                  className={cn(
                    'mr-2 h-4 w-4',
                    isFavorite && 'fill-accent text-accent'
                  )}
                />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="prompt-text text-sm leading-relaxed">{prompt.base_prompt}</p>
          </CardContent>
        </Card>

        {/* Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Platform Variants</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Wand2 className="mr-2 h-4 w-4" />
                AI Optimize
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>
          </div>

          {platforms.length > 0 ? (
            <Tabs defaultValue={platforms[0]} className="w-full">
              <TabsList className="w-full justify-start">
                {platforms.map((platformId) => {
                  const platform = PLATFORMS.find((p) => p.id === platformId);
                  return (
                    <TabsTrigger key={platformId} value={platformId}>
                      <span className="mr-2">{platform?.icon || '?'}</span>
                      {platform?.name || platformId}
                      <Badge variant="secondary" className="ml-2">
                        {variantsByPlatform[platformId].length}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {platforms.map((platformId) => (
                <TabsContent key={platformId} value={platformId} className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {variantsByPlatform[platformId].map((variant) => (
                      <VariantCard
                        key={variant.id}
                        variant={variant}
                        onRatingChange={(rating) => handleRatingChange(variant.id, rating)}
                        onSetBest={() => handleSetBest(variant.id)}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No variants yet</p>
                <p className="text-sm text-muted-foreground">
                  Add platform-specific variants or use AI to optimize
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            {prompt.category && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Category</span>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: prompt.category.color || undefined,
                      color: prompt.category.color || undefined,
                    }}
                  >
                    {prompt.category.name}
                  </Badge>
                </div>
              </div>
            )}

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Tags</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {prompt.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{prompt.use_count}</p>
                <p className="text-xs text-muted-foreground">Times Used</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{prompt.variants?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Variants</p>
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
              </div>
              {prompt.last_used_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Used</span>
                  <span>{new Date(prompt.last_used_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
