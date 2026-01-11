'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { STARTER_SUGGESTIONS } from '@/lib/generator/prompts';

interface StarterCardsProps {
  onSelect: (suggestion: typeof STARTER_SUGGESTIONS[0]) => void;
  className?: string;
}

export function StarterCards({ onSelect, className }: StarterCardsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-3', className)}>
      {STARTER_SUGGESTIONS.map((suggestion) => (
        <Card
          key={suggestion.id}
          className={cn(
            'p-4 cursor-pointer',
            'border-border/50 hover:border-primary/50',
            'bg-card/50 hover:bg-card',
            'transition-all duration-200',
            'group'
          )}
          onClick={() => onSelect(suggestion)}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
              {suggestion.icon}
            </span>
            <div>
              <h3 className="font-medium text-sm">{suggestion.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {suggestion.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
