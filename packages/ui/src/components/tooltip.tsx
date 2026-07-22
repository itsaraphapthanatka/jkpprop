'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../lib/cn';

/**
 * Tooltip (JKP_Property_Handoff.md tokens).
 * Wrappers over @radix-ui/react-tooltip. Shows on hover AND keyboard focus,
 * dismisses on blur/escape. Dark bubble uses the documented text-primary var as
 * its background (the one allowed non-token colour) with white text at `z-tooltip`.
 * delayDuration defaults to 300ms on both Provider and Root.
 *
 * Enhancement only: never put essential or action-only information in a tooltip
 * (it does not appear on touch/mobile hover) — see the story comment.
 */
export function TooltipProvider({
  delayDuration = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export function Tooltip({
  delayDuration = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root delayDuration={delayDuration} {...props} />;
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-tooltip rounded-sm bg-[var(--color-text-primary)] px-2 py-1 text-xs text-white shadow-md',
        'max-w-xs select-none',
        'transition-opacity duration-fast ease-standard',
        'data-[state=delayed-open]:opacity-100 data-[state=instant-open]:opacity-100',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
