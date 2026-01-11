'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Pencil, Trash2, Play, RotateCcw,
  Check, X, ChevronDown, ChevronUp, Loader2, Image, Video,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePlatforms, invalidatePlatformsCache, type Platform } from '@/hooks/use-platforms';
import { PlatformFormDialog } from './platform-form-dialog';
import { PlatformTestDialog } from './platform-test-dialog';

// Sortable platform item component
function SortablePlatformItem({
  platform,
  onEdit,
  onTest,
  onDelete,
  onToggle,
  onReset,
}: {
  platform: Platform;
  onEdit: (platform: Platform) => void;
  onTest: (platform: Platform) => void;
  onDelete: (platform: Platform) => void;
  onToggle: (platform: Platform, isActive: boolean) => void;
  onReset: (platform: Platform) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: platform.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between rounded-lg border p-3 bg-background',
        isDragging && 'opacity-50 shadow-lg',
        !platform.isActive && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-xl">{platform.icon || '?'}</span>
        <div className="flex flex-col">
          <span className="font-medium">{platform.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0"
              style={{ borderColor: platform.color || undefined }}
            >
              {platform.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Image className="h-3 w-3 mr-1" />}
              {platform.type}
            </Badge>
            {platform.isDefault && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Default
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={platform.isActive}
          onCheckedChange={(checked) => onToggle(platform, checked)}
          aria-label={`${platform.isActive ? 'Disable' : 'Enable'} ${platform.name}`}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onTest(platform)}
          title="Test optimization"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onEdit(platform)}
          title="Edit platform"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {platform.isDefault ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onReset(platform)}
            title="Reset to default"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(platform)}
            title="Delete platform"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function PlatformSettings() {
  const { platforms: initialPlatforms, isLoading, refetch } = usePlatforms({ activeOnly: false });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [showDisabled, setShowDisabled] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [testingPlatform, setTestingPlatform] = useState<Platform | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setPlatforms(initialPlatforms);
  }, [initialPlatforms]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activePlatforms = platforms.filter(p => p.isActive);
  const disabledPlatforms = platforms.filter(p => !p.isActive);

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = platforms.findIndex((p) => p.id === active.id);
      const newIndex = platforms.findIndex((p) => p.id === over.id);

      const newPlatforms = arrayMove(platforms, oldIndex, newIndex);
      setPlatforms(newPlatforms);

      try {
        const response = await fetch('/api/platforms/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderedIds: newPlatforms.map((p) => p.id),
          }),
        });

        if (!response.ok) throw new Error('Failed to save order');
        invalidatePlatformsCache();
        toast.success('Platform order updated');
      } catch {
        setPlatforms(platforms);
        toast.error('Failed to update order');
      }
    }
  };

  const handleToggle = async (platform: Platform, isActive: boolean) => {
    // Optimistic update
    setPlatforms(platforms.map(p =>
      p.id === platform.id ? { ...p, isActive } : p
    ));

    try {
      const response = await fetch(`/api/platforms/${platform.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to update platform');
      invalidatePlatformsCache();
      toast.success(`${platform.name} ${isActive ? 'enabled' : 'disabled'}`);
    } catch {
      // Revert on error
      setPlatforms(platforms);
      toast.error('Failed to update platform');
    }
  };

  const handleDelete = async (platform: Platform) => {
    if (platform.isDefault) {
      toast.error('Cannot delete default platforms. Disable it instead.');
      return;
    }

    try {
      const response = await fetch(`/api/platforms/${platform.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete platform');

      setPlatforms(platforms.filter(p => p.id !== platform.id));
      invalidatePlatformsCache();
      toast.success(`${platform.name} deleted`);
    } catch {
      toast.error('Failed to delete platform');
    }
  };

  const handleReset = async (platform: Platform) => {
    // For now, just show a toast. Full reset would require fetching from defaults
    toast.info('Reset functionality coming soon');
  };

  const handleEdit = (platform: Platform) => {
    setEditingPlatform(platform);
    setIsCreating(false);
    setIsFormOpen(true);
  };

  const handleTest = (platform: Platform) => {
    setTestingPlatform(platform);
    setIsTestOpen(true);
  };

  const handleCreate = () => {
    setEditingPlatform(null);
    setIsCreating(true);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPlatform(null);
    setIsCreating(false);
  };

  const handleFormSuccess = () => {
    invalidatePlatformsCache();
    refetch();
    handleFormClose();
  };

  if (isLoading) {
    return (
      <Card id="platforms">
        <CardHeader>
          <CardTitle>Platforms</CardTitle>
          <CardDescription>Configure AI generation platforms</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card id="platforms">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Platforms</CardTitle>
            <CardDescription>Configure AI generation platforms and optimization prompts</CardDescription>
          </div>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Platform
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag to reorder. Toggle to enable/disable platforms.
          </p>

          {/* Active Platforms */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activePlatforms.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {activePlatforms.map((platform) => (
                  <SortablePlatformItem
                    key={platform.id}
                    platform={platform}
                    onEdit={handleEdit}
                    onTest={handleTest}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onReset={handleReset}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Disabled Platforms Collapsible */}
          {disabledPlatforms.length > 0 && (
            <Collapsible open={showDisabled} onOpenChange={setShowDisabled}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                  {showDisabled ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Show disabled platforms ({disabledPlatforms.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {disabledPlatforms.map((platform) => (
                  <SortablePlatformItem
                    key={platform.id}
                    platform={platform}
                    onEdit={handleEdit}
                    onTest={handleTest}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onReset={handleReset}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <PlatformFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        platform={editingPlatform}
        isCreating={isCreating}
        onSuccess={handleFormSuccess}
      />

      {/* Test Dialog */}
      <PlatformTestDialog
        open={isTestOpen}
        onOpenChange={setIsTestOpen}
        platform={testingPlatform}
      />
    </>
  );
}
