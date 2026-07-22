'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@jkp/ui';
import type { Locale } from '@jkp/domain';
import { useRouter } from '@/i18n/navigation';
import { localize, type Taxonomy } from '@/data/types';

/** Sentinel for the "no filter" option (Radix Select values must be non-empty). */
const ANY = 'any';

interface QuickSearchProps {
  taxonomy: Taxonomy;
  locale: string;
}

/**
 * Compact home-page search. Builds a query string whose keys match the listing
 * filter engine (`type`, `transaction`, `province`) and navigates to /listing.
 * A real <form> so Enter submits; horizontal on desktop, stacked on mobile.
 */
export function QuickSearch({ taxonomy, locale }: QuickSearchProps) {
  const th = useTranslations('home');
  const tf = useTranslations('filters');
  const router = useRouter();
  const loc = locale as Locale;

  const [type, setType] = useState<string>(ANY);
  const [province, setProvince] = useState<string>(ANY);
  const [transaction, setTransaction] = useState<'rent' | 'sale' | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (type !== ANY) params.set('type', type);
    if (transaction) params.set('transaction', transaction);
    if (province !== ANY) params.set('province', province);
    const qs = params.toString();
    router.push(qs ? `/listing?${qs}` : '/listing');
  }

  const segments: { value: 'rent' | 'sale'; label: string }[] = [
    { value: 'rent', label: tf('rent') },
    { value: 'sale', label: tf('sale') },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-line bg-surface-card p-4 shadow-sm"
      aria-label={th('ctaSearch')}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Property type */}
        <div className="flex flex-col gap-1.5 md:flex-1">
          <Label htmlFor="qs-type">{tf('type')}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="qs-type" aria-label={tf('type')}>
              <SelectValue placeholder={tf('any')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{tf('any')}</SelectItem>
              {taxonomy.propertyTypes.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {localize(opt.label, loc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction (optional) */}
        <div className="flex flex-col gap-1.5">
          <span id="qs-transaction-label" className="text-sm font-medium text-content-primary">
            {tf('transaction')}
          </span>
          <div
            role="group"
            aria-labelledby="qs-transaction-label"
            className="inline-flex h-10 items-center rounded-full border border-line bg-surface-muted p-1"
          >
            {segments.map((seg) => {
              const active = transaction === seg.value;
              return (
                <button
                  key={seg.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTransaction((prev) => (prev === seg.value ? null : seg.value))}
                  className={cn(
                    'inline-flex h-8 items-center rounded-full px-4 text-sm font-semibold transition-all duration-fast ease-standard',
                    'focus-visible:shadow-focus focus-visible:outline-none',
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-content-secondary hover:text-content-primary',
                  )}
                >
                  {seg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Province */}
        <div className="flex flex-col gap-1.5 md:flex-1">
          <Label htmlFor="qs-province">{tf('province')}</Label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger id="qs-province" aria-label={tf('province')}>
              <SelectValue placeholder={tf('any')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{tf('any')}</SelectItem>
              {taxonomy.provinces.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {localize(opt.label, loc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" className="md:w-auto">
          <Search className="size-5" strokeWidth={1.7} aria-hidden />
          {th('ctaSearch')}
        </Button>
      </div>
    </form>
  );
}
