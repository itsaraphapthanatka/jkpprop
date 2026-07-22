'use client';

import * as React from 'react';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../lib/cn';

/**
 * Combobox (JKP_Property_Handoff.md tokens).
 * Self-contained searchable single-select built on cmdk inside a Popover.
 * The trigger mirrors the Select trigger (h-10, rounded-md, border-line, brand
 * focus ring); cmdk handles filtering, keyboard navigation and ARIA roles.
 * Selected row reads Check + text-brand-600 (icon + colour, never colour alone).
 */
export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'เลือก…',
  searchPlaceholder = 'ค้นหา…',
  emptyText = 'ไม่พบรายการ',
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface-card px-4 text-base text-content-primary outline-none',
            'transition-colors duration-fast ease-standard',
            'focus-visible:border-brand-600 focus-visible:shadow-focus',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
        >
          <span className={cn('line-clamp-1 text-left', !selected && 'text-content-muted')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="size-5 shrink-0 text-content-muted" strokeWidth={1.7} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0"
      >
        <Command
          label={placeholder}
          className="flex max-h-72 w-full flex-col overflow-hidden rounded-lg bg-surface-card text-content-primary"
        >
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="size-4 shrink-0 text-content-muted" strokeWidth={1.7} aria-hidden />
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-base text-content-primary outline-none placeholder:text-content-muted"
            />
          </div>
          <CommandList className="max-h-60 overflow-y-auto overflow-x-hidden p-1">
            <CommandEmpty className="px-3 py-6 text-center text-sm text-content-muted">
              {emptyText}
            </CommandEmpty>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-3 py-2 text-base outline-none',
                    'data-[selected=true]:bg-surface-muted',
                    'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
                    isSelected && 'font-medium text-brand-600',
                  )}
                >
                  <Check
                    className={cn('size-4 shrink-0 text-brand-600', isSelected ? 'opacity-100' : 'opacity-0')}
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  <span className="line-clamp-1">{option.label}</span>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
