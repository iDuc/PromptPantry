'use client';

import { useState } from 'react';
import { Star, Copy, Check, Crown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { usePlatforms } from '@/hooks/use-platforms';

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

interface VariantCardProps {
  variant: Variant;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetBest?: () => void;
  onRatingChange?: (rating: number) => void;
}

export function VariantCard({
  variant,
  onEdit,
  onDelete,
  onSetBest,
  onRatingChange,
}: VariantCardProps) {
  const [copied, setCopied] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const { getPlatform } = usePlatforms();

  const platform = getPlatform(variant.platform);
  const thumbnailUrl = variant.result_thumbnail_url || variant.result_image_url;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(variant.optimized_prompt);
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  return (
    <Card className={cn('overflow-hidden', variant.is_best && 'ring-2 ring-accent')}>
      {/* Image */}
      {thumbnailUrl && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={`${platform?.name} result`}
            className="h-full w-full object-cover"
          />
          {variant.is_best && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
              <Crown className="h-3 w-3" />
              Best
            </div>
          )}
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{platform?.icon || '?'}</span>
          <Badge
            variant="outline"
            style={{ borderColor: platform?.color || undefined, color: platform?.color || undefined }}
          >
            {platform?.name || variant.platform}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleCopy}>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!variant.is_best && onSetBest && (
                <DropdownMenuItem onClick={onSetBest}>
                  <Crown className="mr-2 h-4 w-4" />
                  Set as Best
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Optimized Prompt */}
        <div className="space-y-1">
          <p className="font-mono text-sm leading-relaxed">{variant.optimized_prompt}</p>
        </div>

        {/* Negative Prompt */}
        {variant.negative_prompt && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Negative:</span>
            <p className="font-mono text-xs text-muted-foreground">
              {variant.negative_prompt}
            </p>
          </div>
        )}

        {/* Parameters */}
        {Object.keys(variant.parameters || {}).length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Parameters:</span>
            <p className="font-mono text-xs text-muted-foreground">
              {typeof variant.parameters === 'string'
                ? variant.parameters
                : JSON.stringify(variant.parameters)}
            </p>
          </div>
        )}

        {/* Notes */}
        {variant.notes && (
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-sm text-muted-foreground">{variant.notes}</p>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRatingChange?.(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-5 w-5 transition-colors',
                  (hoveredRating !== null ? star <= hoveredRating : star <= (variant.rating || 0))
                    ? 'fill-accent text-accent'
                    : 'text-muted-foreground/30'
                )}
              />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
