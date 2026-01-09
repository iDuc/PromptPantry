// AI Generation Platforms
export const PLATFORMS = [
  { id: 'midjourney', name: 'Midjourney', icon: '🎨', color: '#5865F2' },
  { id: 'veo', name: 'Google Veo', icon: '🎬', color: '#4285F4' },
  { id: 'nano_banana_pro', name: 'Nano Banana Pro', icon: '🍌', color: '#FBBC04' },
  { id: 'dalle', name: 'DALL-E', icon: '🖼️', color: '#10A37F' },
  { id: 'stable_diffusion', name: 'Stable Diffusion', icon: '🌀', color: '#A855F7' },
  { id: 'flux', name: 'Flux', icon: '⚡', color: '#000000' },
  { id: 'ideogram', name: 'Ideogram', icon: '✨', color: '#FF6B6B' },
] as const;

export type PlatformId = typeof PLATFORMS[number]['id'];

// Default Categories (for seeding)
export const DEFAULT_CATEGORIES = [
  { name: 'Styles', slug: 'styles', icon: 'Palette', color: '#8B5CF6' },
  { name: 'Lighting', slug: 'lighting', icon: 'Sun', color: '#F59E0B' },
  { name: 'Camera', slug: 'camera', icon: 'Camera', color: '#3B82F6' },
  { name: 'Themes', slug: 'themes', icon: 'Sparkles', color: '#EC4899' },
  { name: 'Materials', slug: 'materials', icon: 'Box', color: '#10B981' },
  { name: 'Characters', slug: 'characters', icon: 'User', color: '#6366F1' },
  { name: 'Environments', slug: 'environments', icon: 'Mountain', color: '#14B8A6' },
  { name: 'Abstract', slug: 'abstract', icon: 'Shapes', color: '#F43F5E' },
] as const;

// Gemini Optimizer Prompt Template
export const OPTIMIZER_PROMPT = `Je bent een expert prompt engineer voor AI image/video generatie.

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
