'use client';

import { Variants, Transition } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

// ============================================================================
// TRANSITIONS
// ============================================================================

/**
 * Spring transition - snappy and responsive
 * Good for: hover effects, button presses, quick feedback
 */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

/**
 * Smooth transition - Apple-style easing
 * Good for: page content, modals, larger movements
 */
export const smoothTransition: Transition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.4,
};

/**
 * Quick transition - fast and subtle
 * Good for: micro-interactions, icon changes
 */
export const quickTransition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2,
};

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Fade in with upward movement
 * Good for: page content, cards appearing
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition
  },
};

/**
 * Simple fade
 * Good for: overlays, subtle appearances
 */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: quickTransition
  },
  exit: {
    opacity: 0,
    transition: quickTransition
  },
};

/**
 * Stagger container for grid animations
 * Wraps children that use fadeInUp or similar variants
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04, // 40ms between each child
      delayChildren: 0.1,   // Initial delay before first child
    },
  },
};

/**
 * Card hover effect - lift and scale
 * Good for: interactive cards, clickable items
 */
export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: springTransition
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

/**
 * Scale on press - tactile feedback
 * Good for: buttons, interactive elements
 */
export const scaleOnPress: Variants = {
  rest: { scale: 1 },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },
};

/**
 * Modal/dialog animation
 * Good for: dialogs, bottom sheets, overlays
 */
export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  },
};

/**
 * Slide in from right
 * Good for: sidebars, panels
 */
export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: smoothTransition
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

/**
 * Slide in from bottom
 * Good for: mobile sheets, toasts
 */
export const slideInBottom: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springTransition
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

/**
 * Heart/favorite animation - bounce effect
 * Good for: like buttons, favorites
 */
export const heartBounce: Variants = {
  rest: { scale: 1 },
  active: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.3 }
  },
};

/**
 * Pulse animation for FAB
 * Good for: floating action buttons, attention grabbers
 */
export const pulse: Variants = {
  rest: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for respecting user's motion preferences
 * Returns safe animation props that disable motion when user prefers reduced motion
 */
export function useMotionSafe() {
  const prefersReducedMotion = useReducedMotion();

  return {
    // Use these to conditionally disable animations
    shouldAnimate: !prefersReducedMotion,
    // Override animation to static if reduced motion is preferred
    animate: prefersReducedMotion ? false : undefined,
    // Set transition duration to 0 for instant changes
    transition: prefersReducedMotion ? { duration: 0 } : undefined,
    // Helper for conditional variants
    variants: (normalVariants: Variants): Variants | undefined =>
      prefersReducedMotion ? undefined : normalVariants,
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Limit for stagger animations to prevent performance issues
 * Cards beyond this limit will appear instantly
 */
export const STAGGER_LIMIT = 20;
