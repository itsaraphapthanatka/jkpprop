/* Standalone content pages from the CMS (kind = "pages").
 *
 * The footers linked to "นโยบายความเป็นส่วนตัว" and "ข้อกำหนดการใช้งาน" with
 * href="#" — the two documents a business site is most expected to have, and
 * neither existed. /admin/cms could already write them; there was just no
 * public route and no link. This is that route.
 *
 * home / about / contact are excluded: those slugs are metadata rows for pages
 * that have their own components, not documents to render here.
 */
import { db } from './db';
import { sanitizeHtml, htmlToText } from '@/lib/sanitizeHtml';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

const RESERVED = new Set(['home', 'about', 'contact']);

type Block = { title?: unknown; body?: unknown };
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export type CmsDoc = { slug: string; title: string; html: string; excerpt: string };

/** Published documents, for the footer to link to whatever actually exists. */
export async function listCmsPages(locale: Locale): Promise<{ slug: string; title: string }[]> {
  const rows = await db.cmsPage
    .findMany({ where: { kind: 'pages', status: 'published' }, orderBy: { createdAt: 'asc' } })
    .catch(() => []);

  return rows
    .filter((r) => !RESERVED.has(r.slug))
    .map((r) => {
      const c = (r.content ?? {}) as Record<string, Block>;
      const title = str(c[locale]?.title) || str(c[DEFAULT_LOCALE]?.title) || r.title;
      const body = str(c[locale]?.body) || str(c[DEFAULT_LOCALE]?.body);
      return { slug: r.slug, title, body };
    })
    // a document with no text is a draft in all but name — do not link to it
    .filter((p) => p.body)
    .map(({ slug, title }) => ({ slug, title }));
}

export async function loadCmsPage(slug: string, locale: Locale): Promise<CmsDoc | null> {
  if (RESERVED.has(slug)) return null;
  const row = await db.cmsPage
    .findFirst({ where: { kind: 'pages', slug, status: 'published' } })
    .catch(() => null);
  if (!row) return null;

  const c = (row.content ?? {}) as Record<string, Block>;
  const body = str(c[locale]?.body) || str(c[DEFAULT_LOCALE]?.body);
  if (!body) return null;

  const html = sanitizeHtml(body);
  return {
    slug: row.slug,
    title: str(c[locale]?.title) || str(c[DEFAULT_LOCALE]?.title) || row.title,
    html,
    excerpt: htmlToText(body).slice(0, 160),
  };
}
