'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSSE } from './use-sse';
import { cleanContent } from '@/lib/generator/prompts';

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  messageType?: string | null;
  suggestedOptions?: string[] | null;
  selectedOptionIndex?: number | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  status: 'active' | 'completed' | 'archived';
  finalPrompt: string | null;
  finalPromptId: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: ConversationMessage[];
}

interface UseConversationOptions {
  conversationId?: string;
  onFinalPrompt?: (prompt: string) => void;
}

interface UseConversationReturn {
  conversation: Conversation | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  error: Error | null;
  currentChoices: string[] | null;
  finalPrompt: string | null;
  createConversation: (title?: string) => Promise<Conversation | null>;
  loadConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, selectedOptionIndex?: number) => Promise<void>;
  saveToLibrary: (options: SaveOptions) => Promise<{ prompt: { id: string } } | null>;
  updateConversation: (updates: Partial<Conversation>) => Promise<void>;
}

interface SaveOptions {
  title?: string;
  categoryId?: string;
  tags?: string[];
  prompt?: string;
}

export function useConversation(options: UseConversationOptions = {}): UseConversationReturn {
  const { conversationId, onFinalPrompt } = options;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentChoices, setCurrentChoices] = useState<string[] | null>(null);
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);

  const { isStreaming, streamedText, startStream, reset: resetStream } = useSSE({
    onComplete: (data) => {
      if (data.choices) {
        setCurrentChoices(data.choices);
      }
      if (data.finalPrompt) {
        setFinalPrompt(data.finalPrompt);
        onFinalPrompt?.(data.finalPrompt);
      }
      // Refresh messages to get the saved assistant message
      if (conversation?.id) {
        loadMessages(conversation.id);
      }
    },
  });

  // Load messages from a conversation
  const loadMessages = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data);

      // Extract choices from the last assistant message
      const lastAssistantMessage = [...data]
        .reverse()
        .find((m: ConversationMessage) => m.role === 'assistant');
      if (lastAssistantMessage?.suggestedOptions) {
        setCurrentChoices(lastAssistantMessage.suggestedOptions as string[]);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  // Load conversation
  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      const data = await response.json();
      setConversation(data);
      setMessages(data.messages || []);
      if (data.finalPrompt) {
        setFinalPrompt(data.finalPrompt);
      }

      // Extract choices from the last assistant message
      const lastAssistantMessage = [...(data.messages || [])]
        .reverse()
        .find((m: ConversationMessage) => m.role === 'assistant');
      if (lastAssistantMessage?.suggestedOptions) {
        setCurrentChoices(lastAssistantMessage.suggestedOptions as string[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load conversation'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (title?: string): Promise<Conversation | null> => {
    setIsLoading(true);
    setError(null);
    resetStream();
    setCurrentChoices(null);
    setFinalPrompt(null);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      setConversation(data);

      // Load the initial message
      await loadMessages(data.id);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create conversation'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [resetStream, loadMessages]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, selectedOptionIndex?: number) => {
      if (!conversation?.id) {
        throw new Error('No active conversation');
      }

      // Clear current choices while waiting for response
      setCurrentChoices(null);

      // Optimistically add user message
      const tempUserMessage: ConversationMessage = {
        id: `temp-${Date.now()}`,
        conversationId: conversation.id,
        role: 'user',
        content,
        selectedOptionIndex: selectedOptionIndex ?? null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Start streaming
      await startStream(`/api/conversations/${conversation.id}/messages`, {
        content,
        selectedOptionIndex,
      });
    },
    [conversation?.id, startStream]
  );

  // Save to library
  const saveToLibrary = useCallback(
    async (saveOptions: SaveOptions): Promise<{ prompt: { id: string } } | null> => {
      if (!conversation?.id) {
        throw new Error('No active conversation');
      }

      try {
        const response = await fetch(`/api/conversations/${conversation.id}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveOptions),
        });

        if (!response.ok) throw new Error('Failed to save prompt');
        const data = await response.json();

        // Update conversation state
        setConversation((prev) => prev ? {
          ...prev,
          status: 'completed',
          finalPromptId: data.prompt.id,
        } : null);

        return data;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to save prompt'));
        return null;
      }
    },
    [conversation?.id]
  );

  // Update conversation
  const updateConversation = useCallback(
    async (updates: Partial<Conversation>) => {
      if (!conversation?.id) {
        throw new Error('No active conversation');
      }

      try {
        const response = await fetch(`/api/conversations/${conversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error('Failed to update conversation');
        const data = await response.json();
        setConversation(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update conversation'));
      }
    },
    [conversation?.id]
  );

  // Load initial conversation if ID provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  return {
    conversation,
    messages,
    isLoading,
    isStreaming,
    streamingText: streamedText,
    error,
    currentChoices,
    finalPrompt,
    createConversation,
    loadConversation,
    sendMessage,
    saveToLibrary,
    updateConversation,
  };
}

// Helper to get display content (without the special blocks)
export function getDisplayContent(content: string): string {
  return cleanContent(content);
}
