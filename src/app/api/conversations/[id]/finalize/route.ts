import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promptConversations, prompts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/conversations/[id]/finalize - Create a prompt from conversation
export async function POST(
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
    const { title, categoryId, tags, prompt: customPrompt } = body;

    // Verify conversation ownership
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

    // Use custom prompt or the conversation's final prompt
    const finalPromptText = customPrompt || conversation.finalPrompt;

    if (!finalPromptText) {
      return NextResponse.json(
        { error: 'No final prompt found. Continue the conversation to generate one.' },
        { status: 400 }
      );
    }

    // Create the prompt in the library
    const [newPrompt] = await db
      .insert(prompts)
      .values({
        title: title || conversation.title || 'Generated Prompt',
        basePrompt: finalPromptText,
        categoryId: categoryId || null,
        tags: tags || [],
        isFavorite: false,
        isArchived: false,
        useCount: 0,
      })
      .returning();

    // Link the conversation to the created prompt
    await db
      .update(promptConversations)
      .set({
        finalPromptId: newPrompt.id,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(promptConversations.id, id));

    return NextResponse.json({
      prompt: newPrompt,
      conversation: {
        ...conversation,
        finalPromptId: newPrompt.id,
        status: 'completed',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to finalize conversation:', error);
    return NextResponse.json(
      { error: 'Failed to finalize conversation' },
      { status: 500 }
    );
  }
}
