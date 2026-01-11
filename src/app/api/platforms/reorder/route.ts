import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platforms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/platforms/reorder - Reorder platforms
export async function POST(request: NextRequest) {
  try {
    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds must be a non-empty array of platform IDs' },
        { status: 400 }
      );
    }

    // Update sort_order for each platform in the order provided
    const updates = orderedIds.map((id: string, index: number) =>
      db
        .update(platforms)
        .set({ sortOrder: index + 1 })
        .where(eq(platforms.id, id))
    );

    await Promise.all(updates);

    return NextResponse.json({
      message: 'Platforms reordered successfully',
      count: orderedIds.length
    });
  } catch (error) {
    console.error('Failed to reorder platforms:', error);
    return NextResponse.json(
      { error: 'Failed to reorder platforms' },
      { status: 500 }
    );
  }
}
