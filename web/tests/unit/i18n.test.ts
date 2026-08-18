/* i18n plumbing — catches the two ways a translation layer rots:
   a key present in one locale but not another, and an option value that
   silently ships untranslated. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalProvince, sameProvince, provinceLabel } from '../../src/i18n/places.ts';
import { LOCALES, DEFAULT_LOCALE, isLocale, localizePath, HTML_LANG, LOCALE_LABEL } from '../../src/i18n/config.ts';
import { getDictionary, type Dictionary } from '../../src/i18n/dictionaries.ts';
import { enumLabel, untranslated } from '../../src/i18n/enums.ts';
import { getFaq, getFaqUi, FAQ_KEYS } from '../../src/i18n/faq.ts';
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

/* ชื่อจังหวัดที่คนกรอกกับชื่อที่แผนที่ใช้ ไม่เคยตรงกันเอง
   ข้อมูลจริงเขียน "กรุงเทพ" 256 รายการ ลิงก์จากแผนที่ส่ง "กรุงเทพมหานคร"
   หน้ารายการจึงว่างเปล่าทั้งที่มีทรัพย์อยู่ */
describe('ชื่อจังหวัดที่เขียนคนละแบบ', () => {
  test('รูปมาตรฐานเดียวกัน', () => {
    for (const v of ['กรุงเทพ', 'กรุงเทพฯ', 'กทม.', 'จังหวัดกรุงเทพมหานคร', 'กรุงเทพมหานคร']) {
      assert.equal(canonicalProvince(v), 'กรุงเทพมหานคร', v);
    }
  });

  test('เทียบกันได้ไม่ว่าจะเขียนแบบไหน', () => {
    assert.ok(sameProvince('กรุงเทพ', 'กรุงเทพมหานคร'));
    assert.ok(sameProvince('จังหวัดสมุทรปราการ', 'สมุทรปราการ'));
    assert.ok(!sameProvince('กรุงเทพ', 'สมุทรปราการ'));
  });

  test('ป้ายภาษาอื่นก็ตามไปด้วย', () => {
    assert.equal(provinceLabel('กรุงเทพ', 'en'), 'Bangkok');
    assert.equal(provinceLabel('กรุงเทพ', 'zh'), '曼谷');
  });
});

describe('faq content', () => {
  const th = getFaq('th');

  test('every locale carries the canonical categories in the canonical order', () => {
    for (const locale of LOCALES) {
      assert.deepEqual(getFaq(locale).map((c) => c.key), [...FAQ_KEYS], `${locale} category order drifted`);
    }
  });

  test('every locale answers exactly the same questions', () => {
    const shape = th.map((c) => [c.key, c.qs.length] as const);
    for (const locale of LOCALES) {
      assert.deepEqual(getFaq(locale).map((c) => [c.key, c.qs.length] as const), shape,
        `${locale} has a different number of questions in some category`);
    }
  });

  test('no category title, question or answer is blank', () => {
    for (const locale of LOCALES) {
      for (const c of getFaq(locale)) {
        assert.notEqual(c.title.trim(), '', `${locale}/${c.key} has no title`);
        c.qs.forEach(({ q, a }, i) => {
          assert.notEqual(q.trim(), '', `${locale}/${c.key}[${i}] has no question`);
          assert.notEqual(a.trim(), '', `${locale}/${c.key}[${i}] has no answer`);
        });
      }
    }
  });

  /* the live site shipped a published FAQ entry with an empty body; this
     is the guard that stops a stub reaching readers again */
  test('every answer is a real answer, not a stub', () => {
    for (const locale of LOCALES) {
      for (const c of getFaq(locale)) {
        c.qs.forEach(({ q, a }, i) => {
          const min = locale === 'zh' ? 40 : 80; // zh says the same thing in fewer characters
          assert.ok(a.trim().length >= min, `${locale}/${c.key}[${i}] answer looks like a stub: "${q}"`);
          assert.ok(!/^(tbd|todo|n\/a|-+)$/i.test(a.trim()), `${locale}/${c.key}[${i}] is a placeholder`);
        });
      }
    }
  });

  test('en and zh are translated, not copies of the Thai', () => {
    for (const locale of ['en', 'zh'] as const) {
      const cats = getFaq(locale);
      cats.forEach((c, ci) => {
        assert.notEqual(c.title, th[ci].title, `${locale}/${c.key} title left in Thai`);
        c.qs.forEach(({ q, a }, i) => {
          assert.notEqual(q, th[ci].qs[i].q, `${locale}/${c.key}[${i}] question left in Thai`);
          assert.notEqual(a, th[ci].qs[i].a, `${locale}/${c.key}[${i}] answer left in Thai`);
        });
      });
    }
  });

  test('category keys are unique, so the #anchors and openMap keys cannot collide', () => {
    assert.equal(new Set(FAQ_KEYS).size, FAQ_KEYS.length);
  });

  test('page chrome is defined in every locale with the same keys and no blanks', () => {
    const keys = Object.keys(getFaqUi('th')).sort();
    for (const locale of LOCALES) {
      const ui = getFaqUi(locale);
      assert.deepEqual(Object.keys(ui).sort(), keys, `${locale} chrome keys drifted`);
      for (const [k, v] of Object.entries(ui)) {
        assert.notEqual(v.trim(), '', `${locale} chrome.${k} is blank`);
      }
    }
  });

  test('an unknown locale falls back to Thai rather than rendering nothing', () => {
    assert.deepEqual(getFaq('de' as never), th);
    assert.deepEqual(getFaqUi('de' as never), getFaqUi('th'));
  });
});
