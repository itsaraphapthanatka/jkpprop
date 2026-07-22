'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../lib/cn';

/**
 * Switch (JKP_Property_Handoff.md — immediate boolean toggle, e.g. featured /
 * license). 40x22 pill track, muted when off / brand when on, white knob that
 * slides. role="switch" + keyboard come from Radix. Visible focus ring,
 * disabled muted.
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5',
      'outline-none transition-colors duration-fast ease-standard',
      'bg-surface-muted data-[state=checked]:bg-brand-600',
      'focus-visible:shadow-focus',
      'disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block size-[18px] rounded-full bg-white shadow-sm',
        'transition-transform duration-fast ease-standard',
        'data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-[18px]',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';
