/* Page copy that /admin/sections owns.
 *
 * The editor, the API and the PageSection table were wired to each other from
 * the start — but nothing on the public site ever read the result, so saving
 * a headline in the admin changed a row in the database and nothing else.
 * (The About hero in production still reads "เกี่ยวกับ JKP Property2" in the
 * table, from somebody testing the editor; the page never showed it.)
 *
 * This closes that half of the loop. A field left blank in the CMS falls back
 * to the locale the visitor asked for, then to Thai, then to nothing — and the
 * component substitutes its dictionary default for anything still empty, so an
 * untouched install looks exactly as it did before anyone opened the editor.
 */
import { db } from './db';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

export type SectionItem = {
  title?: string;
  desc?: string;
  role?: string;
  img?: string;
};

export type SectionCopy = {
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
  /** small line under the body copy — award name, caption, disclaimer */
  note: string;
  /* Settings that are the same in every language. A map pin is a place, not
     a sentence: asking for it once per language tab would be three chances to
     disagree about where the office is. Stored beside the locale blocks under
     `settings`, not inside them. */
  map: string;
  img: string | null;
  enabled: boolean;
  /** items entered for THIS locale only — use for anything that reads as prose */
  items: SectionItem[];
  /** items for this locale, else the Thai ones — use for names, photos, logos */
  itemsAny: SectionItem[];
};

export type PageCopy = Record<string, SectionCopy>;

const EMPTY: SectionCopy = { eyebrow: '', headline: '', sub: '', cta: '', note: '', map: '', img: null, enabled: true, items: [], itemsAny: [] };

type Block = Partial<Record<keyof SectionCopy, unknown>>;

/* Only the locale that was asked for.
 *
 * Deliberately no fall-through to Thai: an empty result makes the component
 * use its dictionary default, which is written in the visitor's language. A
 * Thai headline shown to a Chinese reader would be worse than the stock
 * Chinese one, and the language tabs in /admin/sections mark which locales
 * still have nothing so the gap is visible to whoever fills them in. */
function pick(content: Record<string, Block>, locale: Locale, field: string): string {
  const here = content[locale]?.[field as keyof Block];
  return typeof here === 'string' ? here.trim() : '';
}

/* Two readings of the same list, because `items` carries two kinds of thing.
 *
 * A pillar heading or a stat caption is prose: showing the Thai one to an
 * English reader is worse than the translated default that ships in the
 * dictionary, so `items` stays strict like the text fields above. A staff
 * name, a photo or a newspaper masthead is not prose — it is the same in
 * every language — so `itemsAny` falls back to Thai and spares the team from
 * retyping the roster three times. Each component picks the one that fits. */
function pickItems(content: Record<string, Block>, locale: Locale, fallback: boolean): SectionItem[] {
  const own = content[locale]?.items;
  const raw = Array.isArray(own) && own.length ? own : fallback ? content[DEFAULT_LOCALE]?.items : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => ({
      title: typeof x.title === 'string' ? x.title : undefined,
      desc: typeof x.desc === 'string' ? x.desc : undefined,
      role: typeof x.role === 'string' ? x.role : undefined,
      img: typeof x.img === 'string' ? x.img : undefined,
    }));
}

/** Every section of one page, keyed by its stable section key. */
export async function loadPageCopy(pageKey: string, locale: Locale): Promise<PageCopy> {
  const rows = await db.pageSection.findMany({ where: { pageKey }, orderBy: { sort: 'asc' } }).catch(() => []);

  const out: PageCopy = {};
  for (const row of rows) {
    const content = (row.content ?? {}) as Record<string, Block>;
    out[row.key] = {
      eyebrow: pick(content, locale, 'eyebrow'),
      headline: pick(content, locale, 'headline'),
      sub: pick(content, locale, 'sub'),
      cta: pick(content, locale, 'cta'),
      note: pick(content, locale, 'note'),
      map: typeof content.settings?.map === 'string' ? content.settings.map.trim() : '',
      img: row.img || null,
      enabled: row.enabled,
      items: pickItems(content, locale, false),
      itemsAny: pickItems(content, locale, true),
    };
  }
  return out;
}

/** a section that does not exist yet reads as empty rather than throwing */
export const section = (copy: PageCopy, key: string): SectionCopy => copy[key] ?? EMPTY;
