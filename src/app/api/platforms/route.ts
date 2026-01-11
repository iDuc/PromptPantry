import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platforms } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';

// GET /api/platforms - List all platforms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'image' | 'video' | null
    const activeOnly = searchParams.get('active') !== 'false'; // default true

    let conditions = [];

    if (activeOnly) {
      conditions.push(eq(platforms.isActive, true));
    }

    if (type === 'image' || type === 'video') {
      conditions.push(eq(platforms.type, type));
    }

    const result = await db
      .select({
        id: platforms.id,
        slug: platforms.slug,
        name: platforms.name,
        icon: platforms.icon,
        color: platforms.color,
        type: platforms.type,
        supportsNegativePrompt: platforms.supportsNegativePrompt,
        defaultParameters: platforms.defaultParameters,
        tips: platforms.tips,
        sortOrder: platforms.sortOrder,
        isActive: platforms.isActive,
        isDefault: platforms.isDefault,
      })
      .from(platforms)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(platforms.sortOrder));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

// POST /api/platforms - Create a new platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      slug,
      name,
      icon,
      color,
      type = 'image',
      optimizationPrompt,
      supportsNegativePrompt = false,
      defaultParameters = {},
      tips,
    } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: 'Slug and name are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await db.query.platforms.findFirst({
      where: eq(platforms.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Platform with this slug already exists' },
        { status: 409 }
      );
    }

    // Get max sort order
    const maxSortResult = await db
      .select({ maxSort: platforms.sortOrder })
      .from(platforms)
      .orderBy(asc(platforms.sortOrder));

    const maxSort = maxSortResult.length > 0
      ? Math.max(...maxSortResult.map(r => r.maxSort || 0))
      : 0;

    const [newPlatform] = await db
      .insert(platforms)
      .values({
        slug,
        name,
        icon,
        color,
        type,
        optimizationPrompt,
        supportsNegativePrompt,
        defaultParameters,
        tips,
        sortOrder: maxSort + 1,
        isActive: true,
        isDefault: false, // Custom platforms are never default
      })
      .returning();

    return NextResponse.json(newPlatform, { status: 201 });
  } catch (error) {
    console.error('Failed to create platform:', error);
    return NextResponse.json(
      { error: 'Failed to create platform' },
      { status: 500 }
    );
  }
}
