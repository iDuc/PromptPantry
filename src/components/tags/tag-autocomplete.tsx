'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface TagWithCount {
  name: string;
  count: number;
}

interface TagAutocompleteProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagAutocomplete({
  value,
  onChange,
  placeholder = 'Add tags...',
  className,
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<TagWithCount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch for suggestions
  const fetchSuggestions = useCallback(async (search: string) => {
    if (!search.trim()) {
      // Fetch popular tags when input is empty
      setIsLoading(true);
      try {
        const response = await fetch('/api/tags?limit=10');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.tags.filter((t: TagWithCount) => !value.includes(t.name)));
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tags?search=${encodeURIComponent(search)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.tags.filter((t: TagWithCount) => !value.includes(t.name)));
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, [value]);

  // Debounce the fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        fetchSuggestions(inputValue);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen, fetchSuggestions]);

  // Fetch initial suggestions when opening
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      fetchSuggestions('');
    }
  }, [isOpen, suggestions.length, fetchSuggestions]);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !value.includes(normalizedTag)) {
      onChange([...value, normalizedTag]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showCreateOption = inputValue.trim() && !suggestions.some(
    (s) => s.name.toLowerCase() === inputValue.toLowerCase()
  ) && !value.includes(inputValue.toLowerCase().trim());

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Input */}
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : 'Add more...'}
        className="w-full"
      />

      {/* Suggestions dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <Command className="rounded-lg border-0">
            <CommandList>
              {isLoading ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Loading...
                </div>
              ) : (
                <>
                  {suggestions.length === 0 && !showCreateOption && (
                    <CommandEmpty>No tags found.</CommandEmpty>
                  )}

                  {showCreateOption && (
                    <CommandGroup heading="Create new">
                      <CommandItem
                        onSelect={() => addTag(inputValue)}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create &quot;{inputValue.trim()}&quot;
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {suggestions.length > 0 && (
                    <CommandGroup heading={inputValue ? 'Suggestions' : 'Popular tags'}>
                      {suggestions.map((tag) => (
                        <CommandItem
                          key={tag.name}
                          onSelect={() => addTag(tag.name)}
                          className="cursor-pointer flex items-center justify-between"
                        >
                          <span>{tag.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {tag.count} prompt{tag.count !== 1 ? 's' : ''}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
