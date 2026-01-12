'use client';

import { motion } from 'framer-motion';
import { PromptCard } from './prompt-card';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Wand2, Heart, Archive, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { staggerContainer, fadeInUp, STAGGER_LIMIT } from '@/lib/motion';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface Variant {
  id: string;
  platform: string;
  optimized_prompt: string;
  result_image_url: string | null;
  result_thumbnail_url: string | null;
  rating: number | null;
  is_best: boolean;
}

interface Prompt {
  id: string;
  title: string;
  base_prompt: string;
  category: Category | null;
  tags: string[];
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  variants: Variant[];
}

type EmptyVariant = 'default' | 'favorites' | 'archive';

interface PromptGridProps {
  prompts: Prompt[];
  emptyVariant?: EmptyVariant;
}

interface EmptyStateConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: { label: string; href: string; icon: React.ReactNode };
  secondaryAction?: { label: string; href: string; icon: React.ReactNode };
  glowColor: string;
  bgGradient: string;
}

const emptyStateConfigs: Record<EmptyVariant, EmptyStateConfig> = {
  default: {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    title: 'Your creative space awaits',
    description: 'Start building your prompt library. Save, organize, and optimize your AI generation prompts.',
    primaryAction: { label: 'Create First Prompt', href: '/prompts/new', icon: <Plus className="mr-2 h-4 w-4" /> },
    secondaryAction: { label: 'Generate with AI', href: '/prompts/new', icon: <Wand2 className="mr-2 h-4 w-4" /> },
    glowColor: 'bg-primary/20',
    bgGradient: 'from-primary/20 to-accent/10',
  },
  favorites: {
    icon: <Heart className="h-10 w-10 text-accent" />,
    title: 'No favorites yet',
    description: 'Mark prompts as favorites to access them quickly here. Click the heart icon on any prompt card.',
    primaryAction: { label: 'Browse Prompts', href: '/', icon: <ArrowRight className="mr-2 h-4 w-4" /> },
    glowColor: 'bg-accent/20',
    bgGradient: 'from-accent/20 to-accent/5',
  },
  archive: {
    icon: <Archive className="h-10 w-10 text-muted-foreground" />,
    title: 'Nothing archived yet',
    description: 'Archive prompts you no longer actively use but want to keep for reference.',
    primaryAction: { label: 'Browse Prompts', href: '/', icon: <ArrowRight className="mr-2 h-4 w-4" /> },
    glowColor: 'bg-muted/30',
    bgGradient: 'from-muted/30 to-muted/10',
  },
};

export function PromptGrid({ prompts, emptyVariant = 'default' }: PromptGridProps) {
  if (prompts.length === 0) {
    const config = emptyStateConfigs[emptyVariant];

    return (
      <motion.div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Animated illustration */}
        <div className="relative mb-8">
          {/* Background glow */}
          <motion.div
            className={`absolute inset-0 rounded-full ${config.glowColor} blur-3xl`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Icon container */}
          <motion.div
            className={`relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border/50 bg-gradient-to-br ${config.bgGradient}`}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.icon}
          </motion.div>
        </div>

        <h3 className="text-2xl font-display font-semibold">{config.title}</h3>
        <p className="mt-2 max-w-sm text-center text-muted-foreground">
          {config.description}
        </p>

        {(config.primaryAction || config.secondaryAction) && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {config.primaryAction && (
              <Button asChild>
                <Link href={config.primaryAction.href}>
                  {config.primaryAction.icon}
                  {config.primaryAction.label}
                </Link>
              </Button>
            )}
            {config.secondaryAction && (
              <Button variant="outline" asChild>
                <Link href={config.secondaryAction.href}>
                  {config.secondaryAction.icon}
                  {config.secondaryAction.label}
                </Link>
              </Button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {prompts.map((prompt, index) => (
        <motion.div
          key={prompt.id}
          variants={index < STAGGER_LIMIT ? fadeInUp : undefined}
          initial={index < STAGGER_LIMIT ? 'hidden' : false}
          animate="visible"
        >
          <PromptCard prompt={prompt} />
        </motion.div>
      ))}
    </motion.div>
  );
}
