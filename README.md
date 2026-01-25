# PromptPantry

A beautiful prompt management app for AI image and video generation. Organize, optimize, and iterate on your prompts for Midjourney, Flux, DALL-E, Stable Diffusion, and more.

**Live at [promptpantry.nl](https://www.promptpantry.nl)**

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- **Prompt Library** - Store and organize prompts with categories, tags, and favorites
- **Platform Variants** - Save optimized versions for different AI tools (Midjourney, Flux, DALL-E, etc.)
- **AI Optimizer** - Generate platform-specific prompts using Google Gemini
- **Midjourney Parser** - Auto-detect and extract parameters from Midjourney prompts
- **Result Images** - Attach generated images to track what works
- **Rating System** - Rate variants to remember your best results
- **Mobile-First** - Responsive design with bottom navigation and gesture support

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Database**: [Supabase](https://supabase.com) (Postgres)
- **ORM**: [Drizzle](https://orm.drizzle.team)
- **AI**: [Google Gemini API](https://ai.google.dev)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Google AI API key (for optimization feature)

### Installation

```bash
# Clone the repository
git clone https://github.com/iDuc/PromptPantry.git
cd PromptPantry

# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local
```

### Environment Variables

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Protected routes
│   │   ├── prompts/       # Prompt CRUD pages
│   │   ├── category/      # Category filtering
│   │   └── settings/      # User settings
│   ├── auth/              # Authentication pages
│   └── api/               # API routes
├── components/
│   ├── layout/            # Sidebar, header, navigation
│   ├── prompts/           # Prompt cards, forms, modals
│   ├── settings/          # Settings components
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── db/                # Drizzle schema and queries
│   ├── supabase/          # Supabase clients
│   └── parsers/           # Midjourney parameter parser
└── hooks/                 # Custom React hooks
```

## Supported Platforms

| Platform | Features |
|----------|----------|
| Midjourney | Auto-parameter parsing, version support |
| Flux | Prompt optimization |
| DALL-E | Prompt optimization |
| Stable Diffusion | Negative prompts |
| Google Veo | Video prompts |
| Ideogram | Prompt optimization |

## Documentation

- [FEATURES.md](./FEATURES.md) - Detailed feature documentation
- [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) - Planned features
- [CLAUDE.md](./CLAUDE.md) - Development instructions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with care for designers who work with AI every day.
