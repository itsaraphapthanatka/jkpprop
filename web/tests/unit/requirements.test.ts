/* Normalising what arrives on a requirement, before it reaches the database. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { requirementInput, asLocations, CANCEL_FIELDS, STATUS_LABEL, REQUIREMENT_STATUSES, requirementFromForm, parseRange } from '../../src/lib/server/requirements.ts';

describe('requirement input', () => {
  test('a range typed the wrong way round is stored the way it reads', () => {
    const r = requirementInput({ areaMin: 5000, areaMax: 1000, budgetMin: 300000, budgetMax: 100000 });
    assert.equal(r.areaMin, 1000);
    assert.equal(r.areaMax, 5000);
    assert.equal(r.budgetMin, 100000);
    assert.equal(r.budgetMax, 300000);
  });

  test('one open end stays open rather than being invented', () => {
    const r = requirementInput({ areaMin: 2000 });
    assert.equal(r.areaMin, 2000);
    assert.equal(r.areaMax, null);
  });

  test('empty, junk and negative numbers become null, not 0', () => {
    for (const v of ['', null, undefined, 'ประมาณสองพัน', -5, NaN]) {
      assert.equal(requirementInput({ areaMin: v }).areaMin, null, `${String(v)} should be null`);
    }
  });

  test('a number arriving as a string still counts', () => {
    assert.equal(requirementInput({ areaMin: '2500' }).areaMin, 2500);
  });

  test('an unparseable date is dropped instead of storing Invalid Date', () => {
    assert.equal(requirementInput({ moveIn: 'เร็ว ๆ นี้' }).moveIn, null);
    assert.equal(requirementInput({ moveIn: '' }).moveIn, null);
    const good = requirementInput({ moveIn: '2026-09-01' }).moveIn;
    assert.ok(good instanceof Date && !Number.isNaN(good.getTime()));
  });

  test('the checkbox flags only accept a real yes', () => {
    assert.equal(requirementInput({ needsRor4: true }).needsRor4, true);
    assert.equal(requirementInput({ needsRor4: 'true' }).needsRor4, true);
    for (const v of ['false', 'no', 0, null, undefined, 'ใช่']) {
      assert.equal(requirementInput({ needsRor4: v }).needsRor4, false, `${String(v)} should not mean yes`);
    }
  });

  test('free text is bounded so one paste cannot fill the column', () => {
    const r = requirementInput({ note: 'ก'.repeat(5000), pollution: 'ข'.repeat(900) });
    assert.equal(r.note.length, 2000);
    assert.equal(r.pollution.length, 200);
  });
});

describe('locations', () => {
  test('accepts both plain strings and {name} objects, and trims blanks', () => {
    assert.deepEqual(asLocations(['สมุทรปราการ', ' ', { name: ' ชลบุรี ' }, '']), [
      { name: 'สมุทรปราการ' }, { name: 'ชลบุรี' },
    ]);
  });

  test('a non-list is no locations, not a crash', () => {
    for (const v of [null, undefined, 'สมุทรปราการ', 42, {}]) assert.deepEqual(asLocations(v), []);
  });

  test('the ranked list is capped', () => {
    assert.equal(asLocations(Array.from({ length: 40 }, (_, i) => `จ.${i}`)).length, 10);
  });
});

describe('statuses and cancel reasons', () => {
  test('every status has a Thai label', () => {
    for (const s of REQUIREMENT_STATUSES) assert.ok(STATUS_LABEL[s], `${s} has no label`);
  });

  /* FR-CRM-07: cancelling names the requirement item that failed, so the keys
     have to stay stable — reports are grouped by them. */
  test('the cancel reasons are the six the spec lists', () => {
    assert.deepEqual(CANCEL_FIELDS.map((f) => f.key), ['budget', 'size', 'area', 'license', 'timeline', 'other']);
    for (const f of CANCEL_FIELDS) assert.ok(f.label, `${f.key} has no label`);
  });
});

describe('reading a requirement out of the form', () => {
  const F = (pairs: [string, string][]) => pairs.map(([k, v]) => ({ k, v }));

  test('sizes and budgets come across, whatever the labels are called', () => {
    // a warehouse enquiry
    const r = requirementFromForm(
      F([['ขนาดพื้นที่', '2,000 – 3,500 ตร.ม.'], ['งบเช่า', '฿150,000 – 250,000/ด.'], ['ทำเล / ย่านที่สนใจ', 'สมุทรปราการ, ชลบุรี']]),
      { dealIntent: 'เช่า', typeKey: 'warehouse' },
    );
    assert.equal(r.areaMin, 2000);
    assert.equal(r.areaMax, 3500);
    assert.equal(r.budgetMin, 150000);
    assert.equal(r.budgetMax, 250000);
    assert.deepEqual(asLocations(r.locations), [{ name: 'สมุทรปราการ' }, { name: 'ชลบุรี' }]);
  });

  test('a condo enquiry uses different labels and still lands', () => {
    const r = requirementFromForm(
      F([['ประเภทห้อง', 'Studio'], ['ทำเล / ย่านที่สนใจ', 'อโศก'], ['งบประมาณ', '5–8 ล้าน']]),
      { dealIntent: 'เช่า', typeKey: 'condo' },
    );
    assert.equal(r.usage, 'Studio');
    assert.deepEqual(asLocations(r.locations), [{ name: 'อโศก' }]);
    // "ล้าน" means millions — 5 and 8 would be nonsense as baht
    assert.equal(r.budgetMin, 5_000_000);
    assert.equal(r.budgetMax, 8_000_000);
  });

  /* "ไม่มี" contains "มี"; a substring test reads the answer backwards. */
  test('a no about the licence is not read as a yes', () => {
    const yes = ['ใช่', 'ต้องการ', 'ต้องมี', 'มี'];
    const no = ['ไม่ใช่', 'ไม่ต้องการ', 'ไม่มี', 'ไม่ระบุ', ''];
    for (const v of yes) {
      assert.equal(requirementFromForm(F([['ต้องการ ร.ง.4', v]]), {}).needsRor4, true, `"${v}" should be yes`);
    }
    for (const v of no) {
      assert.equal(requirementFromForm(F([['ต้องการ ร.ง.4', v]]), {}).needsRor4, false, `"${v}" should be no`);
    }
  });

  test('a floor area is never mistaken for a province', () => {
    const r = requirementFromForm(F([['พื้นที่ใช้สอย', '3,000 ตร.ม.']]), {});
    assert.equal(r.areaMin, 3000);
    assert.deepEqual(asLocations(r.locations), [], 'the size leaked into the location list');
  });

  test('nothing usable stays empty rather than becoming zero', () => {
    const r = requirementFromForm(F([['งบประมาณ', 'แล้วแต่คุยกัน'], ['ขนาด', 'ยังไม่แน่ใจ']]), {});
    assert.equal(r.areaMin, null);
    assert.equal(r.budgetMin, null);
  });

  test('an empty or malformed submission does not throw', () => {
    for (const bad of [[], null, undefined, 'nonsense']) {
      const r = requirementFromForm(bad as never, {});
      assert.equal(r.areaMin, null);
      assert.deepEqual(asLocations(r.locations), []);
    }
  });
});

describe('parseRange', () => {
  test('reads one number, two numbers, and millions', () => {
    assert.deepEqual(parseRange('2,000 ตร.ม.'), [2000, null]);
    assert.deepEqual(parseRange('1,000–3,000 ตร.ม.'), [1000, 3000]);
    assert.deepEqual(parseRange('฿5 ล้าน'), [5_000_000, null]);
    assert.deepEqual(parseRange(''), [null, null]);
    assert.deepEqual(parseRange('ไม่ระบุ'), [null, null]);
  });

  test('the smaller number is always first', () => {
    assert.deepEqual(parseRange('3,500 ลงมาถึง 2,000'), [2000, 3500]);
  });

  /* "150,000/เดือน" holds no "ล้าน" — treating a stray letter as a millions
     marker multiplied ordinary rents by a million. */
  test('a monthly rent is not multiplied by a million', () => {
    assert.deepEqual(parseRange('150,000/เดือน'), [150000, null]);
    assert.deepEqual(parseRange('80,000 baht per month'), [80000, null]);
  });
});
