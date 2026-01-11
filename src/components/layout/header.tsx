'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenu } from './user-menu';

// Search input component with its own state, reset when URL changes
function SearchInput({
  initialValue,
  onSearch
}: {
  initialValue: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== initialValue) {
        onSearch(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, initialValue, onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search prompts..."
        className="pl-9 pr-9"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Get page title based on pathname
function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Prompts';
  if (pathname === '/favorites') return 'Favorites';
  if (pathname === '/archive') return 'Archive';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/import') return 'Import';
  if (pathname.startsWith('/prompts/new')) return 'New Prompt';
  if (pathname.startsWith('/prompts/')) return 'Prompt';
  if (pathname.startsWith('/category/')) {
    // Extract category name from URL
    const slug = pathname.split('/category/')[1];
    return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Category';
  }
  return 'PromptPantry';
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const pageTitle = getPageTitle(pathname);

  // Update URL when search value changes
  const handleSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  }, [router, searchParams]);

  return (
    <header className="sticky top-0 z-20 flex h-14 md:h-16 items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-sm">
      {/* Mobile: Page title */}
      <h1 className="text-lg font-semibold md:hidden">{pageTitle}</h1>

      {/* Desktop: Search - key resets component when URL search changes externally */}
      <div className="hidden md:flex flex-1 items-center gap-4">
        <SearchInput
          key={urlSearch}
          initialValue={urlSearch}
          onSearch={handleSearch}
        />
      </div>

      {/* Actions - larger touch targets on mobile */}
      <div className="flex items-center gap-1 md:gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-11 w-11 md:h-9 md:w-9"
              >
                <Sun className="h-5 w-5 md:h-4 md:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 md:h-4 md:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <UserMenu />
      </div>
    </header>
  );
}
