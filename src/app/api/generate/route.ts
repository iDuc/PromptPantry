import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENERATOR_SYSTEM_PROMPT, parseChoices, parseFinalPrompt } from '@/lib/generator/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// POST /api/generate - Stateless prompt generation (no database required)
export async function POST(request: NextRequest) {
  // Track if the request was aborted
  let isAborted = false;
  request.signal.addEventListener('abort', () => {
    isAborted = true;
  });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history = [] } = body as {
      message: string;
      history: ChatMessage[];
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

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
            history: chatHistory,
          });

          // Add timeout to the Gemini API call
          const result = await withTimeout(
            chat.sendMessageStream(message),
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

          // Check again before sending completion
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

          // Send completion with metadata
          const completionData = JSON.stringify({
            done: true,
            fullResponse,
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
