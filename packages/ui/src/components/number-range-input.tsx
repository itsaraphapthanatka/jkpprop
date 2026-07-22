'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import { Label } from './label';

/**
 * NumberRangeInput (JKP_Property_Handoff.md — price / area range filters).
 * Two numeric fields joined by an en-dash. Input is tolerant: commas and
 * spaces are stripped before parsing, so "1,200 000" becomes 1200000. Emits a
 * { min, max } pair (null = empty) and shows an inline error when min > max.
 * Uses the shared input styling inline (no TextInput coupling).
 */
export interface NumberRangeInputProps {
  label?: string;
  unit?: string;
  minValue: number | null;
  maxValue: number | null;
  onChange: (v: { min: number | null; max: number | null }) => void;
  placeholderMin?: string;
  placeholderMax?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const inputClasses =
  'h-10 w-full rounded-md border border-line bg-surface-card px-4 text-base text-content-primary ' +
  'placeholder:text-content-muted transition-all duration-fast ease-standard outline-none ' +
  'focus-visible:border-brand-600 focus-visible:shadow-focus focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-content-muted';

const errorInputClasses =
  'border-danger focus-visible:border-danger focus-visible:shadow-focus-error';

function parse(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export const NumberRangeInput = React.forwardRef<
  HTMLDivElement,
  NumberRangeInputProps
>(
  (
    {
      label,
      unit,
      minValue,
      maxValue,
      onChange,
      placeholderMin,
      placeholderMax,
      className,
      id,
      disabled,
    },
    ref,
  ) => {
    const reactId = React.useId();
    const groupId = id ?? reactId;
    const minId = `${groupId}-min`;
    const maxId = `${groupId}-max`;
    const errorId = `${groupId}-error`;
    const hasError =
      minValue !== null && maxValue !== null && minValue > maxValue;

    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
        {label ? (
          <Label htmlFor={minId}>
            {label}
            {unit ? (
              <span className="ml-1 font-normal text-content-muted">
                ({unit})
              </span>
            ) : null}
          </Label>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            id={minId}
            type="text"
            inputMode="numeric"
            aria-label={label ? `${label} min` : 'min'}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            disabled={disabled}
            placeholder={placeholderMin}
            value={minValue ?? ''}
            onChange={(e) =>
              onChange({ min: parse(e.target.value), max: maxValue })
            }
            className={cn(inputClasses, hasError && errorInputClasses)}
          />
          <span aria-hidden="true" className="shrink-0 text-content-muted">
            –
          </span>
          <input
            id={maxId}
            type="text"
            inputMode="numeric"
            aria-label={label ? `${label} max` : 'max'}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            disabled={disabled}
            placeholder={placeholderMax}
            value={maxValue ?? ''}
            onChange={(e) =>
              onChange({ min: minValue, max: parse(e.target.value) })
            }
            className={cn(inputClasses, hasError && errorInputClasses)}
          />
        </div>
        {hasError ? (
          <p id={errorId} role="alert" className="text-sm text-danger-text">
            min ต้องไม่มากกว่า max
          </p>
        ) : null}
      </div>
    );
  },
);
NumberRangeInput.displayName = 'NumberRangeInput';
