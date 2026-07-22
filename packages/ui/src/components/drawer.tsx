'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Drawer (JKP_Property_Handoff.md — "slide from right (desktop) / bottom (mobile)").
 * Over Radix Dialog for focus trap + Esc + scrim-click. DrawerContent takes a
 * `side` prop: 'right' (default) | 'bottom'.
 */
export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

const DrawerPortal = DialogPrimitive.Portal;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-drawer bg-[var(--scrim-overlay)]', className)}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Edge the panel slides in from. */
  side?: 'right' | 'bottom';
}

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = 'right', ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-drawer flex flex-col gap-4 bg-surface-card p-6 shadow-lg outline-none',
        side === 'right' && 'right-0 top-0 h-full w-[400px] max-w-[90vw] border-l border-line',
        side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-lg border-t border-line',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Close"
        className={cn(
          'absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full',
          'text-content-secondary transition-colors duration-fast ease-standard outline-none',
          'hover:bg-surface-muted hover:text-content-primary focus-visible:shadow-focus',
          'disabled:pointer-events-none',
        )}
      >
        <X className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = DialogPrimitive.Content.displayName;

export function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pr-8 text-left', className)} {...props} />;
}
DrawerHeader.displayName = 'DrawerHeader';

export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}
DrawerFooter.displayName = 'DrawerFooter';

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-bold text-content-primary', className)}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;
