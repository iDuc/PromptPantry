'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Tag, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface TagWithCount {
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagWithCount[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'alpha'>('count');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('/api/tags?limit=200');
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags);
          setFilteredTags(data.tags);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTags();
  }, []);

  useEffect(() => {
    let result = [...tags];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(searchLower));
    }

    // Sort
    if (sortBy === 'alpha') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.count - a.count);
    }

    setFilteredTags(result);
  }, [tags, search, sortBy]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">
          Browse and filter prompts by tags
        </p>
      </div>

      {/* Search and sort controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort: {sortBy === 'count' ? 'Most Used' : 'Alphabetical'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('count')}>
              Most Used
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('alpha')}>
              Alphabetical
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No tags found</h3>
          <p className="text-muted-foreground mt-1">
            {search ? 'Try a different search term' : 'Add tags to your prompts to see them here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/?tags=${encodeURIComponent(tag.name)}`}
              className="group"
            >
              <div className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent hover:text-accent-foreground">
                <span className="truncate font-medium">{tag.name}</span>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {tag.count}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredTags.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredTags.length} of {tags.length} tags
        </p>
      )}
    </div>
  );
}
