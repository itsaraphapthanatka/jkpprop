'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@jkp/ui';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LABELS: Record<string, string> = { th: 'ไทย', en: 'EN', zh: '中文' };

export function LanguageSwitcher() {
  const pathname = usePathname();
  const active = useLocale();
  const t = useTranslations('common');

  return (
    <nav aria-label={t('language')} className="flex items-center gap-1">
      {routing.locales.map((locale) => {
        const isActive = locale === active;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'rounded-md px-2 py-1 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-content-secondary hover:bg-surface-muted',
            )}
          >
            {LABELS[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
