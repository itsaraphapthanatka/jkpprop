/* Normalising what arrives on a requirement, before it reaches the database. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { requirementInput, asLocations, CANCEL_FIELDS, STATUS_LABEL, REQUIREMENT_STATUSES } from '../../src/lib/server/requirements.ts';

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
