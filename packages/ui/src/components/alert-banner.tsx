'use client';

import * as React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * AlertBanner (JKP_Property_Handoff.md) — inline, in-flow status message.
 *
 * Each variant pairs a subtle tinted surface with a leading icon so meaning is
 * icon + text, not colour alone. `danger` uses role="alert" (assertive);
 * others use role="status". Optionally dismissible — dismissing hides the
 * banner and fires `onDismiss`.
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const variantConfig: Record<
  AlertVariant,
  { icon: LucideIcon; container: string; iconColor: string }
> = {
  info: {
    icon: Info,
    container: 'bg-info-subtle border-info text-info-text',
    iconColor: 'text-info',
  },
  success: {
    icon: CheckCircle2,
    container: 'bg-success-subtle border-success text-success-text',
    iconColor: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    container: 'bg-warning-subtle border-warning text-warning-text',
    iconColor: 'text-warning',
  },
  danger: {
    icon: XCircle,
    container: 'bg-danger-subtle border-danger text-danger-text',
    iconColor: 'text-danger',
  },
};

export interface AlertBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  (
    { className, variant, title, children, dismissible, onDismiss, ...props },
    ref,
  ) => {
    const [open, setOpen] = React.useState(true);
    if (!open) return null;

    const { icon: Icon, container, iconColor } = variantConfig[variant];

    const handleDismiss = () => {
      setOpen(false);
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        role={variant === 'danger' ? 'alert' : 'status'}
        className={cn('flex gap-3 rounded-md border p-4', container, className)}
        {...props}
      >
        <Icon
          className={cn('mt-0.5 size-5 shrink-0', iconColor)}
          strokeWidth={1.7}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold">{title}</p>}
          {children && (
            <div className={cn('text-sm', title && 'mt-0.5')}>{children}</div>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            aria-label="ปิดข้อความแจ้งเตือน"
            onClick={handleDismiss}
            className="-m-1 shrink-0 rounded-sm p-1 outline-none transition-opacity duration-fast hover:opacity-70 focus-visible:shadow-focus"
          >
            <X className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);
AlertBanner.displayName = 'AlertBanner';
