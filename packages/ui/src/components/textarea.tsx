'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import { Label } from './label';

/**
 * Textarea (JKP_Property_Handoff.md — input pattern, multiline).
 * Same label / hint / error contract as TextInput; min-h-24, vertical resize.
 * When maxLength is set, shows a live char counter that shifts from muted to
 * warning as it approaches the limit.
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      hint,
      error,
      containerClassName,
      className,
      disabled,
      maxLength,
      value,
      defaultValue,
      onChange,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const hintId = `${fieldId}-hint`;
    const errorId = `${fieldId}-error`;
    const hasError = Boolean(error);

    const isControlled = value !== undefined;
    const [internalCount, setInternalCount] = React.useState(
      String(defaultValue ?? '').length,
    );
    const count = isControlled ? String(value ?? '').length : internalCount;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternalCount(e.target.value.length);
      onChange?.(e);
    };

    const showCounter = typeof maxLength === 'number';
    const nearLimit = showCounter && count >= maxLength * 0.9;

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
        {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
        <textarea
          ref={ref}
          id={fieldId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-h-24 w-full resize-y rounded-md border border-line bg-surface-card px-4 py-2.5 text-base text-content-primary',
            'placeholder:text-content-muted',
            'transition-all duration-fast ease-standard outline-none',
            'focus-visible:border-brand-600 focus-visible:shadow-focus focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-content-muted',
            hasError &&
              'border-danger focus-visible:border-danger focus-visible:shadow-focus-error',
            className,
          )}
          {...props}
        />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
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
          {showCounter ? (
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0 text-xs tabular-nums',
                nearLimit ? 'text-warning-text' : 'text-content-muted',
              )}
            >
              {count}/{maxLength}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
