'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Pagination (JKP_Property_Handoff.md) — `<nav aria-label="pagination">` with
 * Prev + numbered page pills + Next. Current page is a filled brand pill with
 * `aria-current="page"`; Prev/Next disable at the bounds.
 *
 * The visible window is `siblingCount` pages on each side of the current page,
 * always plus the first and last page, with an ellipsis where the run is cut.
 */

const DOTS = 'dots' as const;

/** Inclusive integer range [start, end]. */
function range(start: number, end: number): number[] {
  const length = Math.max(end - start + 1, 0);
  return Array.from({ length }, (_, i) => start + i);
}

/**
 * Compute the page window. Returns page numbers interleaved with `DOTS`.
 * Total slots shown = siblingCount*2 + 5 (current + 2 siblings + first + last
 * + 2 ellipses). When every page fits, no ellipsis is used.
 */
export function getPaginationRange(
  totalPages: number,
  page: number,
  siblingCount = 1,
): (number | typeof DOTS)[] {
  const totalSlots = siblingCount * 2 + 5;

  // All pages fit — render them without any ellipsis.
  if (totalSlots >= totalPages) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);

  // Show a leading/trailing ellipsis only when it hides at least one page
  // (i.e. there is a gap of 2+ between the edge and the sibling window).
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  const firstPage = 1;
  const lastPage = totalPages;

  if (!showLeftDots && showRightDots) {
    const leftCount = 3 + 2 * siblingCount;
    return [...range(1, leftCount), DOTS, lastPage];
  }

  if (showLeftDots && !showRightDots) {
    const rightCount = 3 + 2 * siblingCount;
    return [firstPage, DOTS, ...range(totalPages - rightCount + 1, totalPages)];
  }

  return [
    firstPage,
    DOTS,
    ...range(leftSibling, rightSibling),
    DOTS,
    lastPage,
  ];
}

export interface PaginationProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called with the next page when the user picks one. */
  onPageChange: (page: number) => void;
  /** Pages shown on each side of the current page. Defaults to 1. */
  siblingCount?: number;
}

const itemBase =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ' +
  'transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:shadow-focus ' +
  'disabled:pointer-events-none disabled:opacity-40';

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    { page, totalPages, onPageChange, siblingCount = 1, className, ...props },
    ref,
  ) => {
    const pages = React.useMemo(
      () => getPaginationRange(totalPages, page, siblingCount),
      [totalPages, page, siblingCount],
    );

    const atStart = page <= 1;
    const atEnd = page >= totalPages;

    return (
      <nav
        ref={ref}
        aria-label="pagination"
        className={cn('flex items-center gap-1', className)}
        {...props}
      >
        <button
          type="button"
          aria-label="Go to previous page"
          disabled={atStart}
          onClick={() => onPageChange(page - 1)}
          className={cn(itemBase, 'text-content-primary hover:bg-surface-muted')}
        >
          <ChevronLeft className="size-5" strokeWidth={1.7} aria-hidden />
        </button>

        {pages.map((item, index) => {
          if (item === DOTS) {
            return (
              <span
                key={`dots-${index}`}
                className="inline-flex size-9 items-center justify-center text-content-muted"
              >
                <MoreHorizontal className="size-5" strokeWidth={1.7} aria-hidden />
                <span className="sr-only">More pages</span>
              </span>
            );
          }

          const isCurrent = item === page;
          return (
            <button
              key={item}
              type="button"
              aria-label={`Go to page ${item}`}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                itemBase,
                isCurrent
                  ? 'bg-brand-600 text-white focus-visible:shadow-focus-contrast'
                  : 'text-content-primary hover:bg-surface-muted',
              )}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Go to next page"
          disabled={atEnd}
          onClick={() => onPageChange(page + 1)}
          className={cn(itemBase, 'text-content-primary hover:bg-surface-muted')}
        >
          <ChevronRight className="size-5" strokeWidth={1.7} aria-hidden />
        </button>
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';
