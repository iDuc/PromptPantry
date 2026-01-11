'use client';

import { useState, useEffect, useRef } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  /** Minimum scroll distance before detecting direction change (default: 10) */
  threshold?: number;
  /** Element to track scroll on (default: window) */
  element?: HTMLElement | null;
}

/**
 * Hook to detect scroll direction
 * Useful for hiding/showing elements on scroll (like FABs)
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}): ScrollDirection {
  const { threshold = 10, element = null } = options;
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const target = element || window;

    const getScrollY = () => {
      if (element) {
        return element.scrollTop;
      }
      return window.scrollY;
    };

    lastScrollY.current = getScrollY();

    const updateScrollDirection = () => {
      const scrollY = getScrollY();
      const diff = scrollY - lastScrollY.current;

      // Only update direction if scroll difference exceeds threshold
      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? 'down' : 'up');
        lastScrollY.current = scrollY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    target.addEventListener('scroll', onScroll, { passive: true });

    return () => target.removeEventListener('scroll', onScroll);
  }, [threshold, element]);

  return direction;
}

/**
 * Hook to detect if scrolled past a threshold
 */
export function useScrolledPast(threshold: number = 100): boolean {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPast(window.scrollY > threshold);
    };

    // Check initial position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolledPast;
}
