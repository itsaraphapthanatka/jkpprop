/* FAQ entries from the CMS.
 *
 * /admin/cms already edits `kind: 'faq'` rows with a title, a body and a
 * per-language block — but the public FAQ page rendered a list baked into the
 * component, so nothing published there ever appeared. This reads the
 * published rows and groups them by category, in the visitor's language.
 *
 * An empty result means the component keeps its built-in set, so the page is
 * never blank while the team is still filling the CMS in.
 */
import { db } from './db';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

export type FaqCategory = { key: string; title: string; qs: [string, string][] };

type LangBlock = { title?: unknown; body?: unknown; done?: unknown };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function loadFaq(locale: Locale): Promise<FaqCategory[]> {
  const rows = await db.cmsPage
    .findMany({ where: { kind: 'faq', status: 'published' }, orderBy: { createdAt: 'asc' } })
    .catch(() => []);

  const byCategory = new Map<string, FaqCategory>();

  for (const row of rows) {
    const content = (row.content ?? {}) as Record<string, LangBlock>;
    /* Fall back to Thai per entry, rather than per page.
     *
     * Strictness — showing an entry only in the language it was written in —
     * is right for marketing copy, where a translated default ships in the
     * dictionary. An FAQ has no translated default: the built-in set is Thai
     * either way. So being strict produced three different FAQs. One question
     * written in Thai cut the Thai page down to that one question, while
     * English and Chinese still listed all 24 built-ins, in Thai.
     *
     * Per-entry fallback means every language lists the same questions, and
     * each turns into English or Chinese as it gets translated. */
    const block = content[locale] ?? {};
    const th = content[DEFAULT_LOCALE] ?? {};
    const question = str(block.title) || str(th.title) || row.title;
    /* The editor stores markup, and the page renders it as HTML — so it is
       cleaned here, once, on the server, rather than trusting the database. */
    const answer = sanitizeHtml(str(block.body) || str(th.body));
    if (!question || !answer) continue;

    const key = row.category || 'general';
    if (!byCategory.has(key)) byCategory.set(key, { key, title: row.category || '', qs: [] });
    byCategory.get(key)!.qs.push([question, answer]);
  }

  return [...byCategory.values()].filter((c) => c.qs.length > 0);
}
