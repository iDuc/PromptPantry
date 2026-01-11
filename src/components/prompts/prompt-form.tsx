'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, Wand2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AIFieldGenerator } from '@/components/ui/ai-field-generator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import { PLATFORMS } from '@/lib/constants';
import { TagAutocomplete } from '@/components/tags/tag-autocomplete';
import {
  parseMidjourneyPrompt,
  detectMidjourneyPrompt,
  formatMidjourneyParameters,
  type ParsedMidjourneyPrompt,
} from '@/lib/parsers/midjourney';

const promptSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  base_prompt: z.string().min(1, 'Prompt is required'),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  source_platform: z.string().nullable().optional(),
  tags: z.array(z.string()),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface PromptFormProps {
  categories: Category[];
  initialData?: {
    id: string;
    title: string;
    base_prompt: string;
    description?: string | null;
    category_id: string | null;
    source_platform?: string | null;
    tags: string[];
  };
}

export function PromptForm({ categories, initialData }: PromptFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedMj, setParsedMj] = useState<ParsedMidjourneyPrompt | null>(null);
  const [showMjDetected, setShowMjDetected] = useState(false);
  const [createVariantOnSave, setCreateVariantOnSave] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: initialData?.title || '',
      base_prompt: initialData?.base_prompt || '',
      description: initialData?.description || '',
      category_id: initialData?.category_id || undefined,
      source_platform: initialData?.source_platform || undefined,
      tags: initialData?.tags || [],
    },
  });

  const tags = watch('tags');
  const categoryId = watch('category_id');
  const sourcePlatform = watch('source_platform');
  const basePrompt = watch('base_prompt');
  const title = watch('title');

  // Auto-detect Midjourney prompts
  useEffect(() => {
    if (basePrompt && !initialData && detectMidjourneyPrompt(basePrompt)) {
      setShowMjDetected(true);
      if (!sourcePlatform) {
        setValue('source_platform', 'midjourney');
      }
    } else {
      setShowMjDetected(false);
    }
  }, [basePrompt, initialData, sourcePlatform, setValue]);

  const handleParsePrompt = () => {
    const prompt = getValues('base_prompt');
    const parsed = parseMidjourneyPrompt(prompt);
    setParsedMj(parsed);
  };

  const handleApplyParsed = () => {
    if (parsedMj) {
      setValue('base_prompt', parsedMj.cleanPrompt);
      setCreateVariantOnSave(true);
      toast.success('Prompt cleaned. A Midjourney variant will be created when you save.');
    }
  };

  const onSubmit = async (data: PromptFormData) => {
    setIsSubmitting(true);

    try {
      const url = initialData
        ? `/api/prompts/${initialData.id}`
        : '/api/prompts';
      const method = initialData ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id || null,
          source_platform: data.source_platform || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save prompt');
      }

      const savedPrompt = await response.json();

      // Create Midjourney variant if requested
      if (createVariantOnSave && parsedMj && !initialData) {
        try {
          const variantResponse = await fetch(`/api/prompts/${savedPrompt.id}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'midjourney',
              optimized_prompt: parsedMj.cleanPrompt + ' ' + formatMidjourneyParameters(parsedMj.parameters),
              negative_prompt: parsedMj.parameters.no || null,
              parameters: parsedMj.rawParameters,
              model_version: parsedMj.parameters.version ? `v${parsedMj.parameters.version}` : null,
              notes: 'Auto-created from imported Midjourney prompt',
            }),
          });

          if (variantResponse.ok) {
            toast.success('Midjourney variant created automatically');
          }
        } catch {
          // Don't fail the whole operation if variant creation fails
          console.error('Failed to create variant');
        }
      }

      toast.success(initialData ? 'Prompt updated' : 'Prompt created');
      router.push(`/prompts/${savedPrompt.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Prompt' : 'Create Prompt'}</CardTitle>
          <CardDescription>
            {initialData
              ? 'Update your prompt details'
              : 'Add a new prompt to your library'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <AIFieldGenerator
                fieldType="title"
                context={{
                  basePrompt,
                  category: categories.find((c) => c.id === categoryId)?.name,
                  tags,
                }}
                onAccept={(value) => setValue('title', value)}
                disabled={!basePrompt}
              />
            </div>
            <Input
              id="title"
              placeholder="e.g., Cinematic Portrait Lighting"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Source Platform */}
          <div className="space-y-2">
            <label htmlFor="source_platform" className="text-sm font-medium">
              Source Platform <span className="text-muted-foreground">(optional)</span>
            </label>
            <Select
              value={sourcePlatform || ''}
              onValueChange={(value) => setValue('source_platform', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Where did this prompt come from?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Original</SelectItem>
                {PLATFORMS.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    <span className="flex items-center gap-2">
                      <span>{platform.icon}</span>
                      {platform.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Indicate if you copied this prompt from a specific platform
            </p>
          </div>

          {/* Base Prompt */}
          <div className="space-y-2">
            <label htmlFor="base_prompt" className="text-sm font-medium">
              Base Prompt
            </label>
            <Textarea
              id="base_prompt"
              placeholder="Enter your base prompt... You can paste directly from Midjourney"
              className="min-h-[120px] md:min-h-[150px] font-mono"
              {...register('base_prompt')}
            />
            {errors.base_prompt && (
              <p className="text-sm text-destructive">{errors.base_prompt.message}</p>
            )}
          </div>

          {/* Midjourney Detection Alert */}
          {showMjDetected && !parsedMj && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Midjourney parameters detected</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">
                  This prompt contains Midjourney flags like --ar, --v, --stylize, etc.
                  Would you like to extract them into a variant?
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleParsePrompt}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Parse Midjourney Parameters
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Parsed Midjourney Preview */}
          {parsedMj && (
            <Alert className="border-primary/50 bg-primary/5">
              <Check className="h-4 w-4 text-primary" />
              <AlertTitle>Parameters extracted</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Clean prompt:</p>
                  <p className="font-mono text-sm bg-background p-2 rounded border">
                    {parsedMj.cleanPrompt}
                  </p>
                </div>
                {Object.keys(parsedMj.parameters).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Extracted parameters:</p>
                    <div className="flex flex-wrap gap-1">
                      {parsedMj.parameters.version && (
                        <Badge variant="secondary">v{parsedMj.parameters.version}</Badge>
                      )}
                      {parsedMj.parameters.aspectRatio && (
                        <Badge variant="secondary">--ar {parsedMj.parameters.aspectRatio}</Badge>
                      )}
                      {parsedMj.parameters.chaos !== undefined && (
                        <Badge variant="secondary">--chaos {parsedMj.parameters.chaos}</Badge>
                      )}
                      {parsedMj.parameters.stylize !== undefined && (
                        <Badge variant="secondary">--stylize {parsedMj.parameters.stylize}</Badge>
                      )}
                      {parsedMj.parameters.raw && (
                        <Badge variant="secondary">--raw</Badge>
                      )}
                      {parsedMj.parameters.no && (
                        <Badge variant="secondary">--no {parsedMj.parameters.no}</Badge>
                      )}
                      {parsedMj.parameters.styleRefs?.length && (
                        <Badge variant="secondary">{parsedMj.parameters.styleRefs.length} style refs</Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyParsed}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Apply & Create Variant
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setParsedMj(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(optional)</span>
              </label>
              <AIFieldGenerator
                fieldType="description"
                context={{
                  basePrompt,
                  category: categories.find((c) => c.id === categoryId)?.name,
                  tags,
                  existingTitle: title,
                }}
                onAccept={(value) => setValue('description', value)}
                disabled={!basePrompt}
              />
            </div>
            <Textarea
              id="description"
              placeholder="Add a marketplace description for this artwork..."
              className="min-h-[80px]"
              {...register('description')}
            />
            <p className="text-xs text-muted-foreground">
              Use this for artwork listings on marketplaces like Etsy or Redbubble
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select
              value={categoryId || ''}
              onValueChange={(value) => setValue('category_id', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: category.color || undefined }}
                      />
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tags
            </label>
            <TagAutocomplete
              value={tags}
              onChange={(newTags) => setValue('tags', newTags)}
              placeholder="Add tags..."
            />
          </div>

          {/* Actions - Sticky footer on mobile */}
          <div className="sticky bottom-0 -mx-6 mt-6 border-t border-border bg-card px-6 py-4 md:static md:mx-0 md:mt-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
            <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="h-12 md:h-10 w-full md:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 md:h-10 w-full md:w-auto"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Save Changes' : 'Create Prompt'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
