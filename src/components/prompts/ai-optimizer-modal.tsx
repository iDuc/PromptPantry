'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { usePlatforms } from '@/hooks/use-platforms';
import { Wand2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIOptimizerModalProps {
  promptId: string;
  basePrompt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OptimizationResult {
  optimizedPrompt: string;
  negativePrompt: string | null;
  parameters: Record<string, unknown>;
  reasoning: string | null;
}

export function AIOptimizerModal({
  promptId,
  basePrompt,
  open,
  onOpenChange,
  onSuccess,
}: AIOptimizerModalProps) {
  const { platforms, getPlatform, isLoading: platformsLoading } = usePlatforms();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [editedNegative, setEditedNegative] = useState('');

  const handleOptimize = async () => {
    if (!selectedPlatform) {
      toast.error('Please select a platform');
      return;
    }

    setIsOptimizing(true);
    setResult(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrompt,
          targetPlatform: selectedPlatform,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Optimization failed');
      }

      const data = await response.json();
      setResult(data);
      setEditedPrompt(data.optimizedPrompt);
      setEditedNegative(data.negativePrompt || '');
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to optimize prompt');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveAsVariant = async () => {
    if (!selectedPlatform || !editedPrompt.trim()) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/prompts/${promptId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          optimized_prompt: editedPrompt,
          negative_prompt: editedNegative || null,
          parameters: result?.parameters || {},
          notes: result?.reasoning ? `AI-generated: ${result.reasoning}` : 'AI-optimized variant',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save variant');
      }

      toast.success('Variant created successfully');
      onSuccess();
      handleClose();
    } catch {
      toast.error('Failed to save variant');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedPlatform(null);
    setResult(null);
    setEditedPrompt('');
    setEditedNegative('');
    onOpenChange(false);
  };

  const platform = selectedPlatform ? getPlatform(selectedPlatform) : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Prompt Optimizer
          </DialogTitle>
          <DialogDescription>
            Generate a platform-optimized version of your prompt using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Base Prompt Display */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Base Prompt</Label>
            <div className="rounded-lg bg-muted p-3">
              <p className="font-mono text-sm">{basePrompt}</p>
            </div>
          </div>

          <Separator />

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>Select Target Platform</Label>
            {platformsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {platforms.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => {
                      setSelectedPlatform(p.slug);
                      setResult(null);
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:bg-muted',
                      selectedPlatform === p.slug
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border'
                    )}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-xs font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          {selectedPlatform && !result && (
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full"
              size="lg"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing for {platform?.name}...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {platform?.name} Prompt
                </>
              )}
            </Button>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <Badge
                  style={{ backgroundColor: platform?.color || undefined, color: 'white' }}
                >
                  {platform?.icon} {platform?.name}
                </Badge>
                <span className="text-sm text-muted-foreground">Optimized Result</span>
              </div>

              {/* Reasoning */}
              {result.reasoning && (
                <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 p-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-muted-foreground">{result.reasoning}</p>
                </div>
              )}

              {/* Optimized Prompt */}
              <div className="space-y-2">
                <Label>Optimized Prompt</Label>
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              {/* Negative Prompt */}
              {(result.negativePrompt || editedNegative) && (
                <div className="space-y-2">
                  <Label>Negative Prompt</Label>
                  <Textarea
                    value={editedNegative}
                    onChange={(e) => setEditedNegative(e.target.value)}
                    rows={2}
                    className="font-mono text-sm"
                    placeholder="Things to avoid..."
                  />
                </div>
              )}

              {/* Parameters */}
              {Object.keys(result.parameters || {}).length > 0 && (
                <div className="space-y-2">
                  <Label>Suggested Parameters</Label>
                  <div className="rounded-lg bg-muted p-3">
                    <pre className="font-mono text-xs text-muted-foreground">
                      {JSON.stringify(result.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setEditedPrompt('');
                    setEditedNegative('');
                  }}
                  className="flex-1"
                >
                  Try Another Platform
                </Button>
                <Button
                  onClick={handleSaveAsVariant}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save as Variant'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
