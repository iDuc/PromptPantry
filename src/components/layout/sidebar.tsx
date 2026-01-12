'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Palette,
  Sun,
  Camera,
  Sparkles,
  Box,
  User,
  Mountain,
  Shapes,
  Home,
  Plus,
  Star,
  Archive,
  Settings,
  FolderOpen,
  Image,
  Video,
  Wand2,
  Brush,
  Layers,
  Grid,
  Heart,
  Tag,
  MessageSquareText,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PromptGeneratorModal } from '@/components/generator';

// Map icon names to Lucide components - must match settings page iconMap
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

interface SidebarProps {
  categories: Category[];
  tags?: TagWithCount[];
}

const mainNav = [
  { href: '/', label: 'All Prompts', icon: Home },
  { href: '/favorites', label: 'Favorites', icon: Star },
  { href: '/archive', label: 'Archive', icon: Archive },
];

export function Sidebar({ categories, tags = [] }: SidebarProps) {
  const pathname = usePathname();
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden md:flex h-screen w-64 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <Link href="/" className="flex h-16 items-center gap-2 px-6 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">PromptPantry</span>
        </Link>

        {/* Action Buttons */}
        <div className="px-4 pt-2 pb-4 space-y-2">
          <Button asChild className="w-full gap-2">
            <Link href="/prompts/new">
              <Plus className="h-4 w-4" />
              New Prompt
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowGenerator(true)}
          >
            <MessageSquareText className="h-4 w-4" />
            Generate Prompt
          </Button>
        </div>

      <div className="flex-1 min-h-0">
      <ScrollArea className="h-full px-4">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
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
            <Link
              href="/settings#categories"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
          {categories.map((category) => {
            const Icon = category.icon ? iconMap[category.icon] : FolderOpen;
            const isActive = pathname === `/category/${category.slug}`;
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon
                  className="h-4 w-4"
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
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  See all
                </Link>
              </div>
              {tags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/?tags=${encodeURIComponent(tag.name)}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4" />
                    <span className="truncate">{tag.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{tag.count}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </ScrollArea>
      </div>

        {/* Bottom section */}
        <div className="border-t border-border p-4">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/settings'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Prompt Generator Modal */}
      <PromptGeneratorModal
        open={showGenerator}
        onOpenChange={setShowGenerator}
      />
    </>
  );
}
