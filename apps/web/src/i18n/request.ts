import { getRequestConfig } from 'next-intl/server';
import { routing, type AppLocale } from './routing';

/**
 * Per-request i18n config. Messages are loaded from /messages/{locale}.json.
 * All UI copy comes from these catalogs — never hardcode strings (NFR-04).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale = routing.locales.includes(requested as AppLocale)
    ? (requested as AppLocale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
