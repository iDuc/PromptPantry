# CLAUDE.md - PromptPantry Development Instructions

## Project Summary

Build **PromptPantry**: A visually stunning prompt management app for AI image/video generation (Midjourney, Veo, Nano Banana Pro, etc.).

**Primary user**: Designer/vormgever who works daily with AI generation tools
**Key requirement**: Beautiful, inspiring UI - think Figma meets Pinterest

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (Postgres)
- **ORM**: Drizzle
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (for result images)
- **AI**: Google Gemini API (gemini-2.0-flash)
- **Package Manager**: pnpm

## Quick Start Commands

```bash
# Create project
pnpm create next-app@latest promptpantry --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd promptpantry

# Install dependencies
pnpm add drizzle-orm @supabase/supabase-js @supabase/ssr @google/generative-ai
pnpm add @tanstack/react-query react-hook-form @hookform/resolvers zod
pnpm add next-themes framer-motion react-masonry-css lucide-react
pnpm add -D drizzle-kit

# shadcn/ui setup
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input textarea select dialog dropdown-menu command badge skeleton toast tabs tooltip avatar separator scroll-area

# Create env file
cp .env.local.example .env.local
```

## Design System

### Colors (Dark mode default)
```css
--background: #0F0F10
--card: #18181B
--primary: #818CF8 (Indigo)
--accent: #FBBF24 (Amber - ratings/favorites)
--muted: #94A3B8
--border: #27272A
```

### Typography
- Font: Inter (headings 600-700, body 400-500)
- Monospace: JetBrains Mono (for prompts)

### UI Principles
1. Card-based layout with thumbnails
2. Masonry grid (Pinterest-style)
3. Generous whitespace
4. Smooth animations (framer-motion)
5. Dark mode default, light mode available

## Database Schema (Drizzle)

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'), // Lucide icon name
  color: text('color'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

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

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  template: text('template').notNull(),
  variables: jsonb('variables').default([]),
  categoryId: uuid('category_id').references(() => categories.id),
  useCount: integer('use_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## Core Features (MVP)

### 1. Prompts Library (`/prompts`)
- Masonry grid with visual cards
- Filter by: category, platform, tags, rating, favorites
- Search (fuzzy on title, prompt, tags)
- Sort: recent, rating, most used
- One-click copy (increment use_count)

### 2. Prompt Detail (`/prompts/[id]`)
- Hero image (best result)
- Base prompt (editable)
- Variants grid per platform
- Per variant: prompt, params, negative prompt, result image, rating, notes
- AI Optimize button

### 3. Create/Edit Prompt (`/prompts/new`, `/prompts/[id]/edit`)
- Base prompt input
- Category selector
- Tag input (autocomplete + create)
- AI optimizer integration
- Add variants per platform

### 4. AI Optimizer (Modal)
- Input: user's basic idea
- Select target platforms
- Gemini generates optimized prompts per platform
- Review, edit, save as variants

### 5. Import (`/import`)
- JSON import (Midjourney archive format)
- CSV import
- Field mapping UI

## API Routes Structure

```
/api/prompts          GET (list), POST (create)
/api/prompts/[id]     GET, PATCH, DELETE
/api/prompts/[id]/variants     POST
/api/prompts/[id]/variants/[vid]   PATCH, DELETE
/api/prompts/[id]/copy   POST (increment use)
/api/categories       GET, POST
/api/categories/[id]  PATCH, DELETE
/api/optimize         POST (Gemini)
/api/import           POST
/api/upload           POST (Supabase Storage)
```

## Gemini Optimizer Prompt

```typescript
const OPTIMIZER_PROMPT = `Je bent een expert prompt engineer voor AI image/video generatie.

Optimaliseer de volgende prompt voor de geselecteerde platforms.
Houd rekening met platform-specifieke syntax en best practices.

INPUT: {userPrompt}
PLATFORMS: {platforms}

Geef voor elk platform JSON:
{
  "platforms": {
    "midjourney": {
      "prompt": "geoptimaliseerde prompt",
      "parameters": "--ar 16:9 --v 6.1 --style raw",
      "negative_prompt": null
    },
    "veo": {
      "prompt": "geoptimaliseerde prompt met camera/motion hints",
      "parameters": {"duration": "5s", "aspect_ratio": "16:9"},
      "negative_prompt": null
    },
    "nano_banana_pro": {
      "prompt": "geoptimaliseerde prompt",
      "parameters": {},
      "negative_prompt": "blur, low quality"
    }
  }
}`;
```

## Key Components to Build

1. `PromptCard` - Visual card with thumbnail, title, tags, rating
2. `PromptGrid` - Masonry layout with filters
3. `VariantCard` - Platform variant with copy button
4. `OptimizerModal` - AI optimization flow
5. `RatingStars` - Clickable 1-5 rating
6. `TagInput` - Autocomplete multi-select
7. `ImageUpload` - Drag & drop with preview
8. `CopyButton` - One-click copy with toast
9. `CommandPalette` - ⌘K search
10. `Sidebar` - Navigation with categories

## Default Categories (Seed)

```typescript
const DEFAULT_CATEGORIES = [
  { name: 'Styles', slug: 'styles', icon: 'Palette', color: '#8B5CF6' },
  { name: 'Lighting', slug: 'lighting', icon: 'Sun', color: '#F59E0B' },
  { name: 'Camera', slug: 'camera', icon: 'Camera', color: '#3B82F6' },
  { name: 'Themes', slug: 'themes', icon: 'Sparkles', color: '#EC4899' },
  { name: 'Materials', slug: 'materials', icon: 'Box', color: '#10B981' },
  { name: 'Characters', slug: 'characters', icon: 'User', color: '#6366F1' },
  { name: 'Environments', slug: 'environments', icon: 'Mountain', color: '#14B8A6' },
  { name: 'Abstract', slug: 'abstract', icon: 'Shapes', color: '#F43F5E' },
];
```

## Platforms Config

```typescript
const PLATFORMS = [
  { id: 'midjourney', name: 'Midjourney', icon: '🎨', color: '#5865F2' },
  { id: 'veo', name: 'Google Veo', icon: '🎬', color: '#4285F4' },
  { id: 'nano_banana_pro', name: 'Nano Banana Pro', icon: '🍌', color: '#FBBC04' },
  { id: 'dalle', name: 'DALL-E', icon: '🖼️', color: '#10A37F' },
  { id: 'stable_diffusion', name: 'Stable Diffusion', icon: '🌀', color: '#A855F7' },
  { id: 'flux', name: 'Flux', icon: '⚡', color: '#000000' },
  { id: 'ideogram', name: 'Ideogram', icon: '✨', color: '#FF6B6B' },
];
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Production: https://promptpantry.nl
```

## Development Order

1. **Setup**: Project, dependencies, Supabase project
2. **Database**: Drizzle schema, migrations, seed data
3. **Layout**: Sidebar, header, theme toggle, base styling
4. **Categories**: CRUD, settings page
5. **Prompts CRUD**: Create, read, update, delete
6. **Prompt Cards**: Visual cards, masonry grid
7. **Filtering**: Category, tags, search, sort
8. **Variants**: Platform variants, add/edit
9. **Images**: Upload, thumbnails, display
10. **Rating & Favorites**: Star rating, favorite toggle
11. **Copy**: One-click copy with tracking
12. **AI Optimizer**: Gemini integration, modal flow
13. **Import**: JSON/CSV import
14. **Polish**: Animations, mobile responsive, command palette

## Domain & Deployment

- **Domain**: promptpantry.nl
- **Hosting**: Vercel (connect domain in Vercel dashboard)

## Reference Links

- PRD: See `promptpantry-prd.md` for full specification
- shadcn/ui: https://ui.shadcn.com
- Drizzle: https://orm.drizzle.team
- Supabase: https://supabase.com/docs
- Gemini: https://ai.google.dev/docs
