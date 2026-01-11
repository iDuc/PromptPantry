'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Platform } from '@/hooks/use-platforms';

interface TestResult {
  optimizedPrompt: string;
  negativePrompt: string | null;
  parameters: Record<string, unknown>;
  reasoning: string | null;
}

interface PlatformTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: Platform | null;
}

export function PlatformTestDialog({
  open,
  onOpenChange,
  platform,
}: PlatformTestDialogProps) {
  const [testPrompt, setTestPrompt] = useState('A woman walking through a forest');
  const [result, setResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    if (!platform) return;

    if (!testPrompt.trim()) {
      toast.error('Please enter a test prompt');
      return;
    }

    setIsTesting(true);
    setResult(null);

    try {
      const response = await fetch(`/api/platforms/${platform.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Test failed');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  if (!platform) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{platform.icon}</span>
            Test {platform.name}
          </DialogTitle>
          <DialogDescription>
            Test the optimization prompt with a sample input
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Test Input */}
          <div className="space-y-2">
            <Label htmlFor="testPrompt">Test Prompt</Label>
            <Textarea
              id="testPrompt"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a prompt to test..."
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run Test
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <>
              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge
                    style={{ backgroundColor: platform.color || undefined, color: 'white' }}
                  >
                    Optimized Result
                  </Badge>
                </div>

                {/* Optimized Prompt */}
                <div className="space-y-2">
                  <Label>Optimized Prompt</Label>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="font-mono text-sm whitespace-pre-wrap">
                      {result.optimizedPrompt}
                    </p>
                  </div>
                </div>

                {/* Negative Prompt */}
                {result.negativePrompt && (
                  <div className="space-y-2">
                    <Label>Negative Prompt</Label>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="font-mono text-sm text-muted-foreground">
                        {result.negativePrompt}
                      </p>
                    </div>
                  </div>
                )}

                {/* Parameters */}
                {Object.keys(result.parameters || {}).length > 0 && (
                  <div className="space-y-2">
                    <Label>Parameters</Label>
                    <div className="rounded-lg bg-muted p-3">
                      <pre className="font-mono text-xs text-muted-foreground">
                        {JSON.stringify(result.parameters, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                {result.reasoning && (
                  <div className="space-y-2">
                    <Label>Reasoning</Label>
                    <div className="rounded-lg bg-blue-500/10 p-3">
                      <p className="text-sm text-muted-foreground">
                        {result.reasoning}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
