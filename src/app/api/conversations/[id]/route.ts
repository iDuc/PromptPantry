import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promptConversations, conversationMessages } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/conversations/[id] - Get a conversation with all messages
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await db.query.promptConversations.findFirst({
      where: and(
        eq(promptConversations.id, id),
        eq(promptConversations.userId, user.id)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get all messages for this conversation
    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, id))
      .orderBy(asc(conversationMessages.createdAt));

    return NextResponse.json({
      ...conversation,
      messages,
    });
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update conversation (title, status)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify ownership
    const existing = await db.query.promptConversations.findFirst({
      where: and(
        eq(promptConversations.id, id),
        eq(promptConversations.userId, user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.status !== undefined) updateData.status = body.status;

    const [updated] = await db
      .update(promptConversations)
      .set(updateData)
      .where(eq(promptConversations.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await db.query.promptConversations.findFirst({
      where: and(
        eq(promptConversations.id, id),
        eq(promptConversations.userId, user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Messages will be cascade deleted
    await db.delete(promptConversations).where(eq(promptConversations.id, id));

    return NextResponse.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
