'use client';

/* next/link that keeps the visitor in their locale.

   Without this every internal click on /en/… would hit middleware and take a
   307 back through /th, quietly dropping the language. Absolute URLs, hashes,
   tel:/mailto:, and the locale-free paths (admin, the tokenized client view)
   pass through untouched. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

const NO_LOCALE = ['/admin', '/api', '/client-shortlist', '/cms-sitemap', '/site-index'];

/** the locale of the page currently being viewed */
export function useLocale(): Locale {
  const first = (usePathname() ?? '/').split('/')[1] ?? '';
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

export function localeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/')) return href; // http(s), tel:, mailto:, #anchor
  if (NO_LOCALE.some((p) => href === p || href.startsWith(p + '/'))) return href;
  const first = href.split('/')[1] ?? '';
  if (isLocale(first)) return href; // already localised
  return `/${locale}${href === '/' ? '' : href}`;
}

export function LocaleLink({ href, ...rest }: React.ComponentProps<typeof Link>) {
  const locale = useLocale();
  return <Link href={typeof href === 'string' ? localeHref(href, locale) : href} {...rest} />;
}

export default LocaleLink;
