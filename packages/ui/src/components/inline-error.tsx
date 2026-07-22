import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * InlineError (JKP_Property_Handoff.md) — the message that sits directly under a
 * form field. Uses role="alert" so assistive tech announces it, and pairs an
 * AlertCircle icon with the text so the error is not colour-only. Wire its `id`
 * to the field's `aria-describedby` and set `aria-invalid` on the field.
 */
export interface InlineErrorProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const InlineError = React.forwardRef<
  HTMLParagraphElement,
  InlineErrorProps
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    role="alert"
    className={cn(
      'mt-1 flex items-center gap-1 text-sm text-danger-text',
      className,
    )}
    {...props}
  >
    <AlertCircle
      className="size-4 shrink-0"
      strokeWidth={1.7}
      aria-hidden="true"
    />
    {children}
  </p>
));
InlineError.displayName = 'InlineError';
