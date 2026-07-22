import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * IconButton (JKP_Property_Handoff.md) — square, fully-round icon-only control.
 *
 * `aria-label` is REQUIRED: an icon-only control has no accessible text
 * otherwise. Visual sizes are 32/40/48 (icon 16/20/24) but a mobile-only
 * invisible ::before expands the hit target to ≥44px so touch stays reliable.
 */
const iconButtonVariants = cva(
  'relative inline-flex items-center justify-center rounded-full ' +
    'transition-all duration-fast ease-standard outline-none [&_svg]:shrink-0 ' +
    "before:absolute before:left-1/2 before:top-1/2 before:size-11 before:content-[''] " +
    'before:-translate-x-1/2 before:-translate-y-1/2 sm:before:hidden ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost:
          'bg-transparent text-content-primary hover:bg-surface-muted focus-visible:shadow-focus',
        outline:
          'border border-line bg-transparent text-content-primary hover:bg-surface-muted focus-visible:shadow-focus',
        solid:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:shadow-focus-contrast',
      },
      size: {
        sm: 'size-8 [&_svg]:size-4',
        md: 'size-10 [&_svg]:size-5',
        lg: 'size-12 [&_svg]:size-6',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>,
    VariantProps<typeof iconButtonVariants> {
  /** Required — the accessible name for this icon-only control. */
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = 'IconButton';

export { iconButtonVariants };
