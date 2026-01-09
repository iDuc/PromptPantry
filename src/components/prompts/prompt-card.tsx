'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Copy, Check, MoreHorizontal, Heart, Archive, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(prompt.is_favorite);

  // Get the best variant image or first available
  const bestVariant = prompt.variants?.find((v) => v.is_best);
  const imageVariant = bestVariant || prompt.variants?.find((v) => v.result_thumbnail_url || v.result_image_url);
  const thumbnailUrl = imageVariant?.result_thumbnail_url || imageVariant?.result_image_url;

  // Get average rating from variants
  const variantsWithRating = prompt.variants?.filter((v) => v.rating) || [];
  const avgRating = variantsWithRating.length
    ? Math.round(variantsWithRating.reduce((acc, v) => acc + (v.rating || 0), 0) / variantsWithRating.length)
    : null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.base_prompt);
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);

      // TODO: Increment use count via API
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Update favorite via API
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  return (
    <Link href={`/prompts/${prompt.id}`}>
      <Card className="group overflow-hidden transition-all hover:ring-2 hover:ring-primary/50">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={prompt.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="font-mono text-4xl text-muted-foreground/30">?</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="w-full p-3">
              <p className="line-clamp-2 font-mono text-xs text-white/90">
                {prompt.base_prompt}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy prompt</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={handleFavorite}
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isFavorite && 'fill-accent text-accent'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rating badge */}
          {avgRating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              <Star className="h-3 w-3 fill-accent text-accent" />
              {avgRating}
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3">
          <h3 className="truncate font-medium">{prompt.title}</h3>

          <div className="mt-2 flex flex-wrap gap-1">
            {prompt.category && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: prompt.category.color || undefined,
                  color: prompt.category.color || undefined,
                }}
              >
                {prompt.category.name}
              </Badge>
            )}
            {prompt.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {(prompt.tags?.length || 0) > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{prompt.tags.length - 2}
              </Badge>
            )}
          </div>

          {/* Variants indicator */}
          {prompt.variants?.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <span>{prompt.variants.length} variant{prompt.variants.length !== 1 ? 's' : ''}</span>
              <span className="text-muted-foreground/50">|</span>
              <span>Used {prompt.use_count}x</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
