'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import { Label } from './label';

/**
 * TextInput (JKP_Property_Handoff.md — input pattern).
 * h-10 rounded-md field with label above, brand focus ring, error state wired
 * via aria-invalid + aria-describedby, optional hint, and leading/trailing
 * icon slots. Generates an id when none is supplied so the label associates.
 */
export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerClassName?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      leadingIcon,
      trailingIcon,
      containerClassName,
      className,
      disabled,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);

    const describedBy =
      [
        ariaDescribedBy,
        hint ? hintId : undefined,
        hasError ? errorId : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label ? <Label htmlFor={inputId}>{label}</Label> : null}
        <div className="relative">
          {leadingIcon ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-content-muted"
            >
              {leadingIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cn(
              'h-10 w-full rounded-md border border-line bg-surface-card px-4 text-base text-content-primary',
              'placeholder:text-content-muted',
              'transition-all duration-fast ease-standard outline-none',
              'focus-visible:border-brand-600 focus-visible:shadow-focus focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-content-muted',
              leadingIcon && 'pl-10',
              trailingIcon && 'pr-10',
              hasError &&
                'border-danger focus-visible:border-danger focus-visible:shadow-focus-error',
              className,
            )}
            {...props}
          />
          {trailingIcon ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-content-muted"
            >
              {trailingIcon}
            </span>
          ) : null}
        </div>
        {hasError ? (
          <p id={errorId} className="text-sm text-danger-text">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-sm text-content-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
TextInput.displayName = 'TextInput';
