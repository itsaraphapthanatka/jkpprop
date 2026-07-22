import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Toaster } from '@jkp/ui';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './language-switcher';

/**
 * PublicPageShell — sticky glass header (nav + language switcher) + footer.
 * FE-0 baseline; the full responsive header (scroll shrink, mobile drawer,
 * mega nav) is built out in FE-2.
 */
export async function PublicPageShell({ children }: { children: ReactNode }) {
  const t = await getTranslations('nav');
  const tc = await getTranslations('common');

  const links = [
    { href: '/', label: t('home') },
    { href: '/listing', label: t('listings') },
    { href: '/requirement', label: t('requirement') },
    { href: '/contact', label: t('contact') },
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-header border-b border-line-subtle bg-surface-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-wide items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-brand-700">
            {tc('brand')}
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-content-secondary transition-colors hover:text-content-primary"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line-subtle bg-surface-alt">
        <div className="mx-auto max-w-wide px-4 py-10 text-sm text-content-muted">
          © 2026 {tc('brand')}
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
