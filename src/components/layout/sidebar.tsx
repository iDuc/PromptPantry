'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { springTransition } from '@/lib/motion';

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
      <aside className="fixed left-0 top-0 z-30 hidden md:flex h-screen w-64 flex-col border-r border-border/50 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 backdrop-blur-sm">
        {/* Logo with hover glow */}
        <Link href="/" className="group flex h-16 items-center gap-3 px-6">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 8px 30px rgba(129, 140, 248, 0.4)',
            }}
            transition={springTransition}
          >
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="text-lg font-display font-semibold">PromptPantry</span>
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
              <motion.div
                key={item.href}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={springTransition}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Categories */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </span>
            <Link
              href="/settings#categories"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
          {categories.map((category) => {
            const Icon = category.icon ? iconMap[category.icon] : FolderOpen;
            const isActive = pathname === `/category/${category.slug}`;
            return (
              <motion.div
                key={category.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={springTransition}
              >
                <Link
                  href={`/category/${category.slug}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: category.color || undefined }}
                  />
                  {category.name}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular Tags
                </span>
                <Link
                  href="/tags"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  See all
                </Link>
              </div>
              {tags.map((tag) => (
                <motion.div
                  key={tag.name}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springTransition}
                >
                  <Link
                    href={`/?tags=${encodeURIComponent(tag.name)}`}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4" />
                      <span className="truncate">{tag.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{tag.count}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </ScrollArea>
      </div>

        {/* Bottom section */}
        <div className="border-t border-border/50 p-4">
          <motion.div
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={springTransition}
          >
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                pathname === '/settings'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </motion.div>
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
