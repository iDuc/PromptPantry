'use client';

import * as React from 'react';
import { Drawer } from 'vaul';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Snap points for mobile drawer (default: [0.9, 1]) */
  snapPoints?: number[];
  /** Whether to allow dismissing via backdrop/swipe when form has data */
  dismissible?: boolean;
}

interface ResponsiveDialogContextValue {
  isMobile: boolean;
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue>({
  isMobile: false,
});

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  snapPoints = [0.9, 1],
  dismissible = true,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value={{ isMobile: true }}>
        <Drawer.Root
          open={open}
          onOpenChange={onOpenChange}
          snapPoints={snapPoints}
          dismissible={dismissible}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Drawer.Content
              className={cn(
                'fixed inset-x-0 bottom-0 z-50',
                'flex flex-col',
                'max-h-[96vh]',
                'bg-background',
                'rounded-t-2xl',
                'border-t border-border',
                'outline-none'
              )}
            >
              {/* Drawer handle */}
              <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
              {children}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {children}
        </DialogContent>
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogHeader({
  children,
  className,
}: ResponsiveDialogHeaderProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <div className={cn('px-4 pt-2 pb-4 border-b border-border', className)}>
        {children}
      </div>
    );
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogTitle({
  children,
  className,
}: ResponsiveDialogTitleProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
    );
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogDescription({
  children,
  className,
}: ResponsiveDialogDescriptionProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <p className={cn('text-sm text-muted-foreground mt-1', className)}>
        {children}
      </p>
    );
  }

  return (
    <DialogDescription className={className}>{children}</DialogDescription>
  );
}

interface ResponsiveDialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogBody({
  children,
  className,
}: ResponsiveDialogBodyProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  return (
    <div
      className={cn(
        isMobile ? 'flex-1 overflow-y-auto px-4 py-4' : 'py-4',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDialogFooter({
  children,
  className,
}: ResponsiveDialogFooterProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <div
        className={cn(
          'flex flex-col-reverse gap-3 px-4 py-4 border-t border-border bg-background pb-safe',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}
