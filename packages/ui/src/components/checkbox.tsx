'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Checkbox (JKP_Property_Handoff.md — selection control).
 * 18px box, brand-filled when checked (lucide Check) or indeterminate (Minus),
 * visible focus ring, disabled muted. State conveyed by icon + fill, not color
 * alone. Wraps Radix Checkbox for keyboard + aria.
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'group peer flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border border-line bg-surface-card',
      'outline-none transition-colors duration-fast ease-standard',
      'focus-visible:shadow-focus',
      'data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 data-[state=checked]:text-white',
      'data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:bg-brand-600 data-[state=indeterminate]:text-white',
      'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check
        className="size-3.5 group-data-[state=indeterminate]:hidden"
        strokeWidth={1.7}
      />
      <Minus
        className="hidden size-3.5 group-data-[state=indeterminate]:block"
        strokeWidth={1.7}
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';
