/* Put the copy that is currently on the public site into the CMS, in all
 * three languages, so the client can open /admin/sections and edit it.
 *
 *   npm run sections:copy              # show what would be written
 *   npm run sections:copy -- --commit
 *
 * Until now the placeholder copy lived in the dictionary, which meant the
 * public page looked finished while every field in the editor was blank —
 * the client would have had to retype the whole page from scratch to change
 * one word. This lifts the same text into the database, so what they see on
 * the site is what they see in the editor.
 *
 * Only empty fields are filled. Anything the team has already written is left
 * exactly as it is, so this is safe to re-run.
 *
 * Two things are deliberately NOT copied across as they stand:
 *
 *  - the award block names a real organisation ("สมาคมอสังหาริมทรัพย์ไทย" /
 *    the Thai Real Estate Association) as having given JKP an award. Nobody
 *    has told us that happened.
 *  - two of the six "featured in" logos are real outlets (MGR ONLINE, THE
 *    STANDARD).
 *
 * Placeholder copy about yourself is ordinary pre-launch practice. A specific
 * claim about a named third party is a different thing, and it is live and
 * indexed. Both blocks keep their layout and stay editable — they just no
 * longer put words in a real organisation's mouth.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { getDictionary } from '../src/i18n/dictionaries';
import { LOCALES, type Locale } from '../src/i18n/config';

const commit = process.argv.includes('--commit');
const db = new PrismaClient();

type Item = { title?: string; desc?: string; role?: string; img?: string };
type Block = { eyebrow?: string; headline?: string; sub?: string; cta?: string; note?: string; items?: Item[] };

/* The team roster and the press row as they appear today: invented names over
   stock photography. Kept so the page still looks finished, now visible in
   the editor as rows the client can overwrite one at a time. */
const TEAM: Item[] = [
  { title: 'คุณปัทมนันท์ ธิติชนานันต์', role: 'Sales Executive', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&q=80' },
  { title: 'คุณชนสิษฐ์ โชติกันภัย', role: 'Sales Executive', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80' },
  { title: 'คุณวชิสรา ภูอาภรณ์', role: 'Sales Executive', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80' },
  { title: 'คุณธีรภัทร แสงทอง', role: 'Property Consultant', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80' },
];

// four invented mastheads, down from six — MGR ONLINE and THE STANDARD exist
const PRESS: Item[] = ['BRAND INSIGHT', 'BIZ NEWS', 'MARKET WATCH', 'PROPERTY TODAY'].map((title) => ({ title }));

/* Award copy with the claim taken out: same shape, same length, no named
   prize and no named awarding body. The client types the real one — or
   switches the block off — from /admin/sections. */
const AWARD: Record<Locale, { eyebrow: string; headline: string; sub: string }> = {
  th: {
    eyebrow: 'มาตรฐานการทำงาน',
    headline: 'ทำงานตามมาตรฐานวิชาชีพนายหน้า',
    sub: 'ทีมงาน JKP Property คัดกรองทรัพย์ทุกรายการก่อนเผยแพร่ ตรวจเอกสารสิทธิ์และผังเมืองให้ครบก่อนพาเข้าชม และดูแลลูกค้าอย่างโปร่งใสตั้งแต่ค้นหาจนปิดดีล',
  },
  en: {
    eyebrow: 'How we work',
    headline: 'Held to professional brokerage standards',
    sub: 'Every property is checked before it is published — title documents and zoning verified before any viewing — and the deal stays transparent from the first search to signing.',
  },
  zh: {
    eyebrow: '服务标准',
    headline: '遵循房地产经纪专业标准',
    sub: '每一处房源在上架前均经过核查，产权文件与土地用途分区在带看前确认齐备，从寻找到签约全程透明。',
  },
};

/** Fill only the blanks; never touch a field somebody has already written. */
function fill(stored: Block | undefined, incoming: Block): { block: Block; changed: string[] } {
  const block: Block = { ...(stored ?? {}) };
  const changed: string[] = [];
  for (const [k, v] of Object.entries(incoming) as [keyof Block, string | Item[] | undefined][]) {
    // a key set to undefined means "not for this locale" — e.g. the roster,
    // which is entered once in Thai and reused everywhere
    if (v === undefined) continue;
    if (k === 'items') {
      const have = Array.isArray(stored?.items) ? stored.items.filter((i) => i.title || i.desc || i.role || i.img) : [];
      if (have.length) continue;
      block.items = v as Item[];
      changed.push('items');
      continue;
    }
    if (typeof stored?.[k] === 'string' && (stored[k] as string).trim()) continue;
    if (!v) continue;
    (block as Record<string, unknown>)[k] = v;
    changed.push(k);
  }
  return { block, changed };
}

/** What each section should say, per locale, matching what the page renders. */
function copyFor(page: string, key: string, locale: Locale): Block | null {
  const d = getDictionary(locale);
  const th = locale === 'th';

  if (page === 'about') {
    switch (key) {
      case 'ah': return { headline: d.about.hero, sub: d.about.teamSub };
      case 'st': return {
        eyebrow: d.about.storyEyebrow, headline: d.about.storyHeading, sub: d.about.storyBody,
        cta: th ? 'คุณกิตติพงษ์ พรหมทอง' : '',
        items: [
          { title: '2019', desc: d.about.statFounded },
          { title: '2,000+', desc: d.about.statListings },
          { title: `12${d.whyUs.years}`, desc: d.about.statTeamYears },
        ],
      };
      case 'pl': return { items: d.about.pillars.map((p) => ({ title: p.title, desc: p.desc })) };
      case 'as': return {
        eyebrow: d.about.teamEyebrow, headline: d.about.teamHeading, sub: d.about.teamBlurb,
        items: th ? TEAM : undefined,
      };
      case 'aw': return { ...AWARD[locale], cta: '' };
      case 'pr': return { eyebrow: d.about.pressEyebrow, headline: d.about.pressHeading, items: th ? PRESS : undefined };
    }
  }

  if (page === 'home') {
    switch (key) {
      case 'h': return { sub: d.hero.sub };
      case 'n': return { eyebrow: d.featured.eyebrow, headline: d.featured.heading, sub: d.featured.sub };
      case 'l': return { eyebrow: d.locations.eyebrow, headline: d.locations.heading };
      case 's': return {
        eyebrow: d.steps.eyebrow, headline: d.steps.heading, sub: d.steps.sub,
        items: d.steps.items.map((s) => ({ title: s.title, desc: s.desc })),
      };
      case 'w': return {
        eyebrow: d.whyUs.eyebrow, headline: d.whyUs.heading, sub: d.whyUs.sub,
        items: d.whyUs.items.map((f) => ({ title: f.title, desc: f.desc })),
      };
      case 'wk': return {
        items: [
          { title: '2,000+', desc: d.whyUs.kpis[0] },
          { title: '100+', desc: d.whyUs.kpis[1] },
          { title: `12${d.whyUs.years}`, desc: d.whyUs.kpis[2] },
        ],
      };
      case 'ct': return {
        eyebrow: d.certs.eyebrow, headline: d.certs.heading, sub: d.certs.sub,
        items: d.certs.items.map((c) => ({ title: c.name, role: c.tag, desc: c.desc })),
      };
      case 'c': return { eyebrow: d.cta.eyebrow, sub: d.cta.sub, cta: d.cta.primary };
      // 'tg' (the delivery photo wall) stays empty — it had nothing but stock
      // photos, and an empty list hides the block until real ones are added
    }
  }

  return null;
}

const rows = await db.pageSection.findMany({ orderBy: [{ pageKey: 'asc' }, { sort: 'asc' }] });
let touched = 0;

for (const row of rows) {
  const stored = (row.content ?? {}) as Record<string, Block>;
  const next: Record<string, Block> = { ...stored };
  const log: string[] = [];

  for (const locale of LOCALES) {
    const want = copyFor(row.pageKey, row.key, locale);
    if (!want) continue;
    const { block, changed } = fill(stored[locale], want);
    if (!changed.length) continue;
    next[locale] = block;
    log.push(`${locale}:${changed.join(',')}`);
  }

  if (!log.length) continue;
  touched++;
  console.log(`${row.pageKey}/${row.key.padEnd(3)} ${log.join('  ')}`);
  if (commit) {
    await db.pageSection.update({ where: { id: row.id }, data: { content: next as Prisma.InputJsonValue } });
  }
}

console.log(
  touched
    ? `\n${touched} section${commit ? ' — เขียนแล้ว' : ' — ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)'}`
    : '\nทุก section มีเนื้อหาครบแล้ว ไม่มีอะไรต้องเติม',
);

await db.$disconnect();
