'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { usePlatforms } from '@/hooks/use-platforms';
import { ImageUpload, UploadedImage } from './image-upload';

interface VariantFormData {
  platform: string;
  modelVersion: string;
  optimizedPrompt: string;
  negativePrompt: string;
  parameters: string;
  notes: string;
  resultImage: UploadedImage | null;
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
  model_version?: string | null;
}

interface VariantFormDialogProps {
  promptId: string;
  basePrompt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingVariant?: Variant | null;
}

export function VariantFormDialog({
  promptId,
  basePrompt,
  open,
  onOpenChange,
  onSuccess,
  editingVariant,
}: VariantFormDialogProps) {
  const isEditing = !!editingVariant;
  const { platforms, isLoading: platformsLoading } = usePlatforms();

  const [formData, setFormData] = useState<VariantFormData>({
    platform: '',
    modelVersion: '',
    optimizedPrompt: basePrompt,
    negativePrompt: '',
    parameters: '',
    notes: '',
    resultImage: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when editingVariant changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        platform: editingVariant?.platform || '',
        modelVersion: editingVariant?.model_version || '',
        optimizedPrompt: editingVariant?.optimized_prompt || basePrompt,
        negativePrompt: editingVariant?.negative_prompt || '',
        parameters: editingVariant?.parameters
          ? JSON.stringify(editingVariant.parameters, null, 2)
          : '',
        notes: editingVariant?.notes || '',
        resultImage: editingVariant?.result_image_url
          ? {
              url: editingVariant.result_image_url,
              thumbnailUrl: editingVariant.result_thumbnail_url || null,
            }
          : null,
      });
    }
  }, [open, editingVariant, basePrompt]);

  const handleSubmit = async () => {
    if (!formData.platform) {
      toast.error('Please select a platform');
      return;
    }

    if (!formData.optimizedPrompt.trim()) {
      toast.error('Optimized prompt is required');
      return;
    }

    let parameters = {};
    if (formData.parameters.trim()) {
      try {
        parameters = JSON.parse(formData.parameters);
      } catch {
        toast.error('Invalid JSON in parameters field');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/prompts/${promptId}/variants/${editingVariant.id}`
        : `/api/prompts/${promptId}/variants`;

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: formData.platform,
          optimized_prompt: formData.optimizedPrompt,
          negative_prompt: formData.negativePrompt || null,
          parameters,
          notes: formData.notes || null,
          model_version: formData.modelVersion || null,
          result_image_url: formData.resultImage?.url || null,
          result_thumbnail_url: formData.resultImage?.thumbnailUrl || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save variant');
      }

      toast.success(isEditing ? 'Variant updated' : 'Variant created');
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? 'Failed to update variant' : 'Failed to create variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pass through open state changes (form data is synced via useEffect)
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      snapPoints={[0.9, 1]}
      dismissible={!isSubmitting}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {isEditing ? 'Edit Variant' : 'Add Variant'}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {isEditing
            ? 'Update the platform-specific variant details'
            : 'Create a platform-specific variant of your prompt'}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <ResponsiveDialogBody className="space-y-4">
        {/* Platform Selection */}
        <div className="space-y-2">
          <Label htmlFor="platform">Platform *</Label>
          <Select
            value={formData.platform}
            onValueChange={(value) => setFormData({ ...formData, platform: value })}
            disabled={isEditing}
          >
            <SelectTrigger className="h-12 md:h-10">
              <SelectValue placeholder="Select a platform" />
            </SelectTrigger>
            <SelectContent>
              {platformsLoading ? (
                <SelectItem value="_loading" disabled>Loading platforms...</SelectItem>
              ) : (
                platforms.map((platform) => (
                  <SelectItem
                    key={platform.slug}
                    value={platform.slug}
                    className="min-h-[44px] md:min-h-0"
                  >
                    <span className="flex items-center gap-2">
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Model Version */}
        <div className="space-y-2">
          <Label htmlFor="modelVersion">Model Version</Label>
          <Input
            id="modelVersion"
            value={formData.modelVersion}
            onChange={(e) => setFormData({ ...formData, modelVersion: e.target.value })}
            placeholder="e.g., v6.1, flux-1.1-pro, sdxl-turbo"
            className="h-12 md:h-10"
          />
          <p className="text-xs text-muted-foreground">
            Specify the exact model version used (optional)
          </p>
        </div>

        {/* Optimized Prompt */}
        <div className="space-y-2">
          <Label htmlFor="optimizedPrompt">Optimized Prompt *</Label>
          <Textarea
            id="optimizedPrompt"
            value={formData.optimizedPrompt}
            onChange={(e) => setFormData({ ...formData, optimizedPrompt: e.target.value })}
            placeholder="Enter the platform-optimized prompt"
            rows={4}
            className="font-mono text-sm min-h-[100px]"
          />
        </div>

        {/* Negative Prompt */}
        <div className="space-y-2">
          <Label htmlFor="negativePrompt">Negative Prompt</Label>
          <Textarea
            id="negativePrompt"
            value={formData.negativePrompt}
            onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
            placeholder="e.g., blurry, low quality, distorted"
            rows={2}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Things to avoid in the generated output
          </p>
        </div>

        {/* Parameters */}
        <div className="space-y-2">
          <Label htmlFor="parameters">Parameters (JSON)</Label>
          <Textarea
            id="parameters"
            value={formData.parameters}
            onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
            placeholder='e.g., {"ar": "16:9", "stylize": 500}'
            rows={3}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Platform-specific parameters in JSON format
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any notes about this variant..."
            rows={2}
          />
        </div>

        {/* Result Image */}
        <div className="space-y-2">
          <Label>Result Image</Label>
          <ImageUpload
            value={formData.resultImage}
            onChange={(data) => setFormData({ ...formData, resultImage: data })}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Upload the generated result image for this variant
          </p>
        </div>
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="h-12 md:h-10 w-full md:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-12 md:h-10 w-full md:w-auto"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Variant'}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  );
}
