/* Per-property title and description in English and Chinese.
 *
 * The Thai title is the record's own — it lives in `Property.title` and is what
 * the team types when the property is created. English and Chinese are
 * translations of it, kept in `Property.i18n` as
 *   { en: { title, description }, zh: { title, description } }
 * so an untranslated record simply has nothing there and falls back to Thai,
 * rather than showing an empty card.
 */
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/config';
import { displayTitle } from '@/lib/propertyTitle';
import type { GeoOverrides } from '@/i18n/places';
import { propertyType } from '@/lib/propertySchema';
import { displayArea } from './propertyDto';

export type Translated = { title: string; description: string };
export type PropertyI18n = Partial<Record<Exclude<Locale, 'th'>, Translated>>;

/** the locales that can be translated — Thai is the source, not a translation */
export const TRANSLATABLE = LOCALES.filter((l) => l !== DEFAULT_LOCALE) as Exclude<Locale, 'th'>[];

const TITLE_MAX = 300;
const DESC_MAX = 2000;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Read whatever is in the column without trusting its shape. */
export function parseI18n(v: unknown): PropertyI18n {
  const src = (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) as Record<string, unknown>;
  const out: PropertyI18n = {};
  for (const l of TRANSLATABLE) {
    const row = (src[l] && typeof src[l] === 'object' ? src[l] : {}) as Record<string, unknown>;
    const title = str(row.title, TITLE_MAX);
    const description = str(row.description, DESC_MAX);
    // an empty language is left out entirely, so "has a translation" stays a
    // question about content rather than about whether the key exists
    if (title || description) out[l] = { title, description };
  }
  return out;
}

type Rec = { title: string; i18n?: unknown };

/** The title in the reader's language, falling back to the Thai one. */
export function localTitle(p: Rec, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return p.title;
  return parseI18n(p.i18n)[locale as Exclude<Locale, 'th'>]?.title || p.title;
}

/* The same question, for a record that also carries the fields a headline can
   be composed from: a translation if there is one, otherwise a title built in
   the reader's language rather than a Thai one shown to someone who cannot
   read it. See lib/propertyTitle. */
export function localTitleFor(
  p: Rec & { typeKey: string; publicCode: string },
  values: Record<string, unknown>,
  locale: Locale,
  over?: GeoOverrides,
): string {
  if (locale === DEFAULT_LOCALE) return p.title;
  return displayTitle(
    p.title,
    parseI18n(p.i18n)[locale as Exclude<Locale, 'th'>]?.title,
    {
      typeLabel: propertyType(p.typeKey).label,
      values,
      area: displayArea(values),
      code: p.publicCode,
    },
    locale,
    over,
  );
}

/** The description in the reader's language; there is no Thai one to fall back to. */
export function localDescription(p: Rec, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return '';
  return parseI18n(p.i18n)[locale as Exclude<Locale, 'th'>]?.description || '';
}

/** Languages this record still has no title in — what "แปลไม่ครบ" counts. */
export function missingTitles(p: Rec): Exclude<Locale, 'th'>[] {
  const t = parseI18n(p.i18n);
  return TRANSLATABLE.filter((l) => !t[l]?.title);
}
