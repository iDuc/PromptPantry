'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
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
  Moon, Sun, Monitor, Plus, Pencil, Trash2, GripVertical,
  Palette, Camera, Sparkles, Box, User, Mountain, Shapes,
  Image, Video, Wand2, Brush, Layers, Grid, Star, Heart, FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PlatformSettings } from './platform-settings';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
}

interface SettingsPageProps {
  categories: Category[];
}

// Icon map for rendering
const iconMap: Record<string, LucideIcon> = {
  Palette, Sun, Camera, Sparkles, Box, User, Mountain, Shapes,
  Image, Video, Wand2, Brush, Layers, Grid, Star, Heart,
};

const ICON_OPTIONS = Object.keys(iconMap);

const COLOR_OPTIONS = [
  '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#6366F1', '#14B8A6', '#F43F5E',
  '#EF4444', '#84CC16', '#06B6D4', '#A855F7', '#F97316', '#0EA5E9', '#22C55E', '#E11D48'
];

// Sortable category item component
function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = category.icon ? iconMap[category.icon] : FolderOpen;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between rounded-lg border p-3 bg-background',
        isDragging && 'opacity-50 shadow-lg'
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
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${category.color || '#6366F1'}20` }}
        >
          <Icon
            className="h-4 w-4"
            style={{ color: category.color || '#6366F1' }}
          />
        </div>
        <span className="font-medium">{category.name}</span>
        <Badge variant="secondary" className="text-xs">
          {category.slug}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onEdit(category)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SettingsPage({ categories: initialCategories }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#8B5CF6', icon: 'Palette' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: '', color: '', icon: '' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

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

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      // Persist the new order to the database
      try {
        const response = await fetch('/api/categories/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderedIds: newCategories.map((c) => c.id),
          }),
        });

        if (!response.ok) throw new Error('Failed to save order');
        toast.success('Category order updated');
      } catch {
        // Revert on error
        setCategories(categories);
        toast.error('Failed to update order');
      }
    }
  };

  // Handle hash navigation for direct linking to categories section
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#categories') {
      const element = document.getElementById('categories');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const slug = newCategory.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategory.name,
          slug,
          color: newCategory.color,
          icon: newCategory.icon,
          sort_order: categories.length,
        }),
      });

      if (!response.ok) throw new Error('Failed to create category');

      const created = await response.json();
      setCategories([...categories, created]);
      setNewCategory({ name: '', color: '#8B5CF6', icon: 'Palette' });
      setIsAddDialogOpen(false);
      toast.success('Category created');
    } catch {
      toast.error('Failed to create category');
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      color: category.color || '#8B5CF6',
      icon: category.icon || 'Palette',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const slug = editForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          slug,
          color: editForm.color,
          icon: editForm.icon,
        }),
      });

      if (!response.ok) throw new Error('Failed to update category');

      const updated = await response.json();
      setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      toast.success('Category updated');
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;

    try {
      const response = await fetch(`/api/categories/${deleteCategory.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      setCategories(categories.filter((c) => c.id !== deleteCategory.id));
      setDeleteCategory(null);
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const IconSelector = ({
    selectedIcon,
    onSelect,
    selectedColor,
  }: {
    selectedIcon: string;
    onSelect: (icon: string) => void;
    selectedColor: string;
  }) => (
    <div className="grid grid-cols-8 gap-2">
      {ICON_OPTIONS.map((iconName) => {
        const Icon = iconMap[iconName];
        const isSelected = selectedIcon === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onSelect(iconName)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all hover:scale-110',
              isSelected ? 'border-foreground bg-muted' : 'border-transparent hover:bg-muted'
            )}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: isSelected ? selectedColor : undefined }}
            />
          </button>
        );
      })}
    </div>
  );

  const ColorSelector = ({
    selectedColor,
    onSelect,
  }: {
    selectedColor: string;
    onSelect: (color: string) => void;
  }) => (
    <div className="flex flex-wrap gap-2">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={cn(
            'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
            selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and categories</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how PromptPantry looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              <Sun className="mr-2 h-4 w-4" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card id="categories">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Organize your prompts into categories</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
                <DialogDescription>Create a new category for your prompts</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., Portraits"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>
                  <IconSelector
                    selectedIcon={newCategory.icon}
                    onSelect={(icon) => setNewCategory({ ...newCategory, icon })}
                    selectedColor={newCategory.color}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <ColorSelector
                    selectedColor={newCategory.color}
                    onSelect={(color) => setNewCategory({ ...newCategory, color })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCategory}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No categories yet. Create one to get started.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {categories.map((category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      onEdit={openEditDialog}
                      onDelete={setDeleteCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g., Portraits"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <IconSelector
                selectedIcon={editForm.icon}
                onSelect={(icon) => setEditForm({ ...editForm, icon })}
                selectedColor={editForm.color}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <ColorSelector
                selectedColor={editForm.color}
                onSelect={(color) => setEditForm({ ...editForm, color })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteCategory?.name}&quot;? This action cannot be undone.
              Prompts in this category will not be deleted, but will no longer have a category assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Platforms */}
      <PlatformSettings />

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>PromptPantry v1.0.0</p>
          <p className="mt-1">A prompt management app for AI image & video generation.</p>
        </CardContent>
      </Card>
    </div>
  );
}
