import * as React from 'react';
import { cn } from '../lib/cn';
import { Badge } from './badge';

/**
 * StatusChip (JKP_Property_Handoff.md) — workflow-state chip = Badge + a leading
 * dot + text. The dot means state is conveyed by shape/position, never colour
 * alone. Tone maps directly onto a Badge variant plus a matching dot colour.
 */
export type StatusTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'brand';

const dotByTone: Record<StatusTone, string> = {
  neutral: 'bg-content-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  brand: 'bg-brand-600',
};

export interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  children: React.ReactNode;
}

export const StatusChip = React.forwardRef<HTMLSpanElement, StatusChipProps>(
  ({ className, tone = 'neutral', children, ...props }, ref) => (
    <Badge ref={ref} variant={tone} className={cn('gap-1.5', className)} {...props}>
      <span
        className={cn('size-1.5 shrink-0 rounded-full', dotByTone[tone])}
        aria-hidden="true"
      />
      {children}
    </Badge>
  ),
);
StatusChip.displayName = 'StatusChip';
