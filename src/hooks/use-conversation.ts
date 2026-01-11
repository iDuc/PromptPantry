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

      // For local conversations, add the assistant message locally
      if (conversation?.id?.startsWith('local-') && data.fullResponse) {
        const assistantMessage: ConversationMessage = {
          id: `msg-${Date.now()}`,
          conversationId: conversation.id,
          role: 'assistant',
          content: data.fullResponse,
          messageType: data.messageType,
          suggestedOptions: data.choices,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (conversation?.id && !conversation.id.startsWith('local-')) {
        // Refresh messages to get the saved assistant message from database
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

  // Create new conversation (with fallback to stateless mode)
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

      if (!response.ok) {
        // Fall back to stateless mode - create a local conversation
        console.log('Falling back to stateless mode');
        const localConversation: Conversation = {
          id: `local-${Date.now()}`,
          userId: 'local',
          title: title || 'New Conversation',
          status: 'active',
          finalPrompt: null,
          finalPromptId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setConversation(localConversation);

        // Add initial assistant message locally
        const initialMessage: ConversationMessage = {
          id: `msg-${Date.now()}`,
          conversationId: localConversation.id,
          role: 'assistant',
          content: "What kind of image would you like to create? Tell me about your idea, even if it's just rough.",
          messageType: 'question',
          suggestedOptions: [
            'Portrait photography',
            'Landscape scene',
            'Product shot',
            'Abstract art',
          ],
          createdAt: new Date().toISOString(),
        };
        setMessages([initialMessage]);
        setCurrentChoices(initialMessage.suggestedOptions as string[]);

        return localConversation;
      }

      const data = await response.json();
      setConversation(data);

      // Load the initial message
      await loadMessages(data.id);

      return data;
    } catch (err) {
      // Fall back to stateless mode on any error
      console.log('Falling back to stateless mode due to error:', err);
      const localConversation: Conversation = {
        id: `local-${Date.now()}`,
        userId: 'local',
        title: title || 'New Conversation',
        status: 'active',
        finalPrompt: null,
        finalPromptId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversation(localConversation);

      // Add initial assistant message locally
      const initialMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        conversationId: localConversation.id,
        role: 'assistant',
        content: "What kind of image would you like to create? Tell me about your idea, even if it's just rough.",
        messageType: 'question',
        suggestedOptions: [
          'Portrait photography',
          'Landscape scene',
          'Product shot',
          'Abstract art',
        ],
        createdAt: new Date().toISOString(),
      };
      setMessages([initialMessage]);
      setCurrentChoices(initialMessage.suggestedOptions as string[]);

      return localConversation;
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

      // Check if this is a local (stateless) conversation
      if (conversation.id.startsWith('local-')) {
        // Use stateless API with message history
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        await startStream('/api/generate', {
          message: content,
          history,
        });
      } else {
        // Use database-backed conversation API
        await startStream(`/api/conversations/${conversation.id}/messages`, {
          content,
          selectedOptionIndex,
        });
      }
    },
    [conversation?.id, messages, startStream]
  );

  // Save to library
  const saveToLibrary = useCallback(
    async (saveOptions: SaveOptions): Promise<{ prompt: { id: string } } | null> => {
      if (!conversation?.id) {
        throw new Error('No active conversation');
      }

      try {
        // For local conversations, create the prompt directly
        if (conversation.id.startsWith('local-')) {
          const promptToSave = saveOptions.prompt || finalPrompt;
          if (!promptToSave) {
            throw new Error('No prompt to save');
          }

          const response = await fetch('/api/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: saveOptions.title || 'Generated Prompt',
              basePrompt: promptToSave,
              categoryId: saveOptions.categoryId,
              tags: saveOptions.tags || [],
            }),
          });

          if (!response.ok) throw new Error('Failed to save prompt');
          const data = await response.json();

          // Update conversation state
          setConversation((prev) => prev ? {
            ...prev,
            status: 'completed',
            finalPromptId: data.id,
          } : null);

          return { prompt: data };
        }

        // For database-backed conversations, use the finalize endpoint
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
    [conversation?.id, finalPrompt]
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
