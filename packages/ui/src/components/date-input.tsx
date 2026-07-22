'use client';

import * as React from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../lib/cn';

/**
 * DateInput / DateRangeInput (JKP_Property_Handoff.md tokens).
 * A trigger styled like the Select trigger opens a react-day-picker (v9) calendar
 * inside a Popover. Dates render as `DD MMM YYYY` via Intl.DateTimeFormat('en-GB')
 * — no date-library dependency. The DayPicker is fully keyboard navigable.
 */
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(date: Date | undefined): string {
  return date ? dateFormatter.format(date) : '';
}

const triggerClasses =
  'flex h-10 w-full items-center gap-2 rounded-md border border-line bg-surface-card px-4 text-base text-content-primary outline-none ' +
  'transition-colors duration-fast ease-standard ' +
  'focus-visible:border-brand-600 focus-visible:shadow-focus ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  disabled,
  className,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(triggerClasses, className)}>
          <CalendarDays className="size-5 shrink-0 text-content-muted" strokeWidth={1.7} aria-hidden />
          <span className={cn('line-clamp-1 flex-1 text-left', !value && 'text-content-muted')}>
            {value ? formatDate(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <DayPicker
          mode="single"
          autoFocus
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangeValue {
  from?: Date;
  to?: Date;
}

export interface DateRangeInputProps {
  value?: DateRangeValue;
  onChange: (range: DateRangeValue | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}

function formatRange(range: DateRangeValue | undefined, placeholder: string): string {
  if (!range?.from) return placeholder;
  if (!range.to) return `${formatDate(range.from)} – …`;
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

export function DateRangeInput({
  value,
  onChange,
  placeholder = 'เลือกช่วงวันที่',
  disabled,
  className,
}: DateRangeInputProps) {
  const [open, setOpen] = React.useState(false);
  const hasValue = Boolean(value?.from);
  const selected: DateRange | undefined = value?.from
    ? { from: value.from, to: value.to }
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(triggerClasses, className)}>
          <CalendarDays className="size-5 shrink-0 text-content-muted" strokeWidth={1.7} aria-hidden />
          <span className={cn('line-clamp-1 flex-1 text-left', !hasValue && 'text-content-muted')}>
            {formatRange(value, placeholder)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <DayPicker
          mode="range"
          autoFocus
          selected={selected}
          onSelect={(range) => {
            onChange(range ? { from: range.from, to: range.to } : undefined);
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
