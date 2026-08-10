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
  img: string | null;
  enabled: boolean;
  items: SectionItem[];
};

export type PageCopy = Record<string, SectionCopy>;

const EMPTY: SectionCopy = { eyebrow: '', headline: '', sub: '', cta: '', img: null, enabled: true, items: [] };

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

function pickItems(content: Record<string, Block>, locale: Locale): SectionItem[] {
  const raw = content[locale]?.items ?? content[DEFAULT_LOCALE]?.items;
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
      img: row.img || null,
      enabled: row.enabled,
      items: pickItems(content, locale),
    };
  }
  return out;
}

/** a section that does not exist yet reads as empty rather than throwing */
export const section = (copy: PageCopy, key: string): SectionCopy => copy[key] ?? EMPTY;
