/* The editor must offer exactly the fields the page renders.
 *
 * This drifted badly and nobody could see it: /admin/sections showed six text
 * inputs and an image box on every block, while most blocks read two or three
 * of them. Typing into the rest saved a row to the database and changed
 * nothing on the site — and there was no way to tell which inputs were live
 * short of reading the components.
 *
 * So the catalogue's `supports` list is checked against the components' source
 * in both directions. A field declared but not read is a box that lies; a
 * field read but not declared is content with no way in.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SECTION_CATALOG, type SectionField } from '../../src/lib/sectionCatalog.ts';

/* Where each section is rendered, and the prop the component reads it from.
   Keep in step when a block moves file. */
const RENDERED_BY: Record<string, { file: string; prop: string }> = {
  'home:h': { file: 'src/components/home/Hero.tsx', prop: 'copy' },
  'home:n': { file: 'src/components/home/Featured.tsx', prop: 'copy' },
  'home:l': { file: 'src/components/home/LocationFinder.tsx', prop: 'copy' },
  'home:s': { file: 'src/components/home/Steps.tsx', prop: 'copy' },
  'home:w': { file: 'src/components/home/WhyUs.tsx', prop: 'copy' },
  'home:wk': { file: 'src/components/home/WhyUs.tsx', prop: 'kpiCopy' },
  'home:ct': { file: 'src/components/home/Certifications.tsx', prop: 'copy' },
  'home:tg': { file: 'src/components/home/TrustGallery.tsx', prop: 'copy' },
  'home:c': { file: 'src/components/home/CtaBand.tsx', prop: 'copy' },
  'about:ah': { file: 'src/components/site/AboutBody.tsx', prop: 'copy.ah' },
  'about:st': { file: 'src/components/site/AboutBody.tsx', prop: 'copy.st' },
  'about:pl': { file: 'src/components/site/AboutBody.tsx', prop: 'copy.pl' },
  'about:as': { file: 'src/components/site/AboutBody.tsx', prop: 'copy.as' },
  'about:aw': { file: 'src/components/site/AboutBody.tsx', prop: 'copy.aw' },
  'about:pr': { file: 'src/components/site/AboutBody.tsx', prop: 'copy.pr' },
  'contact:ch': { file: 'src/components/site/ContactBody.tsx', prop: 'copy.ch' },
  'contact:cm': { file: 'src/components/site/ContactBody.tsx', prop: 'copy.cm' },
};

const ALL: SectionField[] = ['eyebrow', 'headline', 'sub', 'cta', 'note', 'img', 'items'];
const src = new Map<string, string>();
const read = (f: string) => {
  if (!src.has(f)) src.set(f, readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8'));
  return src.get(f)!;
};

/** `items` is read as either the strict list or the Thai-fallback one */
const readsField = (file: string, prop: string, field: SectionField) => {
  const body = read(file);
  const names = field === 'items' ? ['items', 'itemsAny'] : [field];
  return names.some((n) => new RegExp(`${prop.replace('.', '\\.')}\\.${n}\\b`).test(body));
};

describe('the section editor offers exactly what the page renders', () => {
  for (const [page, defs] of Object.entries(SECTION_CATALOG)) {
    for (const def of defs) {
      const key = `${page}:${def.key}`;
      const where = RENDERED_BY[key];

      test(`${key} (${def.name}) is rendered somewhere`, () => {
        assert.ok(where, `${key} is in the catalogue but no component is listed as rendering it`);
      });

      if (!where) continue;

      test(`${key} declares every field it reads`, () => {
        const missing = ALL.filter((f) => readsField(where.file, where.prop, f) && !def.supports.includes(f));
        assert.deepEqual(missing, [], `${where.file} reads ${missing.join(', ')} — add to supports, or the editor gives no way to set it`);
      });

      test(`${key} reads every field it declares`, () => {
        const dead = def.supports.filter((f) => !readsField(where.file, where.prop, f));
        assert.deepEqual(dead, [], `supports lists ${dead.join(', ')} but ${where.file} never reads them — the editor would show a box that does nothing`);
      });

      if (def.items) {
        test(`${key} declares items because it has a list editor`, () => {
          assert.ok(def.supports.includes('items'), 'a section with an item editor must support items');
        });
      }
    }
  }
});

describe('the publish switch', () => {
  /* A block whose switch is drawn but not read is worse than no switch: the
     team turns it off, the claim stays up, and they believe it is gone. */
  const PAGE_LEVEL = 'src/app/[locale]/page.tsx';

  for (const [page, defs] of Object.entries(SECTION_CATALOG)) {
    for (const def of defs) {
      const key = `${page}:${def.key}`;
      const where = RENDERED_BY[key];
      if (!where || def.canDisable === false) continue;

      test(`${key} actually honours its switch`, () => {
        const inComponent = readsField(where.file, where.prop, 'enabled' as SectionField);
        const atPageLevel = page === 'home' && new RegExp(`section\\(c, '${def.key}'\\)\\.enabled`).test(read(PAGE_LEVEL));
        assert.ok(inComponent || atPageLevel, `${key} shows an on/off switch that nothing reads`);
      });
    }
  }

  test('heroes say so instead of showing a switch that does nothing', () => {
    for (const [page, defs] of Object.entries(SECTION_CATALOG)) {
      const hero = defs.find((d) => d.type === 'hero');
      assert.ok(hero, `${page} has no hero`);
      assert.equal(hero.canDisable, false, `${page}'s hero must be marked canDisable: false`);
    }
  });
});
