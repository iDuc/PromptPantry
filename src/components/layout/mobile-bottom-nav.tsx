'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Star, Plus, Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { springTransition } from '@/lib/motion';

interface MobileBottomNavProps {
  className?: string;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/favorites', icon: Star, label: 'Favorites' },
  { href: '/prompts/new', icon: Plus, label: 'New', isFab: true },
  { href: '#search', icon: Search, label: 'Search', isAction: true },
  { href: '#menu', icon: Menu, label: 'Menu', isAction: true },
];

export function MobileBottomNav({
  className,
  onSearchClick,
  onMenuClick,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection({ threshold: 10 });
  const [fabPressed, setFabPressed] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  // Track if user is at top of page
  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY <= 10);
    };
    handleScroll(); // Check initial position
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show FAB when at top OR when scrolling up
  const hideFab = !isAtTop && scrollDirection === 'down';

  return (
    <nav
      className={cn(
        // Floating bar container
        'fixed bottom-4 left-4 right-4 z-50',
        'flex items-center justify-around',
        'h-16 rounded-2xl',
        'bg-card/90 backdrop-blur-xl',
        'border border-border/50',
        'shadow-lg shadow-black/10',
        // Safe area padding
        'pb-safe',
        className
      )}
    >
      {navItems.map((item) => {
        const isActive = !item.isAction && pathname === item.href;
        const Icon = item.icon;

        // Central FAB button with pulse animation
        if (item.isFab) {
          return (
            <motion.div
              key={item.href}
              className="absolute -top-6 left-1/2"
              initial={{ scale: 0.8, opacity: 0, x: '-50%' }}
              animate={{
                scale: hideFab ? 0.8 : 1,
                opacity: hideFab ? 0 : 1,
                y: hideFab ? 20 : 0,
                x: '-50%',
              }}
              transition={springTransition}
            >
              <Link href={item.href} className="relative block">
                <motion.div
                  className={cn(
                    'h-14 w-14 rounded-full',
                    'bg-primary text-primary-foreground',
                    'shadow-xl shadow-primary/30',
                    'ring-4 ring-background',
                    'flex items-center justify-center'
                  )}
                  whileTap={{ scale: 0.9 }}
                  transition={springTransition}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>

                {/* Pulse ring animation */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary"
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </Link>
              <span className="sr-only">{item.label}</span>
            </motion.div>
          );
        }

        // Action buttons (Search, Menu)
        if (item.isAction) {
          return (
            <motion.button
              key={item.href}
              onClick={() => {
                if (item.label === 'Search') {
                  onSearchClick?.();
                } else if (item.label === 'Menu') {
                  onMenuClick?.();
                }
              }}
              className={cn(
                // Layout
                'flex flex-col items-center justify-center gap-0.5',
                // Touch target
                'min-h-[44px] min-w-[44px]',
                // Colors
                'text-muted-foreground',
                // Transitions
                'transition-colors'
              )}
              whileTap={{ scale: 0.9 }}
              transition={springTransition}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          );
        }

        // Regular nav items
        return (
          <Link key={item.href} href={item.href} className="relative">
            <motion.div
              className={cn(
                // Layout
                'flex flex-col items-center justify-center gap-0.5',
                // Touch target
                'min-h-[44px] min-w-[44px]',
                // Colors
                isActive ? 'text-primary' : 'text-muted-foreground',
                // Transitions
                'transition-colors'
              )}
              whileTap={{ scale: 0.9 }}
              transition={springTransition}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{item.label}</span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary"
                  layoutId="activeNavIndicator"
                  transition={springTransition}
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
