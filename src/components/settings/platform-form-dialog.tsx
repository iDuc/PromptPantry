'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Platform } from '@/hooks/use-platforms';

const COLOR_OPTIONS = [
  '#5865F2', '#4285F4', '#FBBC04', '#10A37F', '#A855F7', '#000000', '#FF6B6B',
  '#0EA5E9', '#8B5CF6', '#10B981', '#EC4899', '#F59E0B', '#EF4444', '#22C55E',
];

const EMOJI_OPTIONS = [
  '🎨', '🎬', '🍌', '🖼️', '🌀', '⚡', '✨', '🚀', '💭', '🐼', '🌙', '⚔️',
  '🎭', '🎪', '🎯', '🔮', '🌈', '🎸', '🎹', '🎺', '🎻', '🎼', '🎵', '🎶',
];

interface PlatformFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: Platform | null;
  isCreating: boolean;
  onSuccess: () => void;
}

export function PlatformFormDialog({
  open,
  onOpenChange,
  platform,
  isCreating,
  onSuccess,
}: PlatformFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '🎨',
    color: '#5865F2',
    type: 'image' as 'image' | 'video',
    optimizationPrompt: '',
    supportsNegativePrompt: false,
    defaultParameters: '{}',
    tips: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  // Populate form when editing
  useEffect(() => {
    if (platform && !isCreating) {
      setFormData({
        name: platform.name,
        slug: platform.slug,
        icon: platform.icon || '🎨',
        color: platform.color || '#5865F2',
        type: platform.type as 'image' | 'video',
        optimizationPrompt: '', // Will be loaded separately if needed
        supportsNegativePrompt: platform.supportsNegativePrompt,
        defaultParameters: JSON.stringify(platform.defaultParameters || {}, null, 2),
        tips: platform.tips || '',
      });
      setAutoSlug(false);
      // Load full platform data including optimization prompt
      loadFullPlatform(platform.id);
    } else if (isCreating) {
      setFormData({
        name: '',
        slug: '',
        icon: '🎨',
        color: '#5865F2',
        type: 'image',
        optimizationPrompt: '',
        supportsNegativePrompt: false,
        defaultParameters: '{}',
        tips: '',
      });
      setAutoSlug(true);
    }
  }, [platform, isCreating, open]);

  const loadFullPlatform = async (id: string) => {
    try {
      const response = await fetch(`/api/platforms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          optimizationPrompt: data.optimizationPrompt || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load platform:', error);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      ...(autoSlug && {
        slug: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      }),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Platform name is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Platform slug is required');
      return;
    }

    let parameters = {};
    if (formData.defaultParameters.trim()) {
      try {
        parameters = JSON.parse(formData.defaultParameters);
      } catch {
        toast.error('Invalid JSON in default parameters');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const url = isCreating
        ? '/api/platforms'
        : `/api/platforms/${platform?.id}`;

      const response = await fetch(url, {
        method: isCreating ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          icon: formData.icon,
          color: formData.color,
          type: formData.type,
          optimizationPrompt: formData.optimizationPrompt,
          supportsNegativePrompt: formData.supportsNegativePrompt,
          defaultParameters: parameters,
          tips: formData.tips || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save platform');
      }

      toast.success(isCreating ? 'Platform created' : 'Platform updated');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save platform');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Add Platform' : `Edit ${platform?.name}`}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? 'Create a new AI generation platform'
              : 'Update platform configuration and optimization prompt'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name and Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Midjourney"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setFormData(prev => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="e.g., midjourney"
              />
            </div>
          </div>

          {/* Icon and Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                    className={`w-8 h-8 text-lg rounded flex items-center justify-center transition-all ${
                      formData.icon === emoji
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded-full transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'image' | 'video') =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optimization Prompt */}
          <div className="space-y-2">
            <Label htmlFor="optimizationPrompt">Optimization Prompt</Label>
            <Textarea
              id="optimizationPrompt"
              value={formData.optimizationPrompt}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, optimizationPrompt: e.target.value }))
              }
              placeholder="Enter the system prompt for AI optimization..."
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This prompt guides the AI when optimizing user prompts for this platform.
            </p>
          </div>

          {/* Supports Negative Prompt */}
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.supportsNegativePrompt}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, supportsNegativePrompt: checked }))
              }
            />
            <Label>Supports Negative Prompts</Label>
          </div>

          {/* Default Parameters */}
          <div className="space-y-2">
            <Label htmlFor="defaultParameters">Default Parameters (JSON)</Label>
            <Textarea
              id="defaultParameters"
              value={formData.defaultParameters}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, defaultParameters: e.target.value }))
              }
              placeholder='{"stylize": 250, "chaos": 25}'
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <Label htmlFor="tips">User Tips</Label>
            <Textarea
              id="tips"
              value={formData.tips}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, tips: e.target.value }))
              }
              placeholder="Brief tips for users about this platform..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Create Platform' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
