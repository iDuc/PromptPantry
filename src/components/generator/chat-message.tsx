'use client';

import { cn } from '@/lib/utils';
import { QuickChoiceButtons } from './quick-choice-buttons';
import { cleanContent, parseFinalPrompt } from '@/lib/generator/prompts';
import { FinalPromptCard } from './final-prompt-card';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  suggestedOptions?: string[] | null;
  isStreaming?: boolean;
  onChoiceSelect?: (choice: string, index: number) => void;
  onSavePrompt?: (prompt: string) => void;
  onCopyPrompt?: (prompt: string) => void;
  showChoices?: boolean;
}

export function ChatMessage({
  role,
  content,
  suggestedOptions,
  isStreaming = false,
  onChoiceSelect,
  onSavePrompt,
  onCopyPrompt,
  showChoices = true,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const displayContent = cleanContent(content);
  const finalPrompt = parseFinalPrompt(content);

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-muted/30' : 'bg-transparent'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap break-words">
            {displayContent}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />
            )}
          </p>
        </div>

        {/* Final Prompt Card */}
        {finalPrompt && !isStreaming && (
          <FinalPromptCard
            prompt={finalPrompt}
            onSave={() => onSavePrompt?.(finalPrompt)}
            onCopy={() => onCopyPrompt?.(finalPrompt)}
          />
        )}

        {/* Quick Choice Buttons */}
        {!isUser && showChoices && suggestedOptions && suggestedOptions.length > 0 && !isStreaming && (
          <QuickChoiceButtons
            choices={suggestedOptions}
            onSelect={(choice, index) => onChoiceSelect?.(choice, index)}
            className="mt-3"
          />
        )}
      </div>
    </div>
  );
}
