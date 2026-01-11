'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Star, Copy, Check, MoreVertical, Heart, Archive, Trash2 } from 'lucide-react';
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
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(prompt.is_favorite);
  const [isPressed, setIsPressed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Prompt deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete prompt');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true }),
      });
      if (!response.ok) throw new Error('Failed to archive');
      toast.success('Prompt archived');
      router.refresh();
    } catch {
      toast.error('Failed to archive prompt');
    }
  };

  const handleCardClick = () => {
    router.push(`/prompts/${prompt.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="cursor-pointer"
    >
      <Card
        className={cn(
          'group overflow-hidden transition-all',
          'hover:ring-2 hover:ring-primary/50',
          // Mobile press effect
          isPressed && 'scale-[0.98] shadow-sm',
          !isPressed && 'scale-100'
        )}
      >
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

          {/* Overlay on hover - hidden on mobile */}
          <div className="absolute inset-0 hidden md:flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="w-full p-3">
              <p className="line-clamp-2 font-mono text-xs text-white/90">
                {prompt.base_prompt}
              </p>
            </div>
          </div>

          {/* Quick actions - always visible on mobile, hover on desktop */}
          <div
            className={cn(
              'absolute right-2 top-2 flex gap-1 transition-opacity',
              // Always visible on mobile, hover-only on desktop
              'opacity-100 md:opacity-0 md:group-hover:opacity-100'
            )}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    // Larger touch targets on mobile
                    className="h-10 w-10 md:h-8 md:w-8 active:scale-95 transition-transform"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-5 w-5 md:h-4 md:w-4" />
                    ) : (
                      <Copy className="h-5 w-5 md:h-4 md:w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="hidden md:block">Copy prompt</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 md:h-8 md:w-8 active:scale-95 transition-transform"
                    onClick={handleFavorite}
                  >
                    <Heart
                      className={cn(
                        'h-5 w-5 md:h-4 md:w-4 transition-all',
                        isFavorite && 'fill-accent text-accent scale-110'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="hidden md:block">
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 md:h-8 md:w-8 active:scale-95 transition-transform"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="min-h-[44px] md:min-h-0"
                  onClick={handleArchive}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive min-h-[44px] md:min-h-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
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
              <Link
                href={`/category/${prompt.category.slug}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-muted transition-colors"
                  style={{
                    borderColor: prompt.category.color || undefined,
                    color: prompt.category.color || undefined,
                  }}
                >
                  {prompt.category.name}
                </Badge>
              </Link>
            )}
            {prompt.tags?.slice(0, 2).map((tag) => (
              <Link
                key={tag}
                href={`/?tags=${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors">
                  {tag}
                </Badge>
              </Link>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{prompt.title}&quot;? This will also delete all variants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
