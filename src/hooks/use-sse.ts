'use client';

import { useCallback, useRef, useState } from 'react';

interface SSEMessage {
  text?: string;
  done?: boolean;
  error?: string;
  messageId?: string;
  choices?: string[];
  finalPrompt?: string | null;
  messageType?: string;
}

interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: (message: SSEMessage) => void;
}

interface UseSSEReturn {
  isStreaming: boolean;
  streamedText: string;
  error: Error | null;
  startStream: (url: string, body: unknown) => Promise<void>;
  stopStream: () => void;
  reset: () => void;
}

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const { onMessage, onError, onComplete } = options;
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (url: string, body: unknown) => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset state
      setIsStreaming(true);
      setStreamedText('');
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep incomplete message in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as SSEMessage;

                if (data.error) {
                  const err = new Error(data.error);
                  setError(err);
                  onError?.(err);
                  continue;
                }

                if (data.text && !data.done) {
                  setStreamedText((prev) => prev + data.text);
                  onMessage?.(data);
                }

                if (data.done) {
                  onComplete?.(data);
                }
              } catch {
                // Ignore parsing errors for partial data
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Stream was intentionally aborted
          return;
        }
        const error = err instanceof Error ? err : new Error('Stream failed');
        setError(error);
        onError?.(error);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [onMessage, onError, onComplete]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setStreamedText('');
    setError(null);
  }, [stopStream]);

  return {
    isStreaming,
    streamedText,
    error,
    startStream,
    stopStream,
    reset,
  };
}
