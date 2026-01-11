'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Check, Heart, Plus, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VariantCard } from './variant-card';
import { VariantFormDialog } from './variant-form-dialog';
import { AIOptimizerModal } from './ai-optimizer-modal';
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
  model_version?: string | null;
}

interface Prompt {
  id: string;
  title: string;
  base_prompt: string;
  description: string | null;
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
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [isFavorite, setIsFavorite] = useState(prompt.is_favorite);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [isAIOptimizerOpen, setIsAIOptimizerOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<Variant | null>(null);

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

  const handleCopyDescription = async () => {
    if (!prompt.description) return;
    try {
      await navigator.clipboard.writeText(prompt.description);
      setCopiedDescription(true);
      toast.success('Description copied to clipboard');
      setTimeout(() => setCopiedDescription(false), 2000);
    } catch {
      toast.error('Failed to copy description');
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
      router.refresh();
    } catch {
      toast.error('Failed to set best variant');
    }
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setIsVariantDialogOpen(true);
  };

  const handleDeleteVariant = async () => {
    if (!deletingVariant) return;

    try {
      const response = await fetch(
        `/api/prompts/${prompt.id}/variants/${deletingVariant.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Variant deleted');
      setDeletingVariant(null);
      router.refresh();
    } catch {
      toast.error('Failed to delete variant');
    }
  };

  const handleVariantSuccess = () => {
    setEditingVariant(null);
    router.refresh();
  };

  const openAddVariantDialog = () => {
    setEditingVariant(null);
    setIsVariantDialogOpen(true);
  };

  return (
    <>
      {/* Mobile floating action bar - above bottom nav */}
      <div className="fixed bottom-20 left-4 right-4 z-40 md:hidden">
        <div className="flex gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Button onClick={handleCopy} className="h-12 flex-1 active:scale-95 transition-transform">
            {copied ? (
              <Check className="mr-2 h-5 w-5" />
            ) : (
              <Copy className="mr-2 h-5 w-5" />
            )}
            Copy Prompt
          </Button>
          <Button
            variant="outline"
            onClick={handleFavorite}
            className="h-12 w-12 active:scale-95 transition-transform"
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-all',
                isFavorite && 'fill-accent text-accent scale-110'
              )}
            />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 pb-20 md:pb-0">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Image */}
          {heroImage && (
            <div className="overflow-hidden rounded-lg bg-muted -mx-4 md:mx-0">
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
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Base Prompt</CardTitle>
              {/* Desktop only actions */}
              <div className="hidden md:flex items-center gap-2">
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

          {/* Description - for marketplace listings */}
          {prompt.description && (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">Description</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">For marketplace listings</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDescription}
                  className="h-10 md:h-8"
                >
                  {copiedDescription ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{prompt.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Platform Variants</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAIOptimizerOpen(true)}
                  className="h-10 md:h-8 flex-1 sm:flex-none"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">AI </span>Optimize
                </Button>
                <Button
                  size="sm"
                  onClick={openAddVariantDialog}
                  className="h-10 md:h-8 flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add </span>Variant
                </Button>
              </div>
            </div>

            {platforms.length > 0 ? (
              <Tabs defaultValue={platforms[0]} className="w-full">
                {/* Horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                  <TabsList className="w-max md:w-full justify-start">
                    {platforms.map((platformId) => {
                      const platform = PLATFORMS.find((p) => p.id === platformId);
                      return (
                        <TabsTrigger
                          key={platformId}
                          value={platformId}
                          className="min-h-[44px] md:min-h-0 shrink-0"
                        >
                          <span className="mr-2">{platform?.icon || '?'}</span>
                          {platform?.name || platformId}
                          <Badge variant="secondary" className="ml-2">
                            {variantsByPlatform[platformId].length}
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {platforms.map((platformId) => (
                  <TabsContent key={platformId} value={platformId} className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {variantsByPlatform[platformId].map((variant) => (
                        <VariantCard
                          key={variant.id}
                          variant={variant}
                          onRatingChange={(rating) => handleRatingChange(variant.id, rating)}
                          onSetBest={() => handleSetBest(variant.id)}
                          onEdit={() => handleEditVariant(variant)}
                          onDelete={() => setDeletingVariant(variant)}
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
                  <Button className="mt-4" onClick={openAddVariantDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Variant
                  </Button>
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
                    <Link href={`/category/${prompt.category.slug}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-muted transition-colors"
                        style={{
                          borderColor: prompt.category.color || undefined,
                          color: prompt.category.color || undefined,
                        }}
                      >
                        {prompt.category.name}
                      </Badge>
                    </Link>
                  </div>
                </div>
              )}

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Tags</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <Link key={tag} href={`/?tags=${encodeURIComponent(tag)}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                          {tag}
                        </Badge>
                      </Link>
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

      {/* Variant Form Dialog */}
      <VariantFormDialog
        promptId={prompt.id}
        basePrompt={prompt.base_prompt}
        open={isVariantDialogOpen}
        onOpenChange={setIsVariantDialogOpen}
        onSuccess={handleVariantSuccess}
        editingVariant={editingVariant}
      />

      {/* AI Optimizer Modal */}
      <AIOptimizerModal
        promptId={prompt.id}
        basePrompt={prompt.base_prompt}
        open={isAIOptimizerOpen}
        onOpenChange={setIsAIOptimizerOpen}
        onSuccess={handleVariantSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingVariant} onOpenChange={() => setDeletingVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this variant? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVariant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
