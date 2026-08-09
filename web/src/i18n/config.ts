/* ============================================================
   Locales — AGENT.md §9: the public site is locale-first (/th /en /zh).
   Admin stays Thai-only and lives outside [locale] by design.
   ============================================================ */

export const LOCALES = ['th', 'en', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'th';

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** `lang` attribute + hreflang code for each locale */
export const HTML_LANG: Record<Locale, string> = { th: 'th', en: 'en', zh: 'zh-Hans' };

/** what the language switcher shows */
export const LOCALE_LABEL: Record<Locale, string> = { th: 'ไทย', en: 'English', zh: '中文' };

/** swap the locale segment of a path, keeping the rest intact */
export function localizePath(path: string, locale: Locale): string {
  const rest = path.replace(/^\/(th|en|zh)(?=\/|$)/, '') || '/';
  return `/${locale}${rest === '/' ? '' : rest}`;
}
