import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Badge (JKP_Property_Handoff.md) — small static pill for labels, counts and
 * taxonomy. Token-driven subtle backgrounds keep text contrast readable; neon
 * is never used as label text. For workflow state use `StatusChip` (adds a
 * leading dot so state is not colour-only).
 */
const badgeVariants = cva(
  'inline-flex items-center h-[22px] rounded-full px-2 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-muted text-content-secondary',
        brand: 'bg-brand-50 text-brand-700',
        accent: 'bg-surface-tint text-accent',
        gold: 'bg-warning-subtle text-gold',
        success: 'bg-success-subtle text-success-text',
        warning: 'bg-warning-subtle text-warning-text',
        danger: 'bg-danger-subtle text-danger-text',
        info: 'bg-info-subtle text-info-text',
        zone: 'border border-line-subtle bg-surface-muted text-content-primary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';

export { badgeVariants };
