'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { StarterCards } from './starter-cards';
import { cn } from '@/lib/utils';
import { STARTER_SUGGESTIONS, cleanContent } from '@/lib/generator/prompts';
import type { ConversationMessage } from '@/hooks/use-conversation';

interface ChatInterfaceProps {
  messages: ConversationMessage[];
  isStreaming: boolean;
  streamingText: string;
  currentChoices: string[] | null;
  onSendMessage: (message: string, optionIndex?: number) => void;
  onSavePrompt: (prompt: string) => void;
  onCopyPrompt: (prompt: string) => void;
  showStarters?: boolean;
  className?: string;
}

export function ChatInterface({
  messages,
  isStreaming,
  streamingText,
  currentChoices,
  onSendMessage,
  onSavePrompt,
  onCopyPrompt,
  showStarters = true,
  className,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleStarterSelect = (suggestion: typeof STARTER_SUGGESTIONS[0]) => {
    onSendMessage(suggestion.initialPrompt);
  };

  const handleChoiceSelect = (choice: string, index: number) => {
    // Remove emoji prefix if present for cleaner message
    const cleanChoice = choice.replace(/^[\p{Emoji}\s]+/u, '').trim() || choice;
    onSendMessage(cleanChoice, index);
  };

  const showStarterCards = showStarters && messages.length <= 1;

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-2">
        <div className="space-y-2 py-4">
          {/* Starter Cards - shown at beginning */}
          {showStarterCards && (
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Choose a starting point or describe your idea
              </p>
              <StarterCards onSelect={handleStarterSelect} />
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            const isLastAssistant =
              message.role === 'assistant' &&
              index === messages.length - 1;

            return (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                suggestedOptions={
                  isLastAssistant && !isStreaming
                    ? currentChoices ?? (message.suggestedOptions as string[] | null)
                    : null
                }
                showChoices={isLastAssistant && !isStreaming}
                onChoiceSelect={handleChoiceSelect}
                onSavePrompt={onSavePrompt}
                onCopyPrompt={onCopyPrompt}
              />
            );
          })}

          {/* Streaming Message */}
          {isStreaming && streamingText && (
            <ChatMessage
              role="assistant"
              content={streamingText}
              isStreaming={true}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/50 p-4 bg-background/80 backdrop-blur-sm">
        <ChatInput
          onSend={(message) => onSendMessage(message)}
          disabled={isStreaming}
          placeholder={
            showStarterCards
              ? 'Describe what you want to create...'
              : 'Type your response...'
          }
        />
      </div>
    </div>
  );
}
