# PromptPantry - Future Feature Ideas

This document tracks feature ideas for future development. Ideas are categorized by theme and prioritized by potential impact.

---

## Competitor Research Sources
- [PromptFolder](https://promptfolder.com) - Midjourney parameter helpers, folder organization
- [PromptBase](https://promptbase.com) - Prompt marketplace, quality control
- [PromptHero](https://prompthero.com) - Community features, analytics, job board
- [AIPRM](https://aiprm.com) - Chrome extension, team features
- [PromptLayer](https://promptlayer.com) - Version tracking, API integration
- [OctiAI](https://octiai.com) - Reusable prompt engines

---

## High Priority (Next Release)

### Version History
Track iterations of prompts over time.
- Save each edit as a version
- Compare versions side-by-side
- Revert to previous versions
- See what changed between versions

**Inspired by:** PromptLayer, Git

### Parameter Presets (Midjourney)
Quick-add common Midjourney parameters.
- Aspect ratios: 16:9, 1:1, 9:16, 4:3
- Stylize values: 50, 100, 250, 500, 1000
- Chaos: 0, 25, 50, 75, 100
- Version: v5, v6, v6.1
- Style: raw, cute, expressive

**Inspired by:** PromptFolder

### Style/Lighting/Camera Presets
Pre-built modifier libraries.
- Styles: Cinematic, Anime, Watercolor, Oil Painting, etc.
- Lighting: Golden hour, Studio, Neon, Candlelight, etc.
- Camera: Wide angle, Macro, 35mm, Tilt-shift, etc.
- One-click add to any prompt

**Inspired by:** PromptFolder's categorized modifiers

### Batch Operations
Select multiple prompts and act on them.
- Bulk add to collection
- Bulk tag
- Bulk archive
- Bulk delete
- Bulk export

---

## Medium Priority (Future)

### Chrome Extension
Save prompts directly from Discord/web.
- Right-click to save selection as prompt
- Auto-detect Midjourney prompts in Discord
- Quick access to prompt library
- Copy prompt with one click

**Inspired by:** PromptFolder, AIPRM

### Prompt Templates with Variables
Reusable prompt structures.
- "A {subject} in {style} style, {lighting} lighting"
- Fill in variables when creating
- Suggested values per variable
- Quick-generate variations

**Note:** Schema already exists (`prompt_templates` table)

### Prompt Sharing (Public Profiles)
Share your best prompts publicly.
- Public/private toggle per prompt
- Shareable link
- Public profile page
- Embed on website/blog

**Inspired by:** PromptHero, PromptBase

### Analytics Dashboard
Track prompt effectiveness.
- Most used prompts
- Highest rated results
- Usage over time charts
- Platform breakdown
- Tag popularity

**Inspired by:** PromptHero Pro

### AI Prompt Enhancement Suggestions
AI reviews your prompt and suggests improvements.
- "Add more detail about lighting"
- "Consider adding style keywords"
- "This prompt might be too long"
- One-click apply suggestions

### Keyboard Power User Mode
Full keyboard navigation.
- `Cmd+K` - Command palette (search)
- `Cmd+N` - New prompt
- `Cmd+S` - Save
- `Cmd+C` - Copy prompt
- `J/K` - Navigate prompts
- `F` - Favorite
- `E` - Edit

### Duplicate Prompt
Quick way to create variations.
- Duplicate existing prompt
- Opens edit form with pre-filled data
- Auto-adds "(copy)" to title

---

## Low Priority (Someday)

### Prompt Marketplace
Buy/sell prompts (like PromptBase).
- Set price per prompt
- Preview vs full prompt
- Ratings and reviews
- Creator profiles and earnings

**Complexity:** High - needs payment integration, moderation

### Team Collaboration
Shared workspaces for teams.
- Invite team members
- Shared categories/collections
- Permission levels (view/edit/admin)
- Activity feed
- Comments on prompts

**Inspired by:** PromptHub, PromptLayer

### AI-Powered Prompt from Image
Upload image, get prompt that would recreate it.
- Image-to-prompt AI
- Platform-specific outputs
- Style detection
- Starting point for variations

### Scheduled Prompt Reminders
Get reminded to use/review prompts.
- "You haven't used this in 30 days"
- Scheduled email digests
- "Try this prompt again" suggestions

### Import from Midjourney
Direct import from Midjourney.
- Connect Discord account
- Import job history
- Sync images automatically
- Map to existing prompts

**Note:** Depends on Midjourney API availability

### Native Mobile App
Native iOS/Android app (beyond current responsive web).
- Quick capture prompts
- Browse library
- Copy to clipboard
- Camera to save images
- Push notifications

**Note:** Mobile-responsive web UI implemented Jan 2026. Native app would add offline support, push notifications, and native sharing.

---

## Rejected Ideas

### Real-time Collaboration
Multiple users editing same prompt.
- **Why rejected:** Over-engineering for single-user focus
- **Reconsider if:** Team features become priority

### AI Chatbot Interface
Chat with AI about your prompts.
- **Why rejected:** Adds complexity, unclear value
- **Reconsider if:** Users request conversational workflow

### Blockchain/NFT Integration
Mint prompts as NFTs.
- **Why rejected:** Hype-driven, not user-focused
- **Reconsider if:** Never

---

## Feature Request Tracking

| Feature | Requested By | Date | Priority |
|---------|--------------|------|----------|
| Version history | Internal | 2025-01 | High |
| Parameter presets | Internal | 2025-01 | High |
| Chrome extension | - | - | Medium |
| Team features | - | - | Low |

---

## How to Add Ideas

1. Add to appropriate priority section
2. Include brief description
3. Note inspiration source if applicable
4. Add to tracking table if user-requested

---

*Last updated: January 2026*
