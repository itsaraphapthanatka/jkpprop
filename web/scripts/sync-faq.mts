/* Push the FAQ in src/i18n/faq.ts into the CMS, in all three languages.
 *
 *   npm run faq:sync              # show what would change
 *   npm run faq:sync -- --commit
 *
 * There were two FAQs. src/i18n/faq.ts holds the written set — 25 questions in
 * Thai, English and Chinese, reviewed together — while the public page reads
 * CMS rows, which had been seeded from an older, thinner Thai draft and then
 * machine-filled per language. This makes the file the source and the CMS the
 * copy the team can edit.
 *
 * A row the team has edited by hand is never overwritten: a row is only
 * refreshed when what is stored is still exactly what a script put there
 * (either the old seed or this file). Anything else is reported and left
 * alone, so an edit made in /admin/cms outlives a re-run.
 */
import { PrismaClient } from '@prisma/client';
import { FAQ } from '../src/i18n/faq';
import { FALLBACK_CATS } from '../src/lib/faqDefaults';
import { FAQ_TRANSLATIONS } from './faqTranslations';

const commit = process.argv.includes('--commit');
const force = process.argv.includes('--force');
const db = new PrismaClient();

type Block = { title?: string; body?: string; category?: string; done?: boolean };
const p = (s: string) => `<p>${s}</p>`;
const norm = (s: unknown) => String(s ?? '').replace(/<\/?p>/g, '').replace(/\s+/g, ' ').trim();

/* The one question seeded before the category scheme existed kept its own
   slug; it is the same question, so it must be updated rather than duplicated. */
const LEGACY_SLUG: Record<string, string> = { 'docs-license-1': 'rg4-license' };
const slugFor = (catKey: string, i: number) => {
  const s = `${catKey}-${i + 1}`;
  return LEGACY_SLUG[s] ?? s;
};

/** Everything a script could plausibly have written into this row before now. */
function scriptWritten(slug: string, catKey: string, i: number): string[] {
  const out: string[] = [];
  const oldCat = FALLBACK_CATS.find((c) => c.key === catKey);
  const oldQa = oldCat?.qs[i];
  if (oldQa) out.push(norm(oldQa[1]));
  const tr = FAQ_TRANSLATIONS[slug];
  if (tr) { out.push(norm(tr.en?.body)); out.push(norm(tr.zh?.body)); }
  for (const locale of ['th', 'en', 'zh'] as const) {
    const cat = FAQ[locale].find((c) => c.key === catKey);
    if (cat?.qs[i]) out.push(norm(cat.qs[i].a));
  }
  return out;
}

const org = await db.org.findFirst({ select: { id: true } });
if (!org) { console.error('ไม่พบ organization'); process.exit(1); }

let added = 0, updated = 0, unchanged = 0;
const edited: string[] = [];

for (const cat of FAQ.th) {
  for (let i = 0; i < cat.qs.length; i++) {
    const slug = slugFor(cat.key, i);
    const content: Record<string, Block> = {};
    for (const locale of ['th', 'en', 'zh'] as const) {
      const c = FAQ[locale].find((x) => x.key === cat.key)!;
      const { q, a } = c.qs[i];
      content[locale] = { title: q, body: p(a), category: c.title, done: true };
    }
    const data = { category: cat.title, title: cat.qs[i].q, content, status: 'published' as const };

    const row = await db.cmsPage.findFirst({ where: { orgId: org.id, kind: 'faq', slug } });
    if (!row) {
      console.log(`+ ${slug.padEnd(16)} ${cat.qs[i].q.slice(0, 50)}`);
      added++;
      if (commit) await db.cmsPage.create({ data: { orgId: org.id, kind: 'faq', slug, ...data } });
      continue;
    }

    const stored = (row.content ?? {}) as Record<string, Block>;
    const already = (['th', 'en', 'zh'] as const).every((l) => norm(stored[l]?.body) === norm(content[l].body));
    if (already) { unchanged++; continue; }

    const known = scriptWritten(slug, cat.key, i);
    const isScriptText = (['th', 'en', 'zh'] as const)
      .every((l) => !norm(stored[l]?.body) || known.includes(norm(stored[l]?.body)));
    if (!isScriptText && !force) {
      edited.push(`${slug} — ${row.title.slice(0, 44)}`);
      /* Their words stay theirs — but a heading nobody ever wrote is not an
         edit to protect. An empty category label left the English page with a
         Thai heading sitting over an English answer. */
      const missing = (['th', 'en', 'zh'] as const).filter((l) => !stored[l]?.category?.trim());
      if (missing.length) {
        const filled = { ...stored };
        for (const l of missing) filled[l] = { ...(stored[l] ?? {}), category: content[l].category };
        console.log(`  \u21b3 เติมชื่อหมวดที่ยังว่างให้ ${slug} (${missing.join(', ')})`);
        if (commit) await db.cmsPage.update({ where: { id: row.id }, data: { content: filled } });
      }
      continue;
    }

    console.log(`~ ${slug.padEnd(16)} ${cat.qs[i].q.slice(0, 50)}`);
    updated++;
    if (commit) await db.cmsPage.update({ where: { id: row.id }, data });
  }
}

/* Rows the file does not cover — added by hand in the CMS. They stay
   published; the point of naming them is that nobody has to wonder later. */
const covered = new Set(FAQ.th.flatMap((c) => c.qs.map((_, i) => slugFor(c.key, i))));
const extras = (await db.cmsPage.findMany({ where: { orgId: org.id, kind: 'faq' }, select: { slug: true, title: true } }))
  .filter((r) => !covered.has(r.slug));

console.log(`\nเพิ่ม ${added} · อัปเดต ${updated} · เหมือนเดิม ${unchanged}`);
if (edited.length) {
  console.log(`\nข้ามเพราะมีคนแก้ไว้เอง ${edited.length} แถว (ใส่ --force ถ้าต้องการทับ):`);
  for (const e of edited) console.log('  ' + e);
}
if (extras.length) {
  console.log(`\nแถวที่ไม่ได้อยู่ในไฟล์ ${extras.length} แถว (ทีมเพิ่มเองในหลังบ้าน คงไว้):`);
  for (const e of extras) console.log(`  ${e.slug} — ${e.title.slice(0, 44)}`);
}
if ((added || updated) && !commit) console.log('\nยังไม่เขียนอะไร — ใส่ --commit เพื่อเขียนจริง');
await db.$disconnect();
