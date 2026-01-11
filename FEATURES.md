# PromptPantry - Feature Documentation

This document tracks all implemented features and architectural decisions for the PromptPantry application.

## Overview

PromptPantry is an AI prompt management application designed for designers working with AI image/video generation tools like Midjourney, Flux, DALL-E, etc.

**Live URL:** https://www.promptpantry.nl
**Repository:** https://github.com/iDuc/PromptPantry

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (email/password)
- **Storage:** Supabase Storage (for images)
- **AI:** Google Gemini API (gemini-2.0-flash)
- **Package Manager:** pnpm

---

## Authentication System

### Implementation (Jan 2026)
- **Pattern:** Layout-based authentication (Next.js 15 recommended approach)
- **Location:** `src/app/(main)/layout.tsx`
- **Note:** Middleware was deprecated in Next.js 16; auth moved to layouts

### Key Files
- `src/app/auth/login/page.tsx` - Login page with Suspense boundary
- `src/app/auth/signup/page.tsx` - Signup page with Suspense boundary
- `src/app/auth/callback/route.ts` - Email confirmation callback
- `src/components/layout/user-menu.tsx` - User avatar dropdown with logout
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/client.ts` - Client-side Supabase client

### Features
- Email/password authentication
- Session persistence via cookies (`@supabase/ssr`)
- Protected routes redirect to `/auth/login`
- User avatar with initials in header
- Sign out functionality

### Row Level Security (RLS)
All user data is isolated via RLS policies:
- `prompts` - Users can only see their own prompts
- `categories` - Users can only see their own categories
- `prompt_variants` - Users can only see variants of their prompts
- `prompt_templates` - Users can only see their own templates

---

## Database Schema

### Tables

#### `prompts`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Prompt title |
| base_prompt | text | The core prompt text |
| description | text | Optional context/notes |
| source_platform | text | Where prompt originated (midjourney, flux, etc.) |
| category_id | uuid | FK to categories |
| tags | text[] | Array of tags |
| is_favorite | boolean | Favorited status |
| is_archived | boolean | Archived status |
| use_count | integer | Copy counter |
| last_used_at | timestamp | Last copy time |
| user_id | uuid | FK to auth.users |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

#### `prompt_variants`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| prompt_id | uuid | FK to prompts |
| platform | text | Target platform (midjourney, flux, etc.) |
| optimized_prompt | text | Platform-optimized version |
| negative_prompt | text | What to avoid |
| parameters | jsonb | Platform-specific params |
| model_version | text | e.g., "v6.1", "flux-1.1-pro" |
| result_image_url | text | Generated result image |
| result_thumbnail_url | text | Thumbnail version |
| rating | integer | 1-5 star rating |
| notes | text | Variant notes |
| is_best | boolean | Best variant flag |
| user_id | uuid | FK to auth.users |

#### `categories`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Category name |
| slug | text | URL-friendly slug |
| icon | text | Lucide icon name |
| color | text | Hex color code |
| sort_order | integer | Display order |
| user_id | uuid | FK to auth.users |

---

## Core Features

### 1. Prompt Management

#### Creating Prompts
- **Location:** `src/app/(main)/prompts/new/page.tsx`
- **Form:** `src/components/prompts/prompt-form.tsx`

**Features:**
- Title input
- Source Platform selector (optional) - indicate where prompt came from
- Base Prompt textarea
- Description field (optional)
- Category selector
- Tag input with autocomplete

#### Midjourney Parameter Parser
- **Location:** `src/lib/parsers/midjourney.ts`
- **Auto-detection:** Detects Midjourney flags in pasted prompts
- **Extraction:** Parses `--ar`, `--v`, `--chaos`, `--stylize`, `--sref`, `--no`, etc.
- **Auto-variant:** Can automatically create a Midjourney variant with extracted params

**Supported Parameters:**
- `--v` / `--niji` - Version
- `--ar` - Aspect ratio
- `--chaos` - Chaos value
- `--stylize` / `--s` - Stylization
- `--quality` / `--q` - Quality
- `--raw` - Raw mode
- `--tile` - Tile mode
- `--no` - Negative prompt
- `--sref` - Style references
- `--cref` - Character references
- `--style` - Style preset
- `--seed` - Seed value
- `--stop` - Stop percentage
- `--weird` / `--w` - Weird value

#### Editing Prompts
- **Location:** `src/app/(main)/prompts/[id]/edit/page.tsx`
- Same form as create, with pre-populated data

#### Prompt Detail View
- **Location:** `src/app/(main)/prompts/[id]/page.tsx`
- **Component:** `src/components/prompts/prompt-detail.tsx`

**Features:**
- Base prompt display with copy button
- Favorite toggle
- Platform variants section
- AI Optimize button
- Edit button
- Details sidebar (category, times used, variants count, dates)

### 2. Platform Variants

#### Variant Form Dialog
- **Location:** `src/components/prompts/variant-form-dialog.tsx`

**Fields:**
- Platform selector (Midjourney, Flux, DALL-E, etc.)
- Model Version (e.g., v6.1, flux-1.1-pro)
- Optimized Prompt
- Negative Prompt
- Parameters (JSON)
- Notes
- Result Image upload

#### Variant Cards
- **Location:** `src/components/prompts/variant-card.tsx`
- Display variant with platform icon
- Copy button
- Edit/Delete dropdown
- "Set as Best" option
- Rating stars (1-5)

### 3. Image Upload

#### Component
- **Location:** `src/components/prompts/image-upload.tsx`

**Features:**
- Drag-and-drop zone
- Click to browse
- Image preview
- Delete button
- Loading state
- Max 5MB, images only

#### API
- **Location:** `src/app/api/upload/route.ts`
- POST: Upload image to Supabase Storage
- DELETE: Remove image from storage
- Storage bucket: `prompt-images`

### 4. AI Optimizer

#### Modal
- **Location:** `src/components/prompts/ai-optimizer-modal.tsx`

**Flow:**
1. Shows base prompt
2. User selects target platforms
3. Calls Gemini API to optimize
4. Shows results per platform
5. User can save as variants

#### API
- **Location:** `src/app/api/optimize/route.ts`
- Uses Google Gemini (gemini-2.0-flash)
- Returns optimized prompt + parameters per platform

### 5. Categories

#### Settings Page
- **Location:** `src/app/(main)/settings/page.tsx`
- **Component:** `src/components/settings/settings-page.tsx`

**Features:**
- Add new category (name, icon, color)
- Edit existing category
- Delete category (with confirmation)
- Drag-and-drop reordering (`@dnd-kit/core`, `@dnd-kit/sortable`)

#### Sidebar Display
- **Location:** `src/components/layout/sidebar.tsx`
- Categories listed with icons and colors
- Click to filter prompts
- Settings icon links to `/settings#categories`

### 6. Search & Filtering

#### Header Search
- **Location:** `src/components/layout/header.tsx`
- Debounced search (300ms)
- Updates URL params: `/?search=term`
- Searches title and base_prompt

#### Filtering
- By category: `/category/[slug]`
- By favorites: `/favorites`
- By archive: `/archive`
- By tag: `/?tag=tagname`

### 7. Navigation

#### Sidebar
- **Location:** `src/components/layout/sidebar.tsx`
- Logo (links to home)
- "New Prompt" button
- Navigation links (All Prompts, Favorites, Archive)
- Categories section with settings icon
- Settings link at bottom

#### Clickable Elements
- Tags on prompt cards link to `/?tag={tag}`
- Category badges link to `/category/{slug}`

---

## Platforms Configuration

**Location:** `src/lib/constants.ts`

```typescript
export const PLATFORMS = [
  { id: 'midjourney', name: 'Midjourney', icon: '🎨', color: '#5865F2' },
  { id: 'veo', name: 'Google Veo', icon: '🎬', color: '#4285F4' },
  { id: 'nano_banana_pro', name: 'Nano Banana Pro', icon: '🍌', color: '#FBBC04' },
  { id: 'dalle', name: 'DALL-E', icon: '🖼️', color: '#10A37F' },
  { id: 'stable_diffusion', name: 'Stable Diffusion', icon: '🌀', color: '#A855F7' },
  { id: 'flux', name: 'Flux', icon: '⚡', color: '#000000' },
  { id: 'ideogram', name: 'Ideogram', icon: '✨', color: '#FF6B6B' },
];
```

---

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/prompts` | GET, POST | List/create prompts |
| `/api/prompts/[id]` | GET, PATCH, DELETE | Single prompt CRUD |
| `/api/prompts/[id]/copy` | POST | Increment use count |
| `/api/prompts/[id]/variants` | POST | Add variant |
| `/api/prompts/[id]/variants/[vid]` | PATCH, DELETE | Update/delete variant |
| `/api/categories` | GET, POST | List/create categories |
| `/api/categories/[id]` | PATCH, DELETE | Update/delete category |
| `/api/categories/reorder` | POST | Update sort order |
| `/api/optimize` | POST | AI optimization |
| `/api/upload` | POST, DELETE | Image upload/delete |

---

## UI Components (shadcn/ui)

Installed components:
- button, card, input, textarea, select
- dialog, dropdown-menu, command
- badge, skeleton, toast, tabs
- tooltip, avatar, separator, scroll-area
- alert (added for Midjourney detection)

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=https://promptpantry.nl
```

---

## Known Issues & Notes

1. **Middleware Deprecation:** Next.js 16 deprecated middleware. Auth is now handled in layouts.

2. **Select Empty Value:** Radix UI Select doesn't allow `value=""`. Use a placeholder value like `"none"` instead.

3. **useSearchParams Suspense:** In Next.js 15+, components using `useSearchParams()` must be wrapped in a Suspense boundary.

4. **Image Upload:** Uses admin client for storage operations but verifies user authentication first.

---

## Future Considerations

See `FUTURE_FEATURES.md` for planned enhancements:
- Collections (Pinterest-style boards)
- Bulk import/export
- Keyboard shortcuts (Cmd+K, Cmd+N)
- Mobile responsiveness improvements
- Sharing/collaboration features

---

## Deployment

- **Hosting:** Vercel
- **Domain:** promptpantry.nl (configured in Vercel)
- **Auto-deploy:** On push to `main` branch

---

*Last updated: January 11, 2026*
