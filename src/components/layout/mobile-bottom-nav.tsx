'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Star, Plus, Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

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

        // Central FAB button
        if (item.isFab) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Position above the bar
                'absolute -top-6 left-1/2 -translate-x-1/2',
                // Size and shape
                'h-14 w-14 rounded-full',
                // Colors
                'bg-primary text-primary-foreground',
                // Shadow and ring for floating effect
                'shadow-xl shadow-primary/30',
                'ring-4 ring-background',
                // Flexbox centering
                'flex items-center justify-center',
                // Transitions
                'transition-all duration-200',
                // Press state
                fabPressed ? 'scale-95' : 'scale-100',
                // Hide on scroll down
                hideFab && 'translate-y-20 opacity-0 pointer-events-none'
              )}
              onTouchStart={() => setFabPressed(true)}
              onTouchEnd={() => setFabPressed(false)}
              onMouseDown={() => setFabPressed(true)}
              onMouseUp={() => setFabPressed(false)}
              onMouseLeave={() => setFabPressed(false)}
            >
              <Icon className="h-6 w-6" />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        }

        // Action buttons (Search, Menu)
        if (item.isAction) {
          return (
            <button
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
                'transition-colors',
                // Active state
                'active:text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        }

        // Regular nav items
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              // Layout
              'flex flex-col items-center justify-center gap-0.5',
              // Touch target
              'min-h-[44px] min-w-[44px]',
              // Colors
              isActive ? 'text-primary' : 'text-muted-foreground',
              // Transitions
              'transition-colors',
              // Active state
              'active:text-primary'
            )}
          >
            <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
