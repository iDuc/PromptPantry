import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Categories for organizing prompts
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'), // Lucide icon name
  color: text('color'), // Hex color for category badge
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Main prompts table
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  basePrompt: text('base_prompt').notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  tags: text('tags').array().default([]),
  isFavorite: boolean('is_favorite').default(false),
  isArchived: boolean('is_archived').default(false),
  useCount: integer('use_count').default(0),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Platform-specific variants
export const promptVariants = pgTable('prompt_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // 'midjourney', 'veo', 'nano_banana_pro', etc.
  optimizedPrompt: text('optimized_prompt').notNull(),
  negativePrompt: text('negative_prompt'),
  parameters: jsonb('parameters').default({}),
  resultImageUrl: text('result_image_url'),
  resultThumbnailUrl: text('result_thumbnail_url'),
  rating: integer('rating'), // 1-5
  notes: text('notes'),
  isBest: boolean('is_best').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Templates for guided prompt building
export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  template: text('template').notNull(), // "A {subject} in {style} style"
  variables: jsonb('variables').default([]), // [{name: "subject", suggestions: [...]}]
  categoryId: uuid('category_id').references(() => categories.id),
  useCount: integer('use_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI optimization history
export const optimizationHistory = pgTable('optimization_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'cascade' }),
  originalInput: text('original_input').notNull(),
  optimizedOutput: jsonb('optimized_output').notNull(), // {midjourney: "...", veo: "...", ...}
  modelUsed: text('model_used').default('gemini-2.0-flash'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for use in application
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;

export type PromptVariant = typeof promptVariants.$inferSelect;
export type NewPromptVariant = typeof promptVariants.$inferInsert;

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type NewPromptTemplate = typeof promptTemplates.$inferInsert;

export type OptimizationHistory = typeof optimizationHistory.$inferSelect;
export type NewOptimizationHistory = typeof optimizationHistory.$inferInsert;
