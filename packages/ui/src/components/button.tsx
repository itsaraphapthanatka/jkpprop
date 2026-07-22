import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Button (JKP_Property_Handoff.md — "ปุ่ม = pill เสมอ + hover lift/glow").
 * Fully pill (radius-full), weight 600, visible focus ring.
 * Variants: primary (green) | secondary (teal accent) | outline | ghost |
 * danger | link (teal). Sizes: sm (h32) | md (h40, default) | lg (h48).
 *
 * FE-0 proof-of-life primitive; full A1 spec (icon slots, loading/aria-busy,
 * icon-only aria-label) lands in FE-1.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold ' +
    'transition-all duration-fast ease-standard outline-none ' +
    'focus-visible:shadow-focus-contrast ' +
    'disabled:pointer-events-none disabled:translate-y-0 ' +
    'disabled:bg-[var(--action-disabled-bg)] disabled:text-[var(--action-disabled-text)]',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-700 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:bg-brand-800',
        secondary:
          'bg-accent text-white hover:brightness-110 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0',
        outline:
          'border border-brand-600 text-brand-600 bg-transparent hover:bg-brand-50 hover:-translate-y-0.5 active:translate-y-0 focus-visible:shadow-focus',
        ghost:
          'bg-transparent text-content-primary hover:bg-surface-muted focus-visible:shadow-focus',
        danger:
          'bg-danger text-white hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
        link: 'text-accent underline-offset-4 hover:underline focus-visible:shadow-focus',
      },
      size: {
        sm: 'h-8 px-4 text-sm',
        md: 'h-10 px-5 text-base',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
