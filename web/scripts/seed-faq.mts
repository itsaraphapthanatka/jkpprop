/* Put the 24 built-in questions into the CMS.
 *
 *   npm run faq:seed              # show what would be added
 *   npm run faq:seed -- --commit
 *
 * They were a fallback baked into the component, which meant the page had two
 * sources that could not be reconciled: the moment one question was written in
 * /admin/cms, the Thai page showed that one alone while English and Chinese
 * still listed all 24 — in Thai. Three languages, three different FAQs.
 *
 * Once they are rows, every language reads the same set and the team
 * translates them one at a time. Only missing slugs are added, so this is safe
 * to re-run and never overwrites an edit.
 */
import { PrismaClient } from '@prisma/client';
import { FALLBACK_CATS } from '../src/lib/faqDefaults';

const commit = process.argv.includes('--commit');
const db = new PrismaClient();

const org = await db.org.findFirst({ select: { id: true } });
if (!org) { console.error('ไม่พบ organization'); process.exit(1); }

/* A stable slug from the category and position, not from the question text:
   editing the wording later must not orphan the row and re-seed a duplicate. */
const slugFor = (catKey: string, i: number) => `${catKey}-${i + 1}`;

let added = 0;
let skipped = 0;

for (const cat of FALLBACK_CATS) {
  for (let i = 0; i < cat.qs.length; i++) {
    const [question, answer] = cat.qs[i];
    const slug = slugFor(cat.key, i);

    const existing = await db.cmsPage.findFirst({ where: { orgId: org.id, kind: 'faq', slug } });
    if (existing) { skipped++; continue; }

    console.log(`+ ${cat.title.padEnd(24)} ${question.slice(0, 46)}`);
    added++;
    if (commit) {
      await db.cmsPage.create({
        data: {
          orgId: org.id, kind: 'faq', slug, status: 'published',
          category: cat.title, title: question,
          // the editor stores HTML, so the answer goes in as a paragraph
          content: { th: { title: question, body: `<p>${answer}</p>`, done: true } },
        },
      });
    }
  }
}

console.log(
  `\nเพิ่ม ${added} · มีอยู่แล้ว ${skipped}` +
  (added ? (commit ? ' — เขียนแล้ว' : ' — ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)') : ''),
);
await db.$disconnect();
