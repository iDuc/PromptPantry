import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENERATOR_SYSTEM_PROMPT, parseChoices, parseFinalPrompt } from '@/lib/generator/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// POST /api/generate - Stateless prompt generation (no database required)
export async function POST(request: NextRequest) {
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

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

          const chat = model.startChat({
            history: chatHistory,
            systemInstruction: GENERATOR_SYSTEM_PROMPT,
          });

          const result = await chat.sendMessageStream(message);
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
