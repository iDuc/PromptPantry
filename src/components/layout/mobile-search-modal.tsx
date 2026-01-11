'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from 'vaul';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MobileSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECENT_SEARCHES_KEY = 'promptpantry-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export function MobileSearchModal({
  open,
  onOpenChange,
}: MobileSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the drawer animation has started
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      saveRecentSearch(query.trim());
      onOpenChange(false);
      router.push(`/?search=${encodeURIComponent(query.trim())}`);
    },
    [router, onOpenChange, saveRecentSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchValue);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleClear = () => {
    setSearchValue('');
    inputRef.current?.focus();
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50',
            'flex flex-col',
            'h-[85vh]',
            'bg-background',
            'rounded-t-2xl',
            'outline-none'
          )}
        >
          {/* Handle */}
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="search"
                placeholder="Search prompts..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className={cn(
                  'h-12 pl-10 pr-10',
                  'text-base', // Larger text for mobile
                  'rounded-xl',
                  'border-2 border-muted focus:border-primary'
                )}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-safe">
            {/* Recent Searches */}
            {recentSearches.length > 0 && !searchValue && (
              <div className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(query)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 rounded-lg',
                        'min-h-[44px]',
                        'text-left text-sm',
                        'text-foreground',
                        'hover:bg-muted active:bg-muted',
                        'transition-colors'
                      )}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{query}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search suggestions based on input */}
            {searchValue && (
              <div className="py-4">
                <Button
                  variant="ghost"
                  onClick={() => handleSearch(searchValue)}
                  className={cn(
                    'w-full justify-start gap-3',
                    'min-h-[44px]',
                    'text-left'
                  )}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Search for <strong>&ldquo;{searchValue}&rdquo;</strong>
                  </span>
                </Button>
              </div>
            )}

            {/* Empty state */}
            {!searchValue && recentSearches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">
                  Search your prompts
                </h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Find prompts by title, content, or tags
                </p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
