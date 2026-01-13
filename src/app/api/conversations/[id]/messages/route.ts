import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promptConversations, conversationMessages } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENERATOR_SYSTEM_PROMPT, parseChoices, parseFinalPrompt } from '@/lib/generator/prompts';
import { withRetry } from '@/lib/db/utils';

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
    const conversation = await withRetry(() =>
      db.query.promptConversations.findFirst({
        where: and(
          eq(promptConversations.id, id),
          eq(promptConversations.userId, user.id)
        ),
      })
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = await withRetry(() =>
      db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, id))
        .orderBy(asc(conversationMessages.createdAt))
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Timeout for Gemini API calls (30 seconds)
const GEMINI_TIMEOUT_MS = 30000;

// Helper to add timeout to a promise
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
}

// POST /api/conversations/[id]/messages - Send a message and stream AI response
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  // Track if the request was aborted
  let isAborted = false;
  request.signal.addEventListener('abort', () => {
    isAborted = true;
  });

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
    const conversation = await withRetry(() =>
      db.query.promptConversations.findFirst({
        where: and(
          eq(promptConversations.id, id),
          eq(promptConversations.userId, user.id)
        ),
      })
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Save user message
    const [userMessage] = await withRetry(() =>
      db
        .insert(conversationMessages)
        .values({
          conversationId: id,
          role: 'user',
          content: content.trim(),
          selectedOptionIndex: selectedOptionIndex ?? null,
        })
        .returning()
    );

    // Get conversation history for context
    const history = await withRetry(() =>
      db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, id))
        .orderBy(asc(conversationMessages.createdAt))
    );

    // Build chat history for Gemini
    // Filter to ensure first message is from user (Gemini requirement)
    let filteredHistory = history;
    if (history.length > 0 && history[0].role === 'assistant') {
      filteredHistory = history.slice(1);
    }

    const chatHistory = filteredHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    // Create streaming response with abort handling
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Check if already aborted before starting
          if (isAborted) {
            controller.close();
            return;
          }

          const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: {
              role: 'user',
              parts: [{ text: GENERATOR_SYSTEM_PROMPT }],
            },
          });

          const chat = model.startChat({
            history: chatHistory.slice(0, -1), // Exclude the latest user message
          });

          // Add timeout to the Gemini API call
          const result = await withTimeout(
            chat.sendMessageStream(content),
            GEMINI_TIMEOUT_MS,
            'Gemini API request timed out'
          );

          let fullResponse = '';

          for await (const chunk of result.stream) {
            // Check if client disconnected
            if (isAborted) {
              console.log('Client disconnected, stopping stream');
              controller.close();
              return;
            }

            const text = chunk.text();
            fullResponse += text;

            // Send chunk to client
            const data = JSON.stringify({ text, done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Check again before saving to database
          if (isAborted) {
            controller.close();
            return;
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
          // Only send error if not aborted
          if (!isAborted) {
            const errorData = JSON.stringify({
              error: error instanceof Error ? error.message : 'Failed to generate response',
              done: true,
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }
          controller.close();
        }
      },
      cancel() {
        // Called when the client disconnects
        isAborted = true;
        console.log('Stream cancelled by client');
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
