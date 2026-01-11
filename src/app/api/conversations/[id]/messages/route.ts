import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promptConversations, conversationMessages } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENERATOR_SYSTEM_PROMPT, parseChoices, parseFinalPrompt } from '@/lib/generator/prompts';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// GET /api/conversations/[id]/messages - Get all messages for a conversation
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

    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, id))
      .orderBy(asc(conversationMessages.createdAt));

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message and stream AI response
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
    const { content, selectedOptionIndex } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

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

    // Save user message
    const [userMessage] = await db
      .insert(conversationMessages)
      .values({
        conversationId: id,
        role: 'user',
        content: content.trim(),
        selectedOptionIndex: selectedOptionIndex ?? null,
      })
      .returning();

    // Get conversation history for context
    const history = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, id))
      .orderBy(asc(conversationMessages.createdAt));

    // Build chat history for Gemini
    const chatHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

          const chat = model.startChat({
            history: chatHistory.slice(0, -1), // Exclude the latest user message
            systemInstruction: GENERATOR_SYSTEM_PROMPT,
          });

          const result = await chat.sendMessageStream(content);
          let fullResponse = '';

          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;

            // Send chunk to client
            const data = JSON.stringify({ text, done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Parse the full response for choices and final prompt
          const choices = parseChoices(fullResponse);
          const finalPrompt = parseFinalPrompt(fullResponse);

          // Determine message type
          let messageType: string | null = null;
          if (finalPrompt) {
            messageType = 'final_prompt';
          } else if (choices && choices.length > 0) {
            messageType = 'question';
          } else {
            messageType = 'suggestion';
          }

          // Save assistant response to database
          const [assistantMessage] = await db
            .insert(conversationMessages)
            .values({
              conversationId: id,
              role: 'assistant',
              content: fullResponse,
              messageType,
              suggestedOptions: choices,
            })
            .returning();

          // If final prompt detected, update conversation
          if (finalPrompt) {
            await db
              .update(promptConversations)
              .set({
                finalPrompt,
                status: 'completed',
                updatedAt: new Date(),
              })
              .where(eq(promptConversations.id, id));
          } else {
            // Just update the timestamp
            await db
              .update(promptConversations)
              .set({ updatedAt: new Date() })
              .where(eq(promptConversations.id, id));
          }

          // Send completion with metadata
          const completionData = JSON.stringify({
            done: true,
            messageId: assistantMessage.id,
            choices,
            finalPrompt,
            messageType,
          });
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            error: 'Failed to generate response',
            done: true,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
