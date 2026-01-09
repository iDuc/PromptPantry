'use client';

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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Palette,
  Sun,
  Camera,
  Sparkles,
  Box,
  User,
  Mountain,
  Shapes,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface SidebarProps {
  categories: Category[];
}

const mainNav = [
  { href: '/', label: 'All Prompts', icon: Home },
  { href: '/favorites', label: 'Favorites', icon: Star },
  { href: '/archive', label: 'Archive', icon: Archive },
];

export function Sidebar({ categories }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold">PromptPantry</span>
      </div>

      {/* New Prompt Button */}
      <div className="px-4 pb-4">
        <Button asChild className="w-full gap-2">
          <Link href="/prompts/new">
            <Plus className="h-4 w-4" />
            New Prompt
          </Link>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
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
              href="/settings/categories"
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
      </ScrollArea>

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
  );
}
