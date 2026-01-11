'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Copy, Save, Sparkles, Check } from 'lucide-react';
import { useState } from 'react';

interface FinalPromptCardProps {
  prompt: string;
  onSave?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  className?: string;
}

export function FinalPromptCard({
  prompt,
  onSave,
  onCopy,
  className,
}: FinalPromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card
      className={cn(
        'border-primary/30 bg-primary/5',
        'overflow-hidden',
        className
      )}
    >
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-primary" />
          Your Generated Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        <div
          className={cn(
            'p-3 rounded-md',
            'bg-background/80 border border-border/50',
            'font-mono text-sm',
            'whitespace-pre-wrap break-words'
          )}
        >
          {prompt}
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
        {onSave && (
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save to Library
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
