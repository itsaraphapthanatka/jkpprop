/* What may enter the lease book. Nothing validated it before — the table was
   written once by the installer's seed and had no create route at all. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { leaseInput } from '../../src/lib/server/leases.ts';

const base = { code: 'jkp-spk0042', tenant: 'บ. ตัวอย่าง', endDate: '2027-01-31', rent: 405000 };

describe('a lease before it is stored', () => {
  test('the ordinary case comes through, with the code normalised', () => {
    const l = leaseInput({ ...base });
    assert.equal(l.code, 'JKP-SPK0042');
    assert.equal(l.tenant, 'บ. ตัวอย่าง');
    assert.equal(l.rent, 405000);
    assert.equal(l.status, 'active');
    assert.equal(l.endDate.toISOString().slice(0, 10), '2027-01-31');
  });

  /* Parsed in local time, a date typed in Bangkok comes back out of
     toISOString() as the day before — the contract would count down to the
     wrong date. */
  test('the date that comes back is the date that was typed', () => {
    assert.equal(leaseInput({ ...base, endDate: '2027-01-31' }).endDate.toISOString(), '2027-01-31T00:00:00.000Z');
    assert.equal(leaseInput({ ...base, startDate: '2026-03-01', endDate: '2027-01-31' }).startDate!.toISOString().slice(0, 10), '2026-03-01');
  });

  test('a lease with no end date is refused — there is nothing to count down to', () => {
    for (const bad of [undefined, '', 'เร็ว ๆ นี้', null]) {
      assert.throws(() => leaseInput({ ...base, endDate: bad }), /วันสิ้นสุด/);
    }
  });

  test('a lease with no tenant or no property is refused', () => {
    assert.throws(() => leaseInput({ ...base, tenant: '  ' }), /ผู้เช่า/);
    assert.throws(() => leaseInput({ ...base, code: '' }), /รหัสทรัพย์/);
  });

  /* Entered the wrong way round it would show up in the bell as "เกินกำหนด"
     the moment it was saved. */
  test('an end date before the start date is refused', () => {
    assert.throws(() => leaseInput({ ...base, startDate: '2027-02-01', endDate: '2027-01-31' }), /หลังวันเริ่ม/);
    // the same pair the right way round is fine
    assert.ok(leaseInput({ ...base, startDate: '2026-02-01', endDate: '2027-01-31' }));
  });

  test('rent has to be a number that fits the column', () => {
    assert.throws(() => leaseInput({ ...base, rent: 'สามแสน' }), /ค่าเช่า/);
    assert.throws(() => leaseInput({ ...base, rent: -1 }), /ค่าเช่า/);
    assert.throws(() => leaseInput({ ...base, rent: 9_999_999_999 }), /ค่าเช่า/);
    assert.equal(leaseInput({ ...base, rent: 0 }).rent, 0);   // free of charge is a real arrangement
  });

  test('an unknown status falls back to active rather than storing junk', () => {
    assert.equal(leaseInput({ ...base, status: 'ยกเลิก' }).status, 'active');
    assert.equal(leaseInput({ ...base, status: 'closed' }).status, 'closed');
  });
});
