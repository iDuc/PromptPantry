'use client';

import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  /** Duration in ms before triggering long press (default: 500) */
  delay?: number;
  /** Callback when long press is triggered */
  onLongPress: () => void;
  /** Optional callback for regular click */
  onClick?: () => void;
}

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

/**
 * Hook for detecting long press gestures on mobile
 * Provides both touch and mouse event handlers
 */
export function useLongPress({
  delay = 500,
  onLongPress,
  onClick,
}: UseLongPressOptions): LongPressHandlers {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const start = useCallback(
    (x: number, y: number) => {
      isLongPress.current = false;
      startPos.current = { x, y };

      timeout.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress();
      }, delay);
    },
    [delay, onLongPress]
  );

  const clear = useCallback(
    (shouldTriggerClick: boolean = false) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }

      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
    },
    [start]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clear(true);
    },
    [clear]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long press if user moves finger too much
      const touch = e.touches[0];
      const moveThreshold = 10; // pixels
      const deltaX = Math.abs(touch.clientX - startPos.current.x);
      const deltaY = Math.abs(touch.clientY - startPos.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clear(false);
      }
    },
    [clear]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      start(e.clientX, e.clientY);
    },
    [start]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      clear(true);
    },
    [clear]
  );

  const onMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      clear(false);
    },
    [clear]
  );

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  };
}
