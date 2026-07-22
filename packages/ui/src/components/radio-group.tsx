'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../lib/cn';

/**
 * RadioGroup / RadioGroupItem (JKP_Property_Handoff.md — single-select control).
 * 18px circle, brand ring + brand inner dot when selected, visible focus ring,
 * disabled muted. Wraps Radix RadioGroup for roving-tabindex keyboard nav.
 */
export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('grid gap-2', className)}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'flex size-[18px] shrink-0 items-center justify-center rounded-full border border-line bg-surface-card',
      'outline-none transition-colors duration-fast ease-standard',
      'focus-visible:shadow-focus',
      'data-[state=checked]:border-brand-600',
      'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="size-2.5 rounded-full bg-brand-600" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';
