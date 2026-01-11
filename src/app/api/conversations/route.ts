import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promptConversations, conversationMessages } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { withRetry } from '@/lib/db/utils';

// GET /api/conversations - List all conversations for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active' | 'completed' | 'archived' | null
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let conditions = [eq(promptConversations.userId, user.id)];

    if (status) {
      conditions.push(eq(promptConversations.status, status));
    }

    const conversations = await db
      .select({
        id: promptConversations.id,
        title: promptConversations.title,
        status: promptConversations.status,
        finalPrompt: promptConversations.finalPrompt,
        createdAt: promptConversations.createdAt,
        updatedAt: promptConversations.updatedAt,
      })
      .from(promptConversations)
      .where(and(...conditions))
      .orderBy(desc(promptConversations.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    const [conversation] = await withRetry(async () => {
      return await db
        .insert(promptConversations)
        .values({
          userId: user.id,
          title: title || 'New Conversation',
          status: 'active',
        })
        .returning();
    });

    // Add initial assistant message
    await withRetry(async () => {
      return await db.insert(conversationMessages).values({
        conversationId: conversation.id,
        role: 'assistant',
        content: "What kind of image would you like to create? Tell me about your idea, even if it's just rough.",
        messageType: 'question',
        suggestedOptions: [
          'Portrait photography',
          'Landscape scene',
          'Product shot',
          'Abstract art',
        ],
      });
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
