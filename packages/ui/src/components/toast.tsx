'use client';

import * as React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toast (JKP_Property_Handoff.md) — thin wrapper over `sonner`.
 *
 * `toast` is re-exported unchanged (`toast.success`, `toast.error`, …). Mount a
 * single `<Toaster />` near the app root; it is themed with design tokens
 * (card surface, line border, token radius/shadow), pinned bottom-right, with a
 * close button. Reduced-motion is respected by sonner.
 */
export { toast } from 'sonner';

export type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'bg-surface-card border border-line text-content-primary rounded-md shadow-lg',
          title: 'font-semibold',
          description: 'text-content-secondary',
          actionButton: 'bg-brand-600 text-white rounded-full',
          cancelButton: 'bg-surface-muted text-content-primary rounded-full',
          closeButton:
            'bg-surface-card border border-line text-content-secondary',
          success: 'text-success-text',
          error: 'text-danger-text',
          warning: 'text-warning-text',
          info: 'text-info-text',
        },
      }}
      {...props}
    />
  );
}
