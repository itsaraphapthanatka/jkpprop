import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { buttonVariants } from './button';

/**
 * Link primitives (JKP_Property_Handoff.md).
 *
 * `TextLink`  — inline styled anchor (teal accent, underline on hover). When
 *   `external`, it opens in a new tab with safe `rel` and shows an ExternalLink
 *   affordance so the behaviour is signalled by icon + text, not colour alone.
 * `LinkButton` — an anchor that looks like a Button; shares `buttonVariants`
 *   so navigation-as-CTA stays visually identical to real buttons.
 */

export interface TextLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Opens in a new tab with safe rel + an ExternalLink icon. */
  external?: boolean;
}

export const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ className, external, target, rel, children, ...props }, ref) => (
    <a
      ref={ref}
      target={external ? target ?? '_blank' : target}
      rel={external ? rel ?? 'noopener noreferrer' : rel}
      className={cn(
        'text-accent underline-offset-4 rounded-sm outline-none',
        'hover:underline hover:text-brand-800 focus-visible:shadow-focus',
        className,
      )}
      {...props}
    >
      {children}
      {external && (
        <ExternalLink
          className="ml-0.5 inline size-3.5 align-[-0.125em]"
          strokeWidth={1.7}
          aria-hidden="true"
        />
      )}
    </a>
  ),
);
TextLink.displayName = 'TextLink';

export interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <a
      ref={ref}
      className={cn('no-underline', buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
LinkButton.displayName = 'LinkButton';
