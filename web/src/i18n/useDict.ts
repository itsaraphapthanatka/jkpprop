'use client';

/* The dictionary for the locale in the URL.
 *
 * The public components are client components (hover state, dropdowns,
 * carousels), so they read the locale from the path rather than from a
 * server param — same source of truth as LocaleLink, so a link and the copy
 * around it can never disagree about which language the page is in. */
import { getDictionary, type Dictionary } from './dictionaries';
import { useLocale } from './LocaleLink';
import type { Locale } from './config';

export function useDict(): Dictionary {
  return getDictionary(useLocale());
}

/** both, for components that also need to translate stored option values */
export function useI18n(): { d: Dictionary; locale: Locale } {
  const locale = useLocale();
  return { d: getDictionary(locale), locale };
}
