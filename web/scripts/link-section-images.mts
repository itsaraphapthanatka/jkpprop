/* Point each section's image at a file in the media library.
 *
 *   npm run sections:images              # show what would change
 *   npm run sections:images -- --commit
 *
 * Two problems this solves at once.
 *
 * The editor showed an empty "รูป section" box for every block while the
 * public page displayed a photo, because no section had an `img` saved — the
 * components were falling back to Unsplash URLs written into the source. A
 * field that looks unset but renders something is impossible to work with.
 *
 * And those fallbacks are hot-links: the site depends on someone else's CDN
 * keeping the same URL working. Once a section points at our own library the
 * dependency is gone for that slot.
 *
 * Matching is by filename, so re-running after the team replaces a file with
 * the same name repoints nothing — the media id is looked up fresh. Only
 * empty slots are filled; a section that already has an image is left alone.
 */
import { PrismaClient, type Prisma } from '@prisma/client';

const commit = process.argv.includes('--commit');
const db = new PrismaClient();

/** section → the media filename that should fill its image slot */
const SECTION_IMAGE: Record<string, string> = {
  'home:h': 'placeholder-hero-warehouse.jpg',
  'home:w': 'placeholder-team-office.jpg',
  'home:c': 'placeholder-handshake-cta.jpg',
  'about:ah': 'placeholder-about-hero-aerial.jpg',
  'about:st': 'placeholder-founder-portrait.jpg',
  'about:as': 'placeholder-team-office.jpg',
  'about:aw': 'placeholder-award-ceremony.jpg',
  'contact:ch': 'placeholder-city-skyline.jpg',
  'contact:cm': 'placeholder-map-aerial.jpg',
  'faq:fh': 'placeholder-aerial-logistics.jpg',
};

/** the four team cards, in the order they appear on the About page */
const TEAM_PHOTOS = [
  'placeholder-staff-1.jpg',
  'placeholder-staff-2.jpg',
  'placeholder-staff-3.jpg',
  'placeholder-staff-4.jpg',
];

type Item = { title?: string; desc?: string; role?: string; img?: string };
type Block = { items?: Item[] } & Record<string, unknown>;

const assets = await db.mediaAsset.findMany({ select: { id: true, filename: true, path: true } });
const byName = new Map(assets.map((a) => [a.filename, a.path || `/api/media/${a.id}/raw`]));
if (!assets.length) {
  console.error('คลังสื่อยังว่าง — อัปโหลดรูปที่ /admin/media ก่อน');
  process.exit(1);
}

let changed = 0;
const missing = new Set<string>();

for (const [key, filename] of Object.entries(SECTION_IMAGE)) {
  const [pageKey, sectionKey] = key.split(':');
  const src = byName.get(filename);
  if (!src) { missing.add(filename); continue; }

  const row = await db.pageSection.findFirst({ where: { pageKey, key: sectionKey } });
  if (!row) { console.log(`? ${key} ไม่มี section นี้ — ข้าม`); continue; }
  if (row.img) { console.log(`= ${key.padEnd(12)} มีรูปอยู่แล้ว ไม่แตะ`); continue; }

  console.log(`+ ${key.padEnd(12)} ${filename}`);
  changed++;
  if (commit) await db.pageSection.update({ where: { id: row.id }, data: { img: src } });
}

/* The roster was seeded with the same Unsplash URLs the component used, so
   the photos are still hot-linked even though the names live in the CMS. */
const team = await db.pageSection.findFirst({ where: { pageKey: 'about', key: 'as' } });
if (team) {
  const content = (team.content ?? {}) as Record<string, Block>;
  const th = content.th;
  const rows = Array.isArray(th?.items) ? th.items : [];
  let touched = false;

  const next = rows.map((it, i) => {
    const filename = TEAM_PHOTOS[i];
    const src = filename ? byName.get(filename) : undefined;
    // only replace a photo still pointing outside; never a real one
    if (!src || !it.img || !it.img.includes('unsplash.com')) return it;
    touched = true;
    return { ...it, img: src };
  });

  if (touched) {
    console.log(`+ about:as     รูปทีมงาน ${next.length} คน`);
    changed++;
    if (commit) {
      await db.pageSection.update({
        where: { id: team.id },
        data: { content: { ...content, th: { ...th, items: next } } as Prisma.InputJsonValue },
      });
    }
  }
}

for (const f of missing) console.log(`! ไม่พบไฟล์ "${f}" ในคลังสื่อ`);
console.log(
  changed
    ? `\n${changed} จุด${commit ? ' — เขียนแล้ว' : ' — ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)'}`
    : '\nทุก section มีรูปแล้ว ไม่มีอะไรต้องเปลี่ยน',
);

await db.$disconnect();
