'use client';

/* Keeps <html lang> in step with the locale in the URL.
 *
 * The root layout sets the attribute from the `x-locale` header middleware
 * attaches, which is correct on a full page load. It is not correct after
 * the language switcher runs: router.push('/en') is a client-side navigation
 * and the root layout is shared by every locale, so React never re-renders it
 * and the document keeps announcing the previous language to screen readers
 * and to translation tooling. */
import { useEffect } from 'react';
import { HTML_LANG } from './config';
import { useLocale } from './LocaleLink';

export function SyncHtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);
  return null;
}
