'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Palette, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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

const ICON_OPTIONS = [
  'Palette', 'Sun', 'Camera', 'Sparkles', 'Box', 'User', 'Mountain', 'Shapes',
  'Image', 'Video', 'Wand2', 'Brush', 'Layers', 'Grid', 'Star', 'Heart'
];

const COLOR_OPTIONS = [
  '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#6366F1', '#14B8A6', '#F43F5E',
  '#EF4444', '#84CC16', '#06B6D4', '#A855F7', '#F97316', '#0EA5E9', '#22C55E', '#E11D48'
];

export function SettingsPage({ categories: initialCategories }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#8B5CF6', icon: 'Palette' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      setCategories(categories.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    }
  };

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
      <Card>
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
            <DialogContent>
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
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          newCategory.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
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
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color || '#6366F1' }}
                  />
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.slug}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
