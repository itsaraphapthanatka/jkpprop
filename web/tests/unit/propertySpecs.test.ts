/* The public spec table against the org's Field Builder settings.
   Switching a field off used to hide it from the admin form only — the page
   kept printing whatever was already stored — and a field the team added
   never appeared at all. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildSpecs } from '../../src/lib/server/propertySpecs.ts';

const values = {
  province: 'ชลบุรี', usable_area: 2700, parking: '20 คัน',
  custom_warehouse_number_1: 4200,
};
const extra = [{
  key: 'custom_warehouse_number_1', label: 'ค่าไฟเฉลี่ย/เดือน',
  labelEn: 'Average electricity / month', labelZh: '每月平均电费',
  kind: 'number' as const, unit: 'บาท',
}];
const labels = (rows: { label: string }[]) => rows.map((r) => r.label);

describe('the spec table follows the Field Builder', () => {
  test('with no override, nothing changes', () => {
    const rows = labels(buildSpecs(values, 'th').rows);
    assert.ok(rows.includes('ที่จอดรถ'));
  });

  test('a field switched off leaves the page, even with a value stored', () => {
    const rows = labels(buildSpecs(values, 'th', { disabled: ['parking'] }).rows);
    assert.ok(!rows.includes('ที่จอดรถ'), 'a disabled field must not reach the public page');
    assert.ok(rows.includes('พื้นที่ใช้สอย'), 'the others stay');
  });

  test('the four tiles obey it too, not just the table', () => {
    const quick = labels(buildSpecs({ ...values, clear_height: 12 }, 'th', { disabled: ['usable_area'] }).quick);
    assert.ok(!quick.includes('พื้นที่ใช้สอย'));
  });

  test('a field the team added shows up, with its unit', () => {
    const rows = buildSpecs(values, 'th', { extra }).rows;
    const row = rows.find((r) => r.key === 'custom_warehouse_number_1');
    assert.ok(row, 'the custom field never reached the table');
    assert.equal(row!.label, 'ค่าไฟเฉลี่ย/เดือน (บาท)');
    assert.equal(row!.value, '4,200');
  });

  test('it reads in the visitor\'s language when the team wrote one', () => {
    assert.equal(buildSpecs(values, 'en', { extra }).rows.find((r) => r.key === extra[0].key)!.label, 'Average electricity / month (บาท)');
    assert.equal(buildSpecs(values, 'zh', { extra }).rows.find((r) => r.key === extra[0].key)!.label, '每月平均电费 (บาท)');
  });

  /* A name in only one language must not make the row disappear on the
     others — the Thai label is better than a missing spec. */
  test('an untranslated custom field falls back to its Thai name', () => {
    const onlyThai = [{ ...extra[0], labelEn: '', labelZh: '' }];
    assert.equal(buildSpecs(values, 'en', { extra: onlyThai }).rows.find((r) => r.key === extra[0].key)!.label, 'ค่าไฟเฉลี่ย/เดือน (บาท)');
  });

  test('a custom field with nothing filled in produces no row', () => {
    const rows = buildSpecs({ province: 'ชลบุรี' }, 'th', { extra }).rows;
    assert.ok(!rows.some((r) => r.key === extra[0].key));
  });

  test('switching off a custom field hides it as well', () => {
    const rows = buildSpecs(values, 'th', { extra, disabled: [extra[0].key] }).rows;
    assert.ok(!rows.some((r) => r.key === extra[0].key));
  });
});
