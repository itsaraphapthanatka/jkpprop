/* Make the PageSection rows match src/lib/sectionCatalog.
 *
 *   npm run sections:sync           # show what would change
 *   npm run sections:sync -- --commit
 *
 * The seed only runs on an empty database, so a block added to the catalogue
 * after launch has no row on a live site and shows up nowhere in the editor.
 * This fills the gap without touching a single word anyone has typed: it
 * creates missing rows, refreshes `name`/`desc`/`type`/`sort`, and never
 * writes `content` or `enabled`.
 *
 * Rows in the table that are not in the catalogue are reported and left
 * alone — deleting a section deletes its copy, and that is not a decision a
 * sync script gets to make.
 */
import { PrismaClient } from '@prisma/client';
import { SECTION_CATALOG, PAGE_KEYS } from '../src/lib/sectionCatalog';

const commit = process.argv.includes('--commit');
const db = new PrismaClient();

const orgs = await db.org.findMany({ select: { id: true, name: true } });
if (!orgs.length) {
  console.error('ไม่พบ organization — ฐานข้อมูลนี้ยังไม่ได้ seed');
  process.exit(1);
}

let created = 0;
let updated = 0;
let orphans = 0;

for (const org of orgs) {
  for (const page of PAGE_KEYS) {
    const defs = SECTION_CATALOG[page];
    const rows = await db.pageSection.findMany({ where: { orgId: org.id, pageKey: page } });
    const byKey = new Map(rows.map((r) => [r.key, r]));

    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const row = byKey.get(d.key);
      const shape = { type: d.type, name: d.name, desc: d.desc, sort: i };

      if (!row) {
        console.log(`+ ${page}/${d.key.padEnd(3)} ${d.name}`);
        created++;
        if (commit) {
          await db.pageSection.create({
            data: { orgId: org.id, pageKey: page, key: d.key, ...shape, enabled: true, content: {} },
          });
        }
        continue;
      }

      const drift =
        row.type !== shape.type || row.name !== shape.name || row.desc !== shape.desc || row.sort !== shape.sort;
      if (drift) {
        console.log(`~ ${page}/${d.key.padEnd(3)} ${row.name} → ${d.name}`);
        updated++;
        // content and enabled are deliberately absent: they belong to the team
        if (commit) await db.pageSection.update({ where: { id: row.id }, data: shape });
      }
    }

    for (const row of rows) {
      if (defs.some((d) => d.key === row.key)) continue;
      console.log(`? ${page}/${row.key.padEnd(3)} มีในฐานข้อมูลแต่ไม่มีในแคตตาล็อก — ไม่แตะต้อง`);
      orphans++;
    }
  }
}

const summary = `สร้าง ${created} · แก้ ${updated} · ไม่รู้จัก ${orphans}`;
console.log(commit ? `\n${summary} — เขียนแล้ว` : `\n${summary} — ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)`);

await db.$disconnect();
