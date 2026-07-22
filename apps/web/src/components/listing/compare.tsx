'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GitCompareArrows, X } from 'lucide-react';
import { cn, toast } from '@jkp/ui';
import { Link } from '@/i18n/navigation';

const STORAGE_KEY = 'jkp-compare';
const MAX = 4;

interface CompareContextValue {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev; // capped; caller surfaces the toast
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => setIds((prev) => prev.filter((x) => x !== id)), []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<CompareContextValue>(
    () => ({ ids, toggle, remove, clear, has: (id) => ids.includes(id), isFull: ids.length >= MAX }),
    [ids, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within <CompareProvider>');
  return ctx;
}

/** Checkbox rendered on a ListingCard footer (only where a CompareProvider exists). */
export function CompareCheckbox({ id }: { id: string }) {
  const { has, toggle, isFull } = useCompare();
  const t = useTranslations('compare');
  const tc = useTranslations('card');
  const checked = has(id);

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-content-secondary">
      <input
        type="checkbox"
        className="size-[18px] rounded-[4px] accent-brand-600"
        checked={checked}
        onChange={() => {
          if (!checked && isFull) {
            toast.error(t('full'));
            return;
          }
          toggle(id);
        }}
      />
      {tc('addToCompare')}
    </label>
  );
}

/** Floating compare bar (FR-SRC-07). Renders only when items are selected. */
export function CompareBar() {
  const { ids, clear } = useCompare();
  const t = useTranslations('compare');
  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-sticky border-t border-line bg-surface-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-4 py-3">
        <span className="text-sm font-medium text-content-primary">
          {t('bar', { count: ids.length })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-muted"
          >
            <X className="size-4" strokeWidth={1.7} />
            {t('clear')}
          </button>
          <Link
            href={`/listing-compare?ids=${ids.join(',')}`}
            className={cn(
              'inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white',
              'transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-glow',
            )}
          >
            <GitCompareArrows className="size-4" strokeWidth={1.7} />
            {t('compareBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
