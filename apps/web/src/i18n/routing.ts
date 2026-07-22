import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing (th default). URL prefix is always present: /th, /en, /zh.
 * A bare `/` is redirected to `/th` by the middleware.
 */
export const routing = defineRouting({
  locales: ['th', 'en', 'zh'],
  defaultLocale: 'th',
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];
