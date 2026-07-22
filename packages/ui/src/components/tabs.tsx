'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../lib/cn';

/**
 * Tabs (JKP_Property_Handoff.md — "Tabs = 2px brand underline; active text-brand-600").
 * Underline variant over Radix Tabs: keyboard/roving-focus + aria handled by Radix.
 * Compose: <Tabs><TabsList><TabsTrigger/></TabsList><TabsContent/></Tabs>.
 */
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('inline-flex items-center border-b border-line', className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap',
      'h-10 px-4 text-sm font-medium text-content-secondary',
      'transition-colors duration-fast ease-standard outline-none',
      'rounded-t-xs hover:text-content-primary focus-visible:shadow-focus',
      'disabled:pointer-events-none disabled:opacity-50',
      // 2px brand underline indicator on the active trigger
      '-mb-px data-[state=active]:text-brand-600 data-[state=active]:border-b-2 data-[state=active]:border-brand-600',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 text-content-primary outline-none rounded-xs focus-visible:shadow-focus',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
