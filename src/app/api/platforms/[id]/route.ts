import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platforms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/platforms/[id] - Get a single platform
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const platform = await db.query.platforms.findFirst({
      where: eq(platforms.id, id),
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(platform);
  } catch (error) {
    console.error('Failed to fetch platform:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform' },
      { status: 500 }
    );
  }
}

// PATCH /api/platforms/[id] - Update a platform
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Check if platform exists
    const existing = await db.query.platforms.findFirst({
      where: eq(platforms.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    // If changing slug, check for uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await db.query.platforms.findFirst({
        where: eq(platforms.slug, body.slug),
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Platform with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.optimizationPrompt !== undefined) updateData.optimizationPrompt = body.optimizationPrompt;
    if (body.supportsNegativePrompt !== undefined) updateData.supportsNegativePrompt = body.supportsNegativePrompt;
    if (body.defaultParameters !== undefined) updateData.defaultParameters = body.defaultParameters;
    if (body.tips !== undefined) updateData.tips = body.tips;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    const [updatedPlatform] = await db
      .update(platforms)
      .set(updateData)
      .where(eq(platforms.id, id))
      .returning();

    return NextResponse.json(updatedPlatform);
  } catch (error) {
    console.error('Failed to update platform:', error);
    return NextResponse.json(
      { error: 'Failed to update platform' },
      { status: 500 }
    );
  }
}

// DELETE /api/platforms/[id] - Delete a platform (soft delete for defaults)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const platform = await db.query.platforms.findFirst({
      where: eq(platforms.id, id),
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    // System default platforms can only be deactivated, not deleted
    if (platform.isDefault) {
      await db
        .update(platforms)
        .set({ isActive: false })
        .where(eq(platforms.id, id));

      return NextResponse.json({
        message: 'System platform deactivated (cannot be deleted)',
        deactivated: true
      });
    }

    // Custom platforms can be permanently deleted
    await db.delete(platforms).where(eq(platforms.id, id));

    return NextResponse.json({ message: 'Platform deleted', deleted: true });
  } catch (error) {
    console.error('Failed to delete platform:', error);
    return NextResponse.json(
      { error: 'Failed to delete platform' },
      { status: 500 }
    );
  }
}
