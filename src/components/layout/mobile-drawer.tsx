'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer } from 'vaul';
import {
  Home,
  Star,
  Archive,
  Settings,
  FolderOpen,
  FileDown,
  Palette,
  Sun,
  Camera,
  Sparkles,
  Box,
  User,
  Mountain,
  Shapes,
  Image,
  Video,
  Wand2,
  Brush,
  Layers,
  Grid,
  Heart,
  Tag,
  Plus,
  MessageSquareText,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Note: Using native scrolling instead of ScrollArea for better iOS compatibility
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PromptGeneratorModal } from '@/components/generator';

// Map icon names to Lucide components - must match sidebar.tsx
const iconMap: Record<string, LucideIcon> = {
  Palette,
  Sun,
  Camera,
  Sparkles,
  Box,
  User,
  Mountain,
  Shapes,
  Image,
  Video,
  Wand2,
  Brush,
  Layers,
  Grid,
  Star,
  Heart,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface TagWithCount {
  name: string;
  count: number;
}

interface MobileDrawerProps {
  categories: Category[];
  tags?: TagWithCount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mainNav = [
  { href: '/', label: 'All Prompts', icon: Home },
  { href: '/favorites', label: 'Favorites', icon: Star },
  { href: '/archive', label: 'Archive', icon: Archive },
];

const bottomNav = [
  { href: '/import', label: 'Import', icon: FileDown },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileDrawer({
  categories,
  tags = [],
  open,
  onOpenChange,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const [showGenerator, setShowGenerator] = useState(false);

  const handleNavClick = () => {
    onOpenChange(false);
  };

  const handleGeneratorClick = () => {
    onOpenChange(false);
    setShowGenerator(true);
  };

  return (
    <>
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="left">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            'fixed left-0 top-0 bottom-0 z-50',
            'w-[280px] max-w-[85vw]',
            'flex flex-col',
            'bg-card',
            'border-r border-border',
            'outline-none'
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center gap-2 px-6 border-b border-border shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">PromptPantry</span>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-4 space-y-2 shrink-0 border-b border-border">
            <Button asChild className="w-full gap-2 min-h-[44px]">
              <Link href="/prompts/new" onClick={handleNavClick}>
                <Plus className="h-4 w-4" />
                New Prompt
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 min-h-[44px]"
              onClick={handleGeneratorClick}
            >
              <MessageSquareText className="h-4 w-4" />
              Generate Prompt
            </Button>
          </div>

          {/* Navigation - using native scroll for iOS compatibility */}
          <div
            className="flex-1 px-4 py-4 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Main Navigation */}
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      // Touch-friendly height
                      'min-h-[44px]',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      // Active press state
                      'active:bg-primary/20'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-4" />

            {/* Categories */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </span>
              </div>
              {categories.map((category) => {
                const Icon = category.icon ? iconMap[category.icon] : FolderOpen;
                const isActive = pathname === `/category/${category.slug}`;
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      // Touch-friendly height
                      'min-h-[44px]',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      // Active press state
                      'active:bg-primary/20'
                    )}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: category.color || undefined }}
                    />
                    {category.name}
                  </Link>
                );
              })}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Popular Tags
                    </span>
                    <Link
                      href="/tags"
                      onClick={handleNavClick}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      See all
                    </Link>
                  </div>
                  {tags.map((tag) => (
                    <Link
                      key={tag.name}
                      href={`/?tags=${encodeURIComponent(tag.name)}`}
                      onClick={handleNavClick}
                      className={cn(
                        'flex items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors',
                        'min-h-[44px]',
                        'text-muted-foreground hover:bg-muted hover:text-foreground',
                        'active:bg-primary/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="h-5 w-5" />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{tag.count}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bottom section */}
          <div className="border-t border-border p-4 space-y-1">
            {bottomNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    // Touch-friendly height
                    'min-h-[44px]',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    // Active press state
                    'active:bg-primary/20'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>

    {/* Prompt Generator Modal */}
    <PromptGeneratorModal
      open={showGenerator}
      onOpenChange={setShowGenerator}
    />
    </>
  );
}
