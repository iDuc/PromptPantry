'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Platform {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: 'image' | 'video';
  supportsNegativePrompt: boolean;
  defaultParameters: Record<string, unknown>;
  tips: string | null;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

interface UsePlatformsOptions {
  type?: 'image' | 'video';
  activeOnly?: boolean;
}

interface UsePlatformsReturn {
  platforms: Platform[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getPlatform: (slug: string) => Platform | undefined;
  imagePlatforms: Platform[];
  videoPlatforms: Platform[];
}

// Simple cache for platforms
let platformsCache: Platform[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

export function usePlatforms(options: UsePlatformsOptions = {}): UsePlatformsReturn {
  const { type, activeOnly = true } = options;
  const [platforms, setPlatforms] = useState<Platform[]>(platformsCache || []);
  const [isLoading, setIsLoading] = useState(!platformsCache);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlatforms = useCallback(async () => {
    // Check cache validity
    const now = Date.now();
    if (platformsCache && (now - cacheTimestamp) < CACHE_TTL) {
      setPlatforms(platformsCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (!activeOnly) params.set('active', 'false');

      const response = await fetch(`/api/platforms?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch platforms');
      }

      const data: Platform[] = await response.json();

      // Update cache
      platformsCache = data;
      cacheTimestamp = Date.now();

      setPlatforms(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  // Filter platforms based on type if specified
  const filteredPlatforms = type
    ? platforms.filter(p => p.type === type)
    : platforms;

  // Get platform by slug
  const getPlatform = useCallback((slug: string) => {
    return platforms.find(p => p.slug === slug);
  }, [platforms]);

  // Split by type
  const imagePlatforms = platforms.filter(p => p.type === 'image');
  const videoPlatforms = platforms.filter(p => p.type === 'video');

  return {
    platforms: filteredPlatforms,
    isLoading,
    error,
    refetch: fetchPlatforms,
    getPlatform,
    imagePlatforms,
    videoPlatforms,
  };
}

// Utility function to invalidate the cache
export function invalidatePlatformsCache() {
  platformsCache = null;
  cacheTimestamp = 0;
}

// Utility function to update a single platform in cache
export function updatePlatformInCache(updatedPlatform: Platform) {
  if (platformsCache) {
    platformsCache = platformsCache.map(p =>
      p.id === updatedPlatform.id ? updatedPlatform : p
    );
  }
}
