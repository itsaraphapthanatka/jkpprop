import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Skeleton / SkeletonText (JKP_Property_Handoff.md) — loading placeholders.
 * `animate-pulse` is stilled globally under prefers-reduced-motion. Skeletons
 * are decorative, so they are hidden from assistive tech (`aria-hidden`); pair
 * them with an accessible loading status elsewhere in the region.
 */
export const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn('animate-pulse rounded-md bg-surface-muted', className)}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

export interface SkeletonTextProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of lines to render. */
  lines?: number;
}

export const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ className, lines = 3, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 && 'w-3/5')}
        />
      ))}
    </div>
  ),
);
SkeletonText.displayName = 'SkeletonText';
