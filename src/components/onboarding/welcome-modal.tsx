'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Sparkles, Copy, ArrowRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { springTransition, smoothTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'promptpantry-onboarded';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <Library className="h-8 w-8" />,
    title: 'Organize Your Prompts',
    description:
      'Build your personal library of AI prompts. Categorize, tag, and find your best prompts instantly.',
    color: 'from-primary/20 to-primary/5',
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: 'AI-Powered Optimization',
    description:
      'Let AI optimize your prompts for different platforms. Get the best results from Midjourney, Veo, and more.',
    color: 'from-accent/20 to-accent/5',
  },
  {
    icon: <Copy className="h-8 w-8" />,
    title: 'One-Click Copying',
    description:
      'Copy prompts instantly with a single click. Track your usage and see which prompts perform best.',
    color: 'from-chart-2/20 to-chart-2/5',
  },
];

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // SSR-safe: Only access localStorage after mounting
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration pattern
    setMounted(true);
    const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!hasOnboarded) {
      // Small delay to let the app render first
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={smoothTransition}
          >
            {/* Icon area with gradient background */}
            <div
              className={cn(
                'relative flex items-center justify-center py-12 bg-gradient-to-b',
                step.color
              )}
            >
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 bg-primary/10 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Icon container */}
              <motion.div
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-card shadow-lg"
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                transition={springTransition}
              >
                <span className="text-primary">{step.icon}</span>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display font-bold">
                  {step.title}
                </DialogTitle>
              </DialogHeader>

              <p className="mt-3 text-muted-foreground">{step.description}</p>

              {/* Step indicators */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      'h-1.5 rounded-full transition-colors',
                      index === currentStep
                        ? 'w-6 bg-primary'
                        : 'w-1.5 bg-muted'
                    )}
                    layout
                    transition={springTransition}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button onClick={handleNext} className="gap-2 min-w-[120px]">
                  {isLastStep ? (
                    "Get Started"
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Skip hint */}
              <p className="mt-4 text-xs text-muted-foreground">
                Press Esc to skip
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
