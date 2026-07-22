'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jkp/ui';
import { useRouter, usePathname } from '@/i18n/navigation';
import { SORT_KEYS, type SortKey } from '@/data/types';

/**
 * Sort control. Preserves every other query param (usePathname + useSearchParams)
 * and only rewrites `sort` — the query string stays the single source of truth.
 * `newest` is the default, so it is dropped from the URL to keep it canonical.
 */
export function SortDropdown({ current }: { current: SortKey }) {
  const t = useTranslations('listing');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'newest') params.delete('sort');
    else params.set('sort', value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="whitespace-nowrap text-content-secondary">
        {t('sortLabel')}
      </Label>
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger id="sort" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {t(`sort_${key}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
