import * as React from 'react';
import { SearchX, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * EmptyState (JKP_Property_Handoff.md) — centred placeholder for "no results",
 * "no data yet" and error views. Always offer a way forward via `actions`
 * (e.g. clear filters + submit a requirement). `variant` picks a default icon
 * and tint when no custom `icon` is supplied.
 */
export type EmptyStateVariant = 'search' | 'data' | 'error';

const variantConfig: Record<
  EmptyStateVariant,
  { Icon: typeof SearchX; iconWrap: string }
> = {
  search: { Icon: SearchX, iconWrap: 'bg-surface-muted text-content-muted' },
  data: { Icon: Inbox, iconWrap: 'bg-surface-muted text-content-muted' },
  error: { Icon: AlertCircle, iconWrap: 'bg-danger-subtle text-danger-text' },
};

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: EmptyStateVariant;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon, title, description, actions, variant = 'search', ...props },
    ref,
  ) => {
    const { Icon, iconWrap } = variantConfig[variant];
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto flex max-w-content flex-col items-center gap-4 px-4 py-12 text-center',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'flex size-14 items-center justify-center rounded-full',
            iconWrap,
          )}
        >
          {icon ?? <Icon className="size-7" strokeWidth={1.7} aria-hidden="true" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-content-primary">{title}</h3>
          {description && (
            <p className="max-w-narrow text-sm text-content-secondary">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {actions}
          </div>
        )}
      </div>
    );
  },
);
EmptyState.displayName = 'EmptyState';
