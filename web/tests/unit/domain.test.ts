/* Domain logic the UI and the server must agree on to the character:
   lease alerts, the post-summary text, and schema resolution. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildAlerts, unreadCount, DEFAULT_NOTIFY, type Lease, type NotifyConfig } from '../../src/lib/leaseStore.ts';
import { buildSummary } from '../../src/lib/summaryTemplate.ts';
import { resolveFields, PROPERTY_TYPES, enabledPropertyTypes, requirementFields } from '../../src/lib/propertySchema.ts';

const lease = (id: string, endsInDays: number): Lease => ({
  id, code: 'JKP-TEST', title: 't', tenant: 'x', endsInDays, rent: 1000, href: '/admin/deals',
});
const cfg = (o: Partial<NotifyConfig> = {}): NotifyConfig => ({ ...DEFAULT_NOTIFY, ...o });

describe('lease alerts', () => {
  const book = [lease('a', -6), lease('b', 12), lease('c', 26), lease('d', 48), lease('e', 74), lease('f', 96), lease('g', 210)];

  test('returns nothing when notifications are switched off', () => {
    assert.deepEqual(buildAlerts(cfg({ enabled: false }), book), []);
  });

  // the counts published in FRONTEND_API_SPEC §7.3 for this exact 7-lease book
  test('the documented counts hold: [1,3]+expired → 5, [1] → 2, [3] → 4', () => {
    assert.equal(buildAlerts(cfg({ months: [1, 3], includeExpired: true }), book).length, 5);
    assert.equal(buildAlerts(cfg({ months: [1], includeExpired: false }), book).length, 2);
    assert.equal(buildAlerts(cfg({ months: [3], includeExpired: false }), book).length, 4);
  });

  test('expired leases are excluded unless includeExpired is on', () => {
    const off = buildAlerts(cfg({ months: [1, 3], includeExpired: false }), book);
    assert.ok(!off.some((a) => a.level === 'expired'));
    assert.equal(off.length, 4);
  });

  test('one alert per lease, using the tightest milestone crossed', () => {
    const alerts = buildAlerts(cfg({ months: [1, 2, 3], includeExpired: true }), [lease('a', 12)]);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].milestone, 1); // 12 days fits inside 1 month (30d), not 2 or 3
    assert.equal(alerts[0].level, 'urgent');
  });

  test('a month is a fixed 30 days — 31 days out misses the 1-month window', () => {
    assert.equal(buildAlerts(cfg({ months: [1], includeExpired: false }), [lease('a', 30)]).length, 1);
    assert.equal(buildAlerts(cfg({ months: [1], includeExpired: false }), [lease('a', 31)]).length, 0);
  });

  test('alert ids are stable across reloads so "read" sticks', () => {
    const first = buildAlerts(cfg(), book).map((a) => a.id);
    const second = buildAlerts(cfg(), book).map((a) => a.id);
    assert.deepEqual(first, second);
  });

  test('crossing into a tighter milestone mints a new id, re-alerting on purpose', () => {
    const wide = buildAlerts(cfg({ months: [1, 3] }), [lease('a', 80)])[0];
    const tight = buildAlerts(cfg({ months: [1, 3] }), [lease('a', 20)])[0];
    assert.notEqual(wide.id, tight.id);
  });

  test('read ids mark alerts as read and drop the unread count', () => {
    const ids = buildAlerts(cfg(), book).map((a) => a.id);
    const alerts = buildAlerts(cfg({ readIds: ids.slice(0, 2) }), book);
    assert.equal(unreadCount(alerts), alerts.length - 2);
  });

  test('sorted most urgent first', () => {
    const days = buildAlerts(cfg({ months: [1, 2, 3], includeExpired: true }), book).map((a) => a.daysLeft);
    assert.deepEqual(days, [...days].sort((x, y) => x - y));
  });
});

describe('post summary', () => {
  const values = {
    deal_type: 'เช่า', subdistrict: 'บางพลีใหญ่', district: 'บางพลี', province: 'สมุทรปราการ',
    building_area_total: 2700, price_rent: 405000,
    internal_note: 'ห้ามหลุด: ต่อรองได้ถึง 380k เบอร์คนเฝ้า 08x',
  };

  test('never leaks an internalOnly field into the copy-out text', () => {
    const { text } = buildSummary({ typeLabel: 'โกดัง', code: 'JKP-SPK0042', values });
    assert.ok(!text.includes('ห้ามหลุด'));
    assert.ok(!text.includes('08x'));
  });

  test('includes the code and the headline figures', () => {
    const { text } = buildSummary({ typeLabel: 'โกดัง', code: 'JKP-SPK0042', values });
    assert.ok(text.includes('JKP-SPK0042'));
    assert.ok(text.includes('2700'));
    assert.ok(text.includes('405000'));
  });

  test('keeps empty rows — ops paste the skeleton and fill it in', () => {
    const { text, filled, total } = buildSummary({ typeLabel: 'โกดัง', values: {} });
    assert.equal(filled, 0);
    assert.ok(total > 0);
    assert.ok(text.includes('- ที่ตั้ง :'));
  });

  test('filled counts only rows that actually got a value', () => {
    const { filled } = buildSummary({ typeLabel: 'โกดัง', values: { price_rent: 1 } });
    assert.equal(filled, 1);
  });
});

describe('property schema', () => {
  test('required fields cannot be disabled', () => {
    const type = PROPERTY_TYPES.find((t) => t.key === 'warehouse')!;
    const required = type.fields.filter((f) => f.required).map((f) => f.key);
    const resolved = resolveFields('warehouse', { disabled: required, order: [], extra: [] });
    for (const key of required) {
      assert.equal(resolved.find((f) => f.key === key)?.enabled, true, `${key} must stay enabled`);
    }
  });

  test('a non-required field can be disabled', () => {
    const resolved = resolveFields('house', { disabled: ['maid_room'], order: [], extra: [] });
    assert.equal(resolved.find((f) => f.key === 'maid_room')?.enabled, false);
  });

  test('saved order wins, remaining fields keep their original sequence', () => {
    const resolved = resolveFields('house', { disabled: [], order: ['photos', 'deal_type'], extra: [] });
    assert.equal(resolved[0].key, 'photos');
    assert.equal(resolved[1].key, 'deal_type');
  });

  test('custom fields are appended and resolvable', () => {
    const resolved = resolveFields('land', { disabled: [], order: [], extra: [{ key: 'custom_x', label: 'ทดสอบ', kind: 'text' }] });
    assert.ok(resolved.some((f) => f.key === 'custom_x' && f.enabled));
  });

  test('showWhen is NOT applied here — it is a render-time concern', () => {
    // documented trap: resolveFields must not be used to decide what is required
    const resolved = resolveFields('warehouse');
    const priceSale = resolved.find((f) => f.key === 'price_sale');
    assert.ok(priceSale?.showWhen, 'price_sale is conditional');
    assert.equal(priceSale?.enabled, true, 'yet it still resolves as enabled');
  });

  test('turning off every type falls back to all of them rather than an empty form', () => {
    const all = PROPERTY_TYPES.map((t) => t.key);
    assert.equal(enabledPropertyTypes({ disabled: all }).length, PROPERTY_TYPES.length);
  });

  test('showroom silently reuses the warehouse requirement set', () => {
    assert.deepEqual(requirementFields('showroom'), requirementFields('warehouse'));
  });
});
