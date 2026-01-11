'use client';

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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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

interface MobileDrawerProps {
  categories: Category[];
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
  open,
  onOpenChange,
}: MobileDrawerProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
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
          <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">PromptPantry</span>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
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
          </ScrollArea>

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
  );
}
