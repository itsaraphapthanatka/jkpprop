/* ตัวกรองชุดเดียวที่หน้าแรกกับหน้ารายการใช้ร่วมกัน (src/lib/publicFilters)
   ไฟล์นี้ล็อกกฎการกรองกับการส่งค่าผ่าน URL ซึ่งเป็นทางเดียวที่แผงบนหน้าแรก
   คุยกับหน้ารายการได้ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_PUBLIC_FILTERS, LOAD_STEPS, HEIGHT_STEPS,
  anyFilterSet, matchesPublicFilters, readFilterParams, writeFilterParams,
  type FilterableListing,
} from '../../src/lib/publicFilters.ts';

/* ลูกค้าขอ "น้ำหนักที่พื้นรับได้ เพิ่มถึง 7 ตัน" กับ "เพิ่มความสูง"
   ความสูงเป็นช่วง ต่ำสุด–สูงสุด ตามภาพเว็บอ้างอิงที่ชี้มา ไม่ใช่แบบ "ขึ้นไป" */
describe('ตัวกรองรับน้ำหนักและความสูง', () => {
  const it0 = (over: Partial<FilterableListing> = {}): FilterableListing => ({
    loc: 'บางพลี, สมุทรปราการ', zoning: '', zone: [], features: [],
    loadTon: null, heightM: null, type: 'โกดัง', ...over,
  });

  test('ระดับน้ำหนักไปถึง 7 ตัน', () => {
    assert.deepEqual(LOAD_STEPS, [0.5, 1, 2, 3, 4, 5, 7]);
  });

  test('ขั้นความสูงครอบคลุมของที่มีอยู่จริง (3–14 ม.) และเผื่อของใหม่', () => {
    assert.ok(HEIGHT_STEPS[0] <= 4, 'ต้องมีขั้นต่ำพอสำหรับอาคารเตี้ย');
    assert.ok(HEIGHT_STEPS[HEIGHT_STEPS.length - 1] >= 20, 'ต้องเผื่อเกินของสูงสุดที่มีอยู่');
    assert.deepEqual([...HEIGHT_STEPS].sort((a, b) => a - b), [...HEIGHT_STEPS], 'ต้องเรียงจากน้อยไปมาก');
  });

  test('ความสูงกรองเป็นช่วง ไม่ใช่ "ขึ้นไป"', () => {
    const f = { ...EMPTY_PUBLIC_FILTERS, hMin: 6, hMax: 10 };
    assert.equal(matchesPublicFilters(it0({ heightM: 8 }), f), true);
    assert.equal(matchesPublicFilters(it0({ heightM: 6 }), f), true, 'ขอบล่างต้องนับรวม');
    assert.equal(matchesPublicFilters(it0({ heightM: 10 }), f), true, 'ขอบบนต้องนับรวม');
    assert.equal(matchesPublicFilters(it0({ heightM: 5 }), f), false);
    assert.equal(matchesPublicFilters(it0({ heightM: 14 }), f), false);
  });

  test('ระบุข้างเดียวก็ได้', () => {
    assert.equal(matchesPublicFilters(it0({ heightM: 14 }), { ...EMPTY_PUBLIC_FILTERS, hMin: 12, hMax: null }), true);
    assert.equal(matchesPublicFilters(it0({ heightM: 14 }), { ...EMPTY_PUBLIC_FILTERS, hMin: null, hMax: 12 }), false);
  });

  test('ทรัพย์ที่ไม่ได้กรอกความสูง หลุดออกเมื่อมีการกรองความสูง', () => {
    assert.equal(matchesPublicFilters(it0(), { ...EMPTY_PUBLIC_FILTERS, hMin: 6 }), false);
    assert.equal(matchesPublicFilters(it0(), EMPTY_PUBLIC_FILTERS), true, 'ไม่กรองก็ต้องไม่ตัดทิ้ง');
  });

  test('ส่งผ่าน URL แล้วอ่านกลับได้ค่าเดิม', () => {
    const p = new URLSearchParams();
    writeFilterParams(p, { ...EMPTY_PUBLIC_FILTERS, load: 7, hMin: 6, hMax: 12 });
    const back = readFilterParams(Object.fromEntries(p));
    assert.equal(back.load, 7);
    assert.equal(back.hMin, 6);
    assert.equal(back.hMax, 12);
  });

  test('ช่วงที่ส่งกลับด้านมา สลับให้เอง ไม่ใช่คืนช่วงที่ไม่มีวันเจออะไร', () => {
    const back = readFilterParams({ hmin: '12', hmax: '6' });
    assert.equal(back.hMin, 6);
    assert.equal(back.hMax, 12);
  });

  test('ปุ่มล้างตัวกรองต้องโผล่เมื่อเลือกความสูงไว้', () => {
    assert.equal(anyFilterSet({ ...EMPTY_PUBLIC_FILTERS, hMax: 8 }), true);
    assert.equal(anyFilterSet(EMPTY_PUBLIC_FILTERS), false);
  });
});
