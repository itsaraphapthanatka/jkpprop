'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../lib/cn';

/**
 * Popover (JKP_Property_Handoff.md tokens).
 * Thin styled wrappers over @radix-ui/react-popover (shadcn pattern).
 * Floating surface on `bg-surface-card` at `z-popover` with the card border/shadow.
 * Radix supplies positioning, focus management and dismiss behaviour.
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-popover rounded-lg border border-line bg-surface-card p-4 text-content-primary shadow-lg outline-none',
        // Keep the entrance/exit simple: opacity transition works without an
        // animation plugin; the animate-* hints match the shadcn convention.
        'transition-opacity duration-fast ease-standard',
        'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
