# PromptPantry - Project Overzicht

> Gegenereerd op: 2 februari 2026

---

## 1. Wat is PromptPantry?

PromptPantry is een **visuele prompt management applicatie** voor mensen die dagelijks werken met AI image/video generatie tools zoals Midjourney, Flux, DALL-E, Stable Diffusion, etc.

**Het probleem:** Designers en digital artists verzamelen honderden prompts, maar deze belanden vaak in tekstbestanden, Discord-geschiedenis of notitie-apps. Moeilijk terug te vinden, geen overzicht van wat werkte.

**De oplossing:** Een mooie, Pinterest-achtige applicatie waar je:
- Prompts opslaat met categorieën, tags en resultaat-afbeeldingen
- Platform-specifieke varianten bijhoudt (dezelfde prompt geoptimaliseerd voor Midjourney vs Flux)
- AI-gestuurde optimalisatie krijgt via Google Gemini
- Snel prompts kopieert met één klik
- Ziet welke prompts het beste werkten (via ratings)

**Doelgroep:** Primair vormgevers/designers die dagelijks met AI generation werken. De UI is bewust visueel en inspirerend gehouden (denk Figma meets Pinterest).

**Live:** [promptpantry.nl](https://www.promptpantry.nl)

---

## 2. Tech Stack

| Component | Technologie | Versie |
|-----------|-------------|--------|
| Framework | Next.js (App Router) | 16.1.1 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui + Radix | latest |
| Database | Supabase (Postgres) | - |
| ORM | Drizzle ORM | 0.45.1 |
| Auth | Supabase Auth | - |
| File Storage | Supabase Storage | - |
| AI Integration | Google Gemini API | gemini-2.0-flash |
| Animations | Framer Motion | 12.25.0 |
| Form Handling | React Hook Form + Zod | 7.70.0 / 4.3.5 |
| Deployment | Vercel | - |
| Package Manager | pnpm | - |

### Belangrijke Dependencies
- `react-masonry-css` - Pinterest-style grid layout
- `vaul` - iOS-style bottom sheets (mobile)
- `@dnd-kit` - Drag-and-drop (category reordering)
- `cmdk` - Command palette
- `sonner` - Toast notifications
- `sharp` - Image processing

---

## 3. Project Structuur

```
src/
├── app/                        # Next.js App Router
│   ├── (main)/                 # Protected routes (auth check in layout)
│   │   ├── prompts/            # Prompt CRUD pages
│   │   │   ├── page.tsx        # Library view (grid)
│   │   │   ├── new/            # Create prompt
│   │   │   └── [id]/           # Detail & edit
│   │   ├── category/[slug]/    # Category filtering
│   │   ├── favorites/          # Favorites view
│   │   ├── archive/            # Archived prompts
│   │   └── settings/           # User settings + categories
│   ├── auth/                   # Login/signup/callback
│   └── api/                    # API routes
│       ├── prompts/            # CRUD + copy + variants
│       ├── categories/         # CRUD + reorder
│       ├── optimize/           # Gemini AI integration
│       └── upload/             # Supabase Storage
├── components/
│   ├── layout/                 # Sidebar, header, mobile nav, drawer
│   ├── prompts/                # Cards, forms, detail, variants
│   ├── settings/               # Settings components
│   └── ui/                     # shadcn/ui + custom (responsive-dialog)
├── lib/
│   ├── db/                     # Drizzle schema + queries
│   ├── supabase/               # Server + client Supabase
│   ├── parsers/                # Midjourney parameter parser
│   └── constants.ts            # Platforms, default categories
└── hooks/                      # Custom hooks (media-query, scroll, etc.)
```

---

## 4. Huidige Features ✅

### Core Functionaliteit
- **Prompt CRUD** - Aanmaken, bewerken, verwijderen van prompts
- **Masonry Grid** - Visuele Pinterest-style weergave
- **Categories** - Eigen categorieën met icon + kleur, drag-and-drop sorteren
- **Tags** - Autocomplete, klikbaar voor filtering
- **Favorites** - Favorieten markeren
- **Archive** - Prompts archiveren (soft delete)
- **Search** - Zoeken op titel en prompt tekst

### Platform Varianten
- **Multi-platform** - Midjourney, Flux, DALL-E, Stable Diffusion, Veo, Ideogram, Nano Banana Pro
- **Variant Management** - Meerdere geoptimaliseerde versies per platform
- **Parameters** - Platform-specifieke instellingen (JSON)
- **Negative Prompts** - Ondersteuning voor wat te vermijden
- **Rating** - 1-5 sterren per variant
- **"Best" Marker** - Beste variant aanduiden

### Midjourney Parser
- **Auto-detectie** - Herkent Midjourney syntax in geplakte prompts
- **Parameter Extractie** - `--ar`, `--v`, `--chaos`, `--stylize`, `--sref`, `--no`, etc.
- **Auto-variant** - Maakt automatisch Midjourney variant aan

### AI Optimizer
- **Google Gemini** - Gebruikt gemini-2.0-flash
- **Multi-platform Output** - Genereert geoptimaliseerde versies voor geselecteerde platforms
- **One-click Save** - Direct opslaan als varianten

### Image Management
- **Upload** - Drag-and-drop resultaat-afbeeldingen
- **Supabase Storage** - Veilige opslag
- **Thumbnails** - Preview in grid

### Mobile UI
- **Responsive Design** - Mobile-first approach
- **Bottom Navigation** - Floating action bar met FAB
- **Bottom Sheets** - iOS-style via Vaul
- **Mobile Drawer** - Categories en menu
- **Search Modal** - Full-screen zoeken

### Auth
- **Supabase Auth** - Email/password
- **RLS Policies** - Data isolatie per user
- **Session Management** - Cookie-based via @supabase/ssr

---

## 5. Geplande Features 🚀

### High Priority (Next Release)
| Feature | Beschrijving |
|---------|--------------|
| **Version History** | Track prompt iteraties, vergelijk versies, revert |
| **Parameter Presets** | Quick-add Midjourney params (aspect ratios, stylize, chaos) |
| **Style/Lighting/Camera Presets** | Pre-built modifier libraries |
| **Batch Operations** | Bulk tag, archive, delete, export |

### Medium Priority
| Feature | Beschrijving |
|---------|--------------|
| **Chrome Extension** | Save prompts direct vanuit Discord/web |
| **Prompt Templates** | Herbruikbare structuren met variabelen |
| **Prompt Sharing** | Publieke profielen, shareable links |
| **Analytics Dashboard** | Usage stats, ratings over tijd |
| **AI Enhancement Suggestions** | AI reviewt prompt en suggereert verbeteringen |
| **Keyboard Shortcuts** | Cmd+K, Cmd+N, J/K navigatie |
| **Duplicate Prompt** | Snel variaties maken |

### Low Priority (Someday)
- Prompt Marketplace (buy/sell)
- Team Collaboration
- Image-to-Prompt AI
- Native Mobile App
- Direct Midjourney Import via Discord

---

## 6. Lokaal Starten

### Prerequisites
- Node.js 18+
- pnpm
- Supabase account
- Google AI API key (voor optimizer)

### Setup

```bash
# Clone repository
git clone https://github.com/iDuc/PromptPantry.git
cd PromptPantry

# Install dependencies
pnpm install

# Environment variables
cp .env.local.example .env.local
```

### Environment Variables (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

```bash
# Generate migrations (als schema gewijzigd)
pnpm db:generate

# Push schema naar database
pnpm db:push
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Script | Beschrijving |
|--------|--------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build voor productie |
| `pnpm start` | Start productie server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run E2E tests with Playwright UI |
| `pnpm test:e2e:headed` | Run E2E tests in headed mode |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema naar database |

---

## 8. Testing

### E2E Tests (Playwright)

We use Playwright for end-to-end testing. Tests are located in the `e2e/` folder.

#### Test Structure

```
e2e/
├── navigation.spec.ts    # Basic navigation tests
├── auth.spec.ts          # Authentication flow tests
└── home.spec.ts          # Home page & accessibility tests
```

#### Running Tests

```bash
# Run all tests (headless)
pnpm test:e2e

# Run with Playwright UI (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
pnpm test:e2e e2e/auth.spec.ts

# Run specific browser only
pnpm test:e2e --project=chromium
```

#### Browser Coverage

Tests run against:
- Chromium (Desktop Chrome)
- Firefox
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

#### CI Integration

- **CI Workflow** (`.github/workflows/ci.yml`): Runs lint, typecheck, and build on every push/PR
- **E2E Workflow** (`.github/workflows/e2e.yml`): Runs Playwright tests on push to main and PRs

#### Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-route');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

#### Configuration

Playwright config is in `playwright.config.ts`. Key settings:
- Base URL: `http://localhost:3000`
- Auto-starts dev server before tests
- Retries: 2 on CI, 0 locally
- Screenshots on failure
- Trace collection on retry

---

## 7. Open Vragen ❓

### Technisch
1. **Import functionaliteit** - Is JSON/CSV import al geïmplementeerd? Niet gedocumenteerd in FEATURES.md maar wel in API routes.
2. **Seed data** - Hoe worden default categories aangemaakt voor nieuwe users?
3. **Image thumbnails** - Worden thumbnails automatisch gegenereerd bij upload? Sharp is geïnstalleerd.

### Product
4. **Multi-user** - Is het 1 gedeeld account of kunnen Rich + vormgever aparte accounts hebben?
5. **Domain setup** - Is promptpantry.nl al geconfigureerd in Vercel?
6. **Backup strategy** - Hoe wordt Supabase data gebackupt?

### Prioriteiten
7. **Version History** - Is dit de volgende grote feature om te bouwen?
8. **Chrome Extension** - Is hier vraag naar vanuit gebruikers?

### Documentatie
9. **API Documentatie** - Zijn de API routes ergens gedocumenteerd voor externe integratie?
10. **Supabase Setup Guide** - Stap-voor-stap voor RLS policies en storage bucket setup?

---

## Referenties

- **PRD:** `promptpantry-prd.md`
- **Development Instructions:** `CLAUDE.md`
- **Features:** `FEATURES.md`
- **Future Ideas:** `FUTURE_FEATURES.md`
- **GitHub:** https://github.com/iDuc/PromptPantry
- **Live:** https://www.promptpantry.nl
