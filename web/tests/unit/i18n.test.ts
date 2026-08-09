/* i18n plumbing — catches the two ways a translation layer rots:
   a key present in one locale but not another, and an option value that
   silently ships untranslated. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALES, DEFAULT_LOCALE, isLocale, localizePath, HTML_LANG, LOCALE_LABEL } from '../../src/i18n/config.ts';
import { getDictionary, type Dictionary } from '../../src/i18n/dictionaries.ts';
import { enumLabel, untranslated } from '../../src/i18n/enums.ts';
import { PROPERTY_TYPES } from '../../src/lib/propertySchema.ts';

const leafKeys = (o: unknown, prefix = ''): string[] =>
  typeof o === 'object' && o !== null
    ? Object.entries(o).flatMap(([k, v]) => leafKeys(v, prefix ? `${prefix}.${k}` : k))
    : [prefix];

describe('locale config', () => {
  test('th is the default and every locale has a lang code and a label', () => {
    assert.equal(DEFAULT_LOCALE, 'th');
    for (const l of LOCALES) {
      assert.ok(HTML_LANG[l], `${l} needs an html lang`);
      assert.ok(LOCALE_LABEL[l], `${l} needs a switcher label`);
    }
  });

  test('isLocale accepts the three locales and nothing else', () => {
    for (const l of LOCALES) assert.ok(isLocale(l));
    for (const bad of ['jp', 'TH', '', 'admin']) assert.equal(isLocale(bad), false);
  });

  test('localizePath swaps the locale segment rather than stacking them', () => {
    assert.equal(localizePath('/th/listing', 'en'), '/en/listing');
    assert.equal(localizePath('/en', 'zh'), '/zh');
    assert.equal(localizePath('/', 'th'), '/th');
    assert.equal(localizePath('/th/property/JKP-SPK0042', 'zh'), '/zh/property/JKP-SPK0042');
  });

  test('a path that merely starts with a locale-like word is left alone', () => {
    assert.equal(localizePath('/theme', 'en'), '/en/theme');
  });
});

describe('dictionaries', () => {
  const thKeys = leafKeys(getDictionary('th')).sort();

  for (const locale of LOCALES) {
    test(`${locale} defines exactly the same keys as th`, () => {
      assert.deepEqual(leafKeys(getDictionary(locale)).sort(), thKeys);
    });

    test(`${locale} has no empty strings`, () => {
      const walk = (o: unknown): void => {
        if (typeof o === 'string') { assert.notEqual(o.trim(), '', 'empty translation'); return; }
        if (typeof o === 'object' && o) Object.values(o).forEach(walk);
      };
      walk(getDictionary(locale));
    });
  }

  test('en and zh actually differ from th (not copy-pasted placeholders)', () => {
    const t = getDictionary('th') as Dictionary;
    for (const locale of ['en', 'zh'] as const) {
      const d = getDictionary(locale) as Dictionary;
      assert.notEqual(d.nav.home, t.nav.home, `${locale} nav.home was left in Thai`);
      assert.notEqual(d.form.submit, t.form.submit, `${locale} form.submit was left in Thai`);
    }
  });

  test('an unknown locale falls back to th instead of crashing', () => {
    assert.deepEqual(getDictionary('de' as never), getDictionary('th'));
  });
});

describe('enum labels', () => {
  test('th passes values straight through', () => {
    assert.equal(enumLabel('เช่า', 'th'), 'เช่า');
  });

  test('the values that reach the public site are translated', () => {
    assert.equal(enumLabel('เช่า', 'en'), 'For rent');
    assert.equal(enumLabel('ขาย', 'zh'), '出售');
  });

  test('an unmapped value degrades to the stored text, never to blank', () => {
    assert.equal(enumLabel('ค่าที่ยังไม่ได้แปล', 'en'), 'ค่าที่ยังไม่ได้แปล');
  });

  test('every deal_type option in the schema has an en and zh label', () => {
    const dealOptions = PROPERTY_TYPES.flatMap((t) => t.fields)
      .filter((f) => f.kind === 'dealtype')
      .flatMap((f) => f.options ?? []);
    for (const locale of ['en', 'zh'] as const) {
      assert.deepEqual(untranslated(dealOptions, locale), [], `deal_type options missing ${locale}`);
    }
  });

  test('every property-type label has an en and zh label', () => {
    const labels = PROPERTY_TYPES.map((t) => t.label);
    for (const locale of ['en', 'zh'] as const) {
      assert.deepEqual(untranslated(labels, locale), [], `property types missing ${locale}`);
    }
  });
});
