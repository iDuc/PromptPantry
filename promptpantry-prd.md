# PromptPantry - Product Requirements Document

## Project Overview

**PromptPantry** is een visuele prompt management applicatie voor AI image/video generatie. De app stelt gebruikers in staat om prompts te organiseren, optimaliseren en de resultaten bij te houden across verschillende AI platforms (Midjourney, Google Veo, Nano Banana Pro, etc.).

**Domain**: promptpantry.nl

### Doelgroep
- Primaire gebruiker: Vormgever/designer die dagelijks met AI image generation werkt
- Secundaire gebruiker: Developer/digital artist met technische achtergrond
- Beide gebruikers delen één account en werken op verschillende machines

### Kernwaarden
1. **Visueel aantrekkelijk** - De UI moet inspirerend en prettig zijn om mee te werken
2. **Efficiënt** - Snel prompts vinden, kopiëren en gebruiken
3. **Inzichtelijk** - Leren welke prompts het beste werken per platform

---

## Tech Stack

| Component | Technologie | Versie |
|-----------|-------------|--------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | latest |
| Database | Supabase (Postgres) | - |
| ORM | Drizzle ORM | latest |
| Auth | Supabase Auth | - |
| File Storage | Supabase Storage | - |
| AI Integration | Google Gemini API | gemini-2.0-flash |
| Deployment | Vercel | - |
| Package Manager | pnpm | 9.x |

---

## Design Requirements

### Design Philosophy
De app moet aanvoelen als een **moderne creative tool** - denk aan de esthetiek van:
- Figma (clean, spacious, professional)
- Notion (warm, uitnodigend, organized)
- Dribbble (visueel, inspirerend, gallery-feel)

### Color Palette
```css
/* Light mode */
--background: #FAFAFA
--card: #FFFFFF
--primary: #6366F1 (Indigo)
--primary-hover: #4F46E5
--accent: #F59E0B (Amber - voor favorites/ratings)
--muted: #64748B
--border: #E2E8F0

/* Dark mode */
--background: #0F0F10
--card: #18181B
--primary: #818CF8
--primary-hover: #A5B4FC
--accent: #FBBF24
--muted: #94A3B8
--border: #27272A
```

### Typography
- Headings: Inter (weight 600-700)
- Body: Inter (weight 400-500)
- Code/Prompts: JetBrains Mono of Fira Code

### UI Patterns
1. **Card-based layout** - Prompts als visuele cards met thumbnail
2. **Masonry grid** - Pinterest-style voor de gallery view
3. **Smooth animations** - Subtle transitions, hover effects
4. **Generous whitespace** - Niet te druk, ruimte om te ademen
5. **Dark mode** - Default aan, toggle beschikbaar

### Responsive Breakpoints
- Mobile: < 640px (1 kolom)
- Tablet: 640-1024px (2 kolommen)
- Desktop: > 1024px (3-4 kolommen)

---

## Database Schema

### Tables

```sql
-- Categorieën voor prompts
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT, -- Lucide icon name
  color TEXT, -- Hex color for category badge
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hoofd prompts tabel
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  base_prompt TEXT NOT NULL, -- De kern prompt/idee
  category_id UUID REFERENCES categories(id),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform-specifieke varianten
CREATE TABLE prompt_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'midjourney', 'veo', 'nano_banana_pro', 'dalle', 'stable_diffusion', 'flux'
  optimized_prompt TEXT NOT NULL,
  negative_prompt TEXT,
  parameters JSONB DEFAULT '{}', -- Platform-specifieke params
  result_image_url TEXT, -- URL naar Supabase Storage
  result_thumbnail_url TEXT, -- Kleinere versie voor grid
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  is_best BOOLEAN DEFAULT FALSE, -- Markeer beste variant
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates voor guided prompt building
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL, -- "A {subject} in {style} style"
  variables JSONB DEFAULT '[]', -- [{name: "subject", suggestions: [...]}]
  category_id UUID REFERENCES categories(id),
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI optimalisatie geschiedenis
CREATE TABLE optimization_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  original_input TEXT NOT NULL,
  optimized_output JSONB NOT NULL, -- {midjourney: "...", veo: "...", ...}
  model_used TEXT DEFAULT 'gemini-2.0-flash',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_prompts_category ON prompts(category_id);
CREATE INDEX idx_prompts_favorite ON prompts(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_variants_prompt ON prompt_variants(prompt_id);
CREATE INDEX idx_variants_platform ON prompt_variants(platform);
CREATE INDEX idx_variants_rating ON prompt_variants(rating) WHERE rating IS NOT NULL;
```

### Row Level Security (RLS)
Voor nu disabled - single user setup. Later toe te voegen indien nodig.

---

## Features Specification

### 1. Dashboard / Home
**Route:** `/`

**Componenten:**
- Quick stats cards (totaal prompts, favorieten, recent gebruikt)
- Recent prompts grid (laatste 6-8)
- Quick actions (nieuwe prompt, importeren)
- Search bar (prominent, command+K shortcut)

### 2. Prompts Library
**Route:** `/prompts`

**Componenten:**
- Filter sidebar:
  - Category filter (checkboxes)
  - Platform filter
  - Tags filter (autocomplete)
  - Rating filter (sterren)
  - Favorites only toggle
- Masonry grid met prompt cards
- View toggle (grid/list)
- Sort options (recent, rating, most used, alphabetical)

**Prompt Card Design:**
```
┌─────────────────────────────┐
│ [Thumbnail Image]           │
│                             │
│ ─────────────────────────── │
│ Title                    ⭐ │
│ Base prompt preview...      │
│ ─────────────────────────── │
│ [MJ] [Veo] [NBP]    ★★★★☆  │
│ #tag1 #tag2                 │
└─────────────────────────────┘
```

### 3. Prompt Detail
**Route:** `/prompts/[id]`

**Componenten:**
- Hero section met beste resultaat image
- Base prompt (editable)
- Variants tabs/grid per platform
- Per variant:
  - Optimized prompt (copyable)
  - Parameters
  - Negative prompt
  - Result image upload
  - Rating (clickable stars)
  - Notes
- AI Optimize button
- Related prompts

### 4. Create/Edit Prompt
**Route:** `/prompts/new` en `/prompts/[id]/edit`

**Flow:**
1. Enter base prompt/idea
2. Select category
3. Add tags (autocomplete + create new)
4. Optional: Use AI optimizer
5. Add/edit variants per platform
6. Save

### 5. AI Prompt Optimizer
**Component:** Modal of slide-over panel

**Flow:**
1. User enters basic idea/prompt
2. Select target platforms
3. Click "Optimize"
4. Gemini generates optimized versions per platform
5. User reviews, edits if needed
6. Save as variants

**Gemini Prompt Template:**
```
Je bent een expert prompt engineer voor AI image/video generatie.

Optimaliseer de volgende prompt voor de geselecteerde platforms.
Houd rekening met de specifieke syntax en best practices per platform.

INPUT PROMPT:
{user_prompt}

PLATFORMS:
{selected_platforms}

Geef voor elk platform:
1. De geoptimaliseerde prompt
2. Aanbevolen parameters (aspect ratio, style, etc.)
3. Negative prompt (indien relevant)

Antwoord in JSON format:
{
  "platforms": {
    "midjourney": {
      "prompt": "...",
      "parameters": "--ar 16:9 --v 6.1 --style raw",
      "negative_prompt": null
    },
    "veo": {
      "prompt": "...",
      "parameters": {"duration": "5s", "aspect_ratio": "16:9"},
      "negative_prompt": null
    }
  }
}
```

### 6. Import
**Route:** `/import`

**Supported formats:**
- JSON (Midjourney archive export)
- CSV
- Manual paste

**Mapping UI:**
- Preview imported data
- Map columns to fields
- Bulk category/tag assignment
- Import progress indicator

### 7. Categories Management
**Route:** `/settings/categories`

**Features:**
- CRUD voor categories
- Drag-and-drop reordering
- Icon picker (Lucide icons)
- Color picker

### 8. Search
**Component:** Command palette (⌘K)

**Features:**
- Fuzzy search op title, prompt, tags
- Recent searches
- Quick actions (new prompt, import, etc.)
- Keyboard navigation

---

## API Routes

```
/api/prompts
  GET    - List prompts (met filters, pagination)
  POST   - Create prompt

/api/prompts/[id]
  GET    - Get single prompt met variants
  PATCH  - Update prompt
  DELETE - Delete prompt

/api/prompts/[id]/variants
  POST   - Add variant
  
/api/prompts/[id]/variants/[variantId]
  PATCH  - Update variant
  DELETE - Delete variant

/api/prompts/[id]/copy
  POST   - Increment use_count, update last_used_at

/api/categories
  GET    - List categories
  POST   - Create category
  PATCH  - Bulk update (reordering)

/api/categories/[id]
  PATCH  - Update category
  DELETE - Delete category

/api/optimize
  POST   - Send to Gemini, return optimized prompts

/api/import
  POST   - Import prompts from JSON/CSV

/api/upload
  POST   - Upload image to Supabase Storage
```

---

## File Structure

```
promptpantry/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx                 # Dashboard
│   │   │   ├── prompts/
│   │   │   │   ├── page.tsx             # Library
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx         # Create
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         # Detail
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx     # Edit
│   │   │   ├── import/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── categories/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx               # Dashboard layout met sidebar
│   │   ├── api/
│   │   │   ├── prompts/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── variants/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── [variantId]/
│   │   │   │       │       └── route.ts
│   │   │   │       └── copy/
│   │   │   │           └── route.ts
│   │   │   ├── categories/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── optimize/
│   │   │   │   └── route.ts
│   │   │   ├── import/
│   │   │   │   └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components
│   │   ├── prompts/
│   │   │   ├── prompt-card.tsx
│   │   │   ├── prompt-grid.tsx
│   │   │   ├── prompt-form.tsx
│   │   │   ├── prompt-detail.tsx
│   │   │   ├── variant-card.tsx
│   │   │   └── variant-form.tsx
│   │   ├── optimizer/
│   │   │   ├── optimizer-modal.tsx
│   │   │   └── optimizer-result.tsx
│   │   ├── import/
│   │   │   ├── import-dropzone.tsx
│   │   │   └── import-mapper.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── command-palette.tsx
│   │   │   └── theme-toggle.tsx
│   │   └── shared/
│   │       ├── rating-stars.tsx
│   │       ├── tag-input.tsx
│   │       ├── image-upload.tsx
│   │       ├── copy-button.tsx
│   │       └── platform-badge.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                 # Drizzle client
│   │   │   ├── schema.ts                # Drizzle schema
│   │   │   └── migrations/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser client
│   │   │   ├── server.ts                # Server client
│   │   │   └── storage.ts               # Storage helpers
│   │   ├── gemini/
│   │   │   └── client.ts                # Gemini API client
│   │   ├── utils.ts
│   │   └── constants.ts                 # Platforms, default categories
│   ├── hooks/
│   │   ├── use-prompts.ts
│   │   ├── use-categories.ts
│   │   ├── use-search.ts
│   │   └── use-optimizer.ts
│   └── types/
│       └── index.ts
├── public/
│   └── ...
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local.example
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (Supabase Postgres connection string)
DATABASE_URL=postgresql://...

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Default Data (Seed)

### Categories
```json
[
  {"name": "Styles", "slug": "styles", "icon": "Palette", "color": "#8B5CF6"},
  {"name": "Lighting", "slug": "lighting", "icon": "Sun", "color": "#F59E0B"},
  {"name": "Camera", "slug": "camera", "icon": "Camera", "color": "#3B82F6"},
  {"name": "Themes", "slug": "themes", "icon": "Sparkles", "color": "#EC4899"},
  {"name": "Materials", "slug": "materials", "icon": "Box", "color": "#10B981"},
  {"name": "Characters", "slug": "characters", "icon": "User", "color": "#6366F1"},
  {"name": "Environments", "slug": "environments", "icon": "Mountain", "color": "#14B8A6"},
  {"name": "Abstract", "slug": "abstract", "icon": "Shapes", "color": "#F43F5E"}
]
```

### Platforms
```json
[
  {"id": "midjourney", "name": "Midjourney", "icon": "🎨", "color": "#5865F2"},
  {"id": "veo", "name": "Google Veo", "icon": "🎬", "color": "#4285F4"},
  {"id": "nano_banana_pro", "name": "Nano Banana Pro", "icon": "🍌", "color": "#FBBC04"},
  {"id": "dalle", "name": "DALL-E", "icon": "🖼️", "color": "#10A37F"},
  {"id": "stable_diffusion", "name": "Stable Diffusion", "icon": "🌀", "color": "#A855F7"},
  {"id": "flux", "name": "Flux", "icon": "⚡", "color": "#000000"},
  {"id": "ideogram", "name": "Ideogram", "icon": "✨", "color": "#FF6B6B"}
]
```

---

## Development Phases

### Phase 1: Foundation (MVP)
- [ ] Project setup (Next.js, Tailwind, shadcn/ui)
- [ ] Supabase setup (database, auth, storage)
- [ ] Drizzle schema + migrations
- [ ] Basic layout (sidebar, header, theme toggle)
- [ ] Prompts CRUD
- [ ] Prompt cards + grid view
- [ ] Category management
- [ ] Search functionality

### Phase 2: Variants & Images
- [ ] Variant system per platform
- [ ] Image upload voor results
- [ ] Rating system
- [ ] Favorites
- [ ] Copy functionality met use tracking

### Phase 3: AI Integration
- [ ] Gemini API integration
- [ ] Optimizer modal/flow
- [ ] Save optimized results as variants

### Phase 4: Import & Polish
- [ ] JSON/CSV import
- [ ] Command palette (⌘K)
- [ ] Animations & transitions
- [ ] Mobile responsive polish
- [ ] Performance optimization

---

## Notes for Claude Code

1. **Start met de database schema** - Maak eerst de Drizzle schema aan en run migrations
2. **shadcn/ui components** - Installeer: button, card, input, textarea, select, dialog, dropdown-menu, command, badge, avatar, skeleton, toast, tabs, tooltip
3. **Masonry grid** - Gebruik CSS columns of een library zoals `react-masonry-css`
4. **Image optimization** - Gebruik Next.js Image component, genereer thumbnails bij upload
5. **Dark mode** - Gebruik `next-themes` met Tailwind dark: classes
6. **Form handling** - Gebruik `react-hook-form` met `zod` validation
7. **Data fetching** - Gebruik `@tanstack/react-query` voor caching
8. **Animations** - Gebruik `framer-motion` voor smooth transitions

---

## Acceptance Criteria

De app is klaar wanneer:
1. ✅ Gebruiker kan prompts aanmaken, bewerken, verwijderen
2. ✅ Prompts worden getoond in een visuele masonry grid
3. ✅ Gebruiker kan varianten per platform toevoegen
4. ✅ Gebruiker kan resultaat-images uploaden
5. ✅ Gebruiker kan prompts zoeken en filteren
6. ✅ Gebruiker kan prompts kopiëren met één klik
7. ✅ AI optimizer genereert platform-specifieke varianten
8. ✅ Import functionaliteit werkt voor JSON
9. ✅ Dark mode werkt correct
10. ✅ App is responsive op mobile/tablet/desktop
11. ✅ App draait op Vercel met Supabase backend
