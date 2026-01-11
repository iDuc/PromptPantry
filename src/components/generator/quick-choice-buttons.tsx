'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickChoiceButtonsProps {
  choices: string[];
  onSelect: (choice: string, index: number) => void;
  disabled?: boolean;
  className?: string;
}

export function QuickChoiceButtons({
  choices,
  onSelect,
  disabled = false,
  className,
}: QuickChoiceButtonsProps) {
  if (!choices || choices.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {choices.map((choice, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(choice, index)}
          className={cn(
            'h-auto py-2 px-3 text-left whitespace-normal',
            'border-border/50 hover:border-primary/50 hover:bg-primary/5',
            'transition-all duration-200',
            'max-w-[200px] text-sm'
          )}
        >
          {choice}
        </Button>
      ))}
    </div>
  );
}
