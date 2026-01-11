import { db, platforms } from '@/lib/db';
import { DEFAULT_PLATFORMS } from './defaults';
import { eq } from 'drizzle-orm';

/**
 * Seeds the database with default platforms.
 * Only inserts platforms that don't already exist (by slug).
 */
export async function seedPlatforms(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const platform of DEFAULT_PLATFORMS) {
    // Check if platform already exists
    const existing = await db.query.platforms.findFirst({
      where: eq(platforms.slug, platform.slug),
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Insert the platform
    await db.insert(platforms).values({
      slug: platform.slug,
      name: platform.name,
      icon: platform.icon,
      color: platform.color,
      type: platform.type,
      optimizationPrompt: platform.optimizationPrompt,
      supportsNegativePrompt: platform.supportsNegativePrompt,
      defaultParameters: platform.defaultParameters,
      tips: platform.tips,
      sortOrder: platform.sortOrder,
      isActive: platform.isActive,
      isDefault: platform.isDefault,
    });

    inserted++;
  }

  return { inserted, skipped };
}

/**
 * Resets a platform to its default configuration.
 * Only works for system default platforms.
 */
export async function resetPlatformToDefault(slug: string): Promise<boolean> {
  const defaultPlatform = DEFAULT_PLATFORMS.find(p => p.slug === slug);
  if (!defaultPlatform) {
    return false;
  }

  await db
    .update(platforms)
    .set({
      name: defaultPlatform.name,
      icon: defaultPlatform.icon,
      color: defaultPlatform.color,
      type: defaultPlatform.type,
      optimizationPrompt: defaultPlatform.optimizationPrompt,
      supportsNegativePrompt: defaultPlatform.supportsNegativePrompt,
      defaultParameters: defaultPlatform.defaultParameters,
      tips: defaultPlatform.tips,
    })
    .where(eq(platforms.slug, slug));

  return true;
}
