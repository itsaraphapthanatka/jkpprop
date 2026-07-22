'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Breadcrumbs (JKP_Property_Handoff.md — Listing/Detail crumb trail).
 * Mirrors the canonical route so it can back a BreadcrumbList schema. The last
 * item is the current page (aria-current="page"), rendered as text, not a link.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.ComponentPropsWithoutRef<'nav'> {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, className, ...props }, ref) => (
    <nav ref={ref} aria-label="breadcrumb" className={cn('text-sm', className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className={cn(
                    'rounded-xs text-content-secondary outline-none',
                    'transition-colors duration-fast ease-standard',
                    'hover:text-accent focus-visible:shadow-focus',
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    isLast ? 'font-medium text-content-primary' : 'text-content-secondary',
                  )}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="size-4 shrink-0 text-content-muted"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  ),
);
Breadcrumbs.displayName = 'Breadcrumbs';
