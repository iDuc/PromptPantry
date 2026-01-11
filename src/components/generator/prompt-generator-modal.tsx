'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChatInterface } from './chat-interface';
import { useConversation } from '@/hooks/use-conversation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PromptGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId?: string;
}

export function PromptGeneratorModal({
  open,
  onOpenChange,
  conversationId: initialConversationId,
}: PromptGeneratorModalProps) {
  const router = useRouter();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [promptToSave, setPromptToSave] = useState<string | null>(null);

  const {
    conversation,
    messages,
    isLoading,
    isStreaming,
    streamingText,
    currentChoices,
    createConversation,
    loadConversation,
    sendMessage,
    saveToLibrary,
  } = useConversation({
    conversationId: initialConversationId,
  });

  // Create or load conversation when modal opens
  useEffect(() => {
    if (open) {
      if (initialConversationId) {
        loadConversation(initialConversationId);
      } else if (!conversation) {
        createConversation();
      }
    }
  }, [open, initialConversationId, conversation, createConversation, loadConversation]);

  const handleSendMessage = useCallback(
    async (message: string, optionIndex?: number) => {
      try {
        await sendMessage(message, optionIndex);
      } catch (error) {
        toast.error('Failed to send message. Please try again.');
      }
    },
    [sendMessage]
  );

  const handleCopyPrompt = useCallback(() => {
    toast.success('Prompt copied to clipboard');
  }, []);

  const handleSavePrompt = useCallback((prompt: string) => {
    setPromptToSave(prompt);
    setSaveTitle('');
    setShowSaveDialog(true);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    if (!promptToSave) return;

    try {
      const result = await saveToLibrary({
        title: saveTitle || 'Generated Prompt',
        prompt: promptToSave,
      });

      if (result?.prompt) {
        toast.success('Prompt saved to your library');
        setShowSaveDialog(false);
        onOpenChange(false);
        router.push(`/prompts/${result.prompt.id}`);
      }
    } catch (error) {
      toast.error('Failed to save prompt');
    }
  }, [promptToSave, saveTitle, saveToLibrary, onOpenChange, router]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'max-w-2xl h-[85vh] max-h-[700px]',
            'p-0 gap-0 flex flex-col',
            'sm:rounded-xl overflow-hidden'
          )}
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                Prompt Generator
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Interface */}
          {isLoading && !conversation ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChatInterface
              messages={messages}
              isStreaming={isStreaming}
              streamingText={streamingText}
              currentChoices={currentChoices}
              onSendMessage={handleSendMessage}
              onSavePrompt={handleSavePrompt}
              onCopyPrompt={handleCopyPrompt}
              className="flex-1 min-h-0"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Library</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Give your prompt a name..."
              />
            </div>
            {promptToSave && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 bg-muted rounded-md text-sm font-mono line-clamp-4">
                  {promptToSave}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>
              Save to Library
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
