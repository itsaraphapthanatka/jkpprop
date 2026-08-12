/* Apply the English and Chinese FAQ text to the seeded rows.
 *
 *   npm run faq:translate              # show what would change
 *   npm run faq:translate -- --commit
 *
 * Never overwrites a locale that already has text, so anything the team has
 * written or corrected in /admin/cms survives a re-run. Rows the translation
 * table does not cover — anything added by hand — are reported and skipped
 * rather than guessed at.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { FAQ_TRANSLATIONS, FAQ_CATEGORIES } from './faqTranslations';

const commit = process.argv.includes('--commit');
const db = new PrismaClient();

type Block = { title?: string; body?: string; category?: string; done?: boolean };
const has = (b: Block | undefined) => !!(b && (b.title?.trim() || b.body?.trim()));

const rows = await db.cmsPage.findMany({ where: { kind: 'faq' }, orderBy: { createdAt: 'asc' } });
let wrote = 0, kept = 0;
const uncovered: string[] = [];

for (const row of rows) {
  const tr = FAQ_TRANSLATIONS[row.slug];
  if (!tr) { uncovered.push(`${row.slug} — ${row.title.slice(0, 40)}`); continue; }

  const content = (row.content ?? {}) as Record<string, Block>;
  const cat = FAQ_CATEGORIES[row.category] ?? { en: row.category, zh: row.category };
  const next = { ...content };
  const added: string[] = [];

  for (const loc of ['en', 'zh'] as const) {
    if (has(content[loc])) { continue; }
    next[loc] = { title: tr[loc].title, body: `<p>${tr[loc].body}</p>`, category: cat[loc], done: true };
    added.push(loc);
  }
  // the Thai row gets its own category label so all three read the same way
  if (!content.th?.category) next.th = { ...(content.th ?? {}), category: row.category };

  if (!added.length) { kept++; continue; }
  console.log(`+ ${row.slug.padEnd(13)} ${added.join(',').padEnd(6)} ${tr.en.title.slice(0, 44)}`);
  wrote++;
  if (commit) {
    await db.cmsPage.update({ where: { id: row.id }, data: { content: next as Prisma.InputJsonValue } });
  }
}

for (const u of uncovered) console.log(`? ไม่มีคำแปลในตาราง ข้ามไว้: ${u}`);
console.log(`\nแปล ${wrote} · มีคำแปลอยู่แล้ว ${kept} · ข้าม ${uncovered.length}` +
  (wrote ? (commit ? ' — เขียนแล้ว' : ' — ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)') : ''));
await db.$disconnect();
