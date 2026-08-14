/* Which language a reader gets, and what counts as translated.
   The Thai title is the record's own; English and Chinese are translations of
   it, and a missing one has to fall back rather than render empty. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseI18n, localTitle, localDescription, missingTitles, TRANSLATABLE } from '../../src/lib/server/propertyI18n.ts';

const rec = (i18n: unknown) => ({ title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', i18n });

describe('reading the stored translations', () => {
  test('junk in the column is not junk on the page', () => {
    for (const bad of [null, undefined, 'nonsense', 42, [], { en: 'a string' }, { en: null }]) {
      assert.deepEqual(parseI18n(bad), {}, `${JSON.stringify(bad)} should read as nothing`);
    }
  });

  test('a language with nothing in it is left out, not stored empty', () => {
    assert.deepEqual(parseI18n({ en: { title: '   ', description: '' } }), {});
  });

  test('only the two translatable languages are kept — Thai is the source', () => {
    const out = parseI18n({ th: { title: 'ไทย' }, en: { title: 'EN' }, fr: { title: 'FR' } });
    assert.deepEqual(Object.keys(out), ['en']);
    assert.deepEqual(TRANSLATABLE, ['en', 'zh']);
  });

  test('a pasted essay cannot fill the column', () => {
    const out = parseI18n({ en: { title: 'x'.repeat(500), description: 'y'.repeat(5000) } });
    assert.equal(out.en!.title.length, 300);
    assert.equal(out.en!.description.length, 2000);
  });
});

describe('what the reader sees', () => {
  test('an untranslated record shows the Thai title rather than a blank card', () => {
    assert.equal(localTitle(rec({}), 'en'), 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.');
    assert.equal(localTitle(rec({ zh: { title: '仓库' } }), 'en'), 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.');
  });

  test('the translation wins when there is one', () => {
    const r = rec({ en: { title: 'Warehouse with office, 2,700 sqm', description: 'Near Bangna.' }, zh: { title: '带办公室的仓库' } });
    assert.equal(localTitle(r, 'en'), 'Warehouse with office, 2,700 sqm');
    assert.equal(localTitle(r, 'zh'), '带办公室的仓库');
    assert.equal(localDescription(r, 'en'), 'Near Bangna.');
  });

  test('Thai always reads the record\'s own title, whatever is in the column', () => {
    assert.equal(localTitle(rec({ th: { title: 'ชื่ออื่น' } } as never), 'th'), 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.');
  });

  /* A description has no Thai original to fall back to — showing the Thai one
     under an English title would be worse than showing none. */
  test('a missing description stays empty instead of falling back', () => {
    assert.equal(localDescription(rec({ en: { title: 'Warehouse' } }), 'en'), '');
    assert.equal(localDescription(rec({}), 'th'), '');
  });
});

describe('the "แปลไม่ครบ" count', () => {
  test('counts languages with no title, and ignores a description on its own', () => {
    assert.deepEqual(missingTitles(rec({})), ['en', 'zh']);
    assert.deepEqual(missingTitles(rec({ en: { title: 'Warehouse' } })), ['zh']);
    assert.deepEqual(missingTitles(rec({ en: { title: 'W' }, zh: { title: '仓' } })), []);
    // a description without a title is not a translated listing
    assert.deepEqual(missingTitles(rec({ en: { description: 'only a description' } })), ['en', 'zh']);
  });
});

describe('place names', () => {
  test('the province is translated, the district romanised', async () => {
    const { provinceLabel, districtLabel } = await import('../../src/i18n/places.ts');
    assert.equal(provinceLabel('ชลบุรี', 'en'), 'Chonburi');
    assert.equal(provinceLabel('ชลบุรี', 'zh'), '春武里');
    assert.equal(districtLabel('ศรีราชา', 'en'), 'Si Racha');
    // Chinese takes the same Latin form rather than an invented Chinese name
    assert.equal(districtLabel('ศรีราชา', 'zh'), 'Si Racha');
  });

  test('Thai readers keep the address exactly as the team typed it', async () => {
    const { provinceLabel, districtLabel } = await import('../../src/i18n/places.ts');
    assert.equal(provinceLabel('ชลบุรี', 'th'), 'ชลบุรี');
    assert.equal(districtLabel('ศรีราชา', 'th'), 'ศรีราชา');
  });

  /* A place we have no entry for must come through unchanged — the alternative
     is a blank where the address should be. */
  test('an unknown place is left alone, not dropped', async () => {
    const { provinceLabel, districtLabel } = await import('../../src/i18n/places.ts');
    assert.equal(districtLabel('อำเภอที่ยังไม่มีในตาราง', 'en'), 'อำเภอที่ยังไม่มีในตาราง');
    assert.equal(provinceLabel('', 'en'), '');
    assert.equal(provinceLabel(null, 'en'), '');
  });

  /* Chinese has established names for perhaps a third of the provinces; the
     rest fall back to the romanisation, which a Chinese reader can at least
     match against a map — unlike Thai script. */
  test('a province with no Chinese name falls back to the romanisation', async () => {
    const { provinceLabel } = await import('../../src/i18n/places.ts');
    assert.equal(provinceLabel('บึงกาฬ', 'zh'), 'Bueng Kan');
    assert.equal(provinceLabel('บึงกาฬ', 'en'), 'Bueng Kan');
  });

  test('the address on a card reads in the visitor\'s language', async () => {
    const { displayLocation } = await import('../../src/lib/server/propertyDto.ts');
    const values = { district: 'บางพลี', province: 'สมุทรปราการ' };
    assert.equal(displayLocation(values), 'บางพลี, สมุทรปราการ');
    assert.equal(displayLocation(values, 'en'), 'Bang Phli, Samut Prakan');
    assert.equal(displayLocation(values, 'zh'), 'Bang Phli, 北榄');
  });
});
