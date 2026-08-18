/* Emit the FAQ sync as SQL, for a database this machine cannot reach with
   Prisma (production runs inside a container).

     npx tsx scripts/faq-sql.mts > /tmp/faq.sql

   Every statement carries its own guard: the row is only rewritten while it
   still holds the exact text the old seeder put there, so an answer edited in
   /admin/cms is left alone by construction rather than by a flag. */
import { FAQ } from '../src/i18n/faq';
import { FALLBACK_CATS } from '../src/lib/faqDefaults';

const q = (s: string) => "'" + s.replace(/'/g, "''") + "'";
const LEGACY: Record<string, string> = { 'docs-license-1': 'rg4-license' };

console.log('begin;');
for (const cat of FAQ.th) {
  for (let i = 0; i < cat.qs.length; i++) {
    const slug = LEGACY[`${cat.key}-${i + 1}`] ?? `${cat.key}-${i + 1}`;
    const old = FALLBACK_CATS.find((c) => c.key === cat.key)?.qs[i]?.[1];
    if (!old) continue; // ไม่มีข้อความเดิมให้เทียบ → ไม่แตะ
    const content: Record<string, unknown> = {};
    for (const l of ['th', 'en', 'zh'] as const) {
      const c = FAQ[l].find((x) => x.key === cat.key)!;
      content[l] = { title: c.qs[i].q, body: `<p>${c.qs[i].a}</p>`, category: c.title, done: true };
    }
    console.log(
      `update "CmsPage" set content = ${q(JSON.stringify(content))}::jsonb, category = ${q(cat.title)}, ` +
      `title = ${q(cat.qs[i].q)}, "updatedAt" = now() ` +
      `where kind = 'faq' and slug = ${q(slug)} and content->'th'->>'body' = ${q(`<p>${old}</p>`)};`,
    );
  }
}
console.log(`select count(*) as "แถวที่ยังเป็นข้อความเดิม" from "CmsPage" where kind = 'faq'`);
console.log(`  and content->'th'->>'body' like '%สมัครสมาชิกได้ฟรี%';`);
console.log('commit;');
