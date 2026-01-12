'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Copy, Check, MoreVertical, Heart, Archive, Trash2, Sparkles } from 'lucide-react';
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
import { springTransition, quickTransition } from '@/lib/motion';

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
  const [isHovered, setIsHovered] = useState(false);
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
    <motion.div
      onClick={handleCardClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      className="cursor-pointer"
    >
      <Card
        className={cn(
          'group overflow-hidden',
          'ring-1 ring-border/50 transition-shadow',
          isHovered && 'ring-2 ring-primary/50 shadow-lg'
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <motion.div
              className="h-full w-full"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt={prompt.title}
                className="h-full w-full object-cover"
              />
            </motion.div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-muted/50">
                <Sparkles className="h-6 w-6 text-muted-foreground/50" />
              </div>
            </div>
          )}

          {/* Gradient overlay that intensifies on hover */}
          <motion.div
            className="absolute inset-0 hidden md:flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: isHovered ? 0.9 : 0.3 }}
            transition={quickTransition}
          />

          {/* Prompt preview slides up on hover */}
          <motion.div
            className="absolute bottom-0 inset-x-0 p-4 hidden md:block"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10,
            }}
            transition={quickTransition}
          >
            <p className="line-clamp-2 font-mono text-xs text-white/90">
              {prompt.base_prompt}
            </p>
          </motion.div>

          {/* Quick actions - always visible on mobile, stagger in on desktop hover */}
          <motion.div
            className="absolute right-2 top-2 flex gap-1.5"
            initial={{ opacity: 1 }}
            animate={{
              opacity: 1,
            }}
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
                    <motion.div
                      animate={isFavorite ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Heart
                        className={cn(
                          'h-5 w-5 md:h-4 md:w-4 transition-colors',
                          isFavorite && 'fill-accent text-accent'
                        )}
                      />
                    </motion.div>
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
          </motion.div>

          {/* Rating badge with glow */}
          {avgRating && (
            <div
              className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
              style={{ boxShadow: '0 0 12px rgba(251, 191, 36, 0.3)' }}
            >
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
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
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{prompt.variants.length} variant{prompt.variants.length !== 1 ? 's' : ''}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
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
    </motion.div>
  );
}
