'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIFieldGeneratorProps {
  fieldType: 'title' | 'description';
  context: {
    basePrompt: string;
    category?: string;
    tags?: string[];
    existingTitle?: string;
  };
  onAccept: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AIFieldGenerator({
  fieldType,
  context,
  onAccept,
  disabled = false,
  className,
}: AIFieldGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedValue, setGeneratedValue] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!context.basePrompt) {
      toast.error('Enter a base prompt first');
      return;
    }

    setIsGenerating(true);
    setGeneratedValue(null);

    try {
      const response = await fetch('/api/generate-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldType,
          basePrompt: context.basePrompt,
          category: context.category,
          tags: context.tags,
          existingTitle: context.existingTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedValue(data.value);
      setShowPreview(true);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedValue) {
      onAccept(generatedValue);
      setShowPreview(false);
      setGeneratedValue(null);
      toast.success(`${fieldType === 'title' ? 'Title' : 'Description'} applied`);
    }
  };

  const handleDismiss = () => {
    setShowPreview(false);
    setGeneratedValue(null);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const fieldLabel = fieldType === 'title' ? 'title' : 'description';

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={disabled || isGenerating}
              className={cn(
                'h-8 w-8 p-0 text-muted-foreground hover:text-foreground',
                'md:h-7 md:w-7',
                isGenerating && 'animate-pulse'
              )}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="sr-only">Generate {fieldLabel} with AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {disabled
              ? 'Enter a base prompt first'
              : isGenerating
              ? 'Generating...'
              : `Generate ${fieldLabel} with AI`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Preview Card */}
      {showPreview && generatedValue && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-2 duration-200 sm:w-96">
          <div className="rounded-lg border border-primary/20 bg-card p-3 shadow-lg">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              AI Generated {fieldType === 'title' ? 'Title' : 'Description'}
            </div>

            <div className="mb-3 rounded border bg-background p-2">
              <p
                className={cn(
                  'text-sm',
                  fieldType === 'title' ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {generatedValue}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-9 gap-1.5 sm:h-8"
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="h-9 gap-1.5 sm:h-8"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Regenerate
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAccept}
                className="h-9 gap-1.5 sm:h-8"
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
