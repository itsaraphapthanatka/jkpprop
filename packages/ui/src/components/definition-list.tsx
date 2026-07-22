import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * DefinitionList / KeyValueGrid (JKP_Property_Handoff.md) — term/value pairs for
 * detail specs. Items whose value is null / undefined / '' are omitted entirely
 * (no "-" placeholder), so callers can pass sparse records straight through.
 */

/** Values that should not render a row at all. `0` and `false` are kept. */
function isEmpty(value: React.ReactNode): boolean {
  return value === null || value === undefined || value === '';
}

export interface DefinitionListItem {
  term: string;
  definition: React.ReactNode;
}

export interface DefinitionListProps
  extends React.HTMLAttributes<HTMLDListElement> {
  items: DefinitionListItem[];
}

export const DefinitionList = React.forwardRef<
  HTMLDListElement,
  DefinitionListProps
>(({ items, className, ...props }, ref) => {
  const visible = items.filter((item) => !isEmpty(item.definition));

  return (
    <dl
      ref={ref}
      className={cn(
        'grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]',
        className,
      )}
      {...props}
    >
      {visible.map((item, index) => (
        <React.Fragment key={index}>
          <dt className="text-sm text-content-secondary">{item.term}</dt>
          <dd className="text-sm text-content-primary sm:text-right">
            {item.definition}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
});
DefinitionList.displayName = 'DefinitionList';

export interface KeyValueGridItem {
  label: string;
  value: React.ReactNode;
}

export interface KeyValueGridProps
  extends React.HTMLAttributes<HTMLDListElement> {
  items: KeyValueGridItem[];
}

/**
 * Responsive strip of label + value stat cells for quick-specs (beds / baths /
 * area / …). 2 columns on mobile, 4 from md up; empty values are omitted.
 */
export const KeyValueGrid = React.forwardRef<
  HTMLDListElement,
  KeyValueGridProps
>(({ items, className, ...props }, ref) => {
  const visible = items.filter((item) => !isEmpty(item.value));

  return (
    <dl
      ref={ref}
      className={cn('grid grid-cols-2 gap-4 md:grid-cols-4', className)}
      {...props}
    >
      {visible.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-1 rounded-md bg-surface-alt px-4 py-3"
        >
          <dt className="text-xs text-content-secondary">{item.label}</dt>
          <dd className="text-lg font-semibold text-content-primary">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
});
KeyValueGrid.displayName = 'KeyValueGrid';
