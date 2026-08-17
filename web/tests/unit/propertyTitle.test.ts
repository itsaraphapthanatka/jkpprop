/* A visitor who switches to English gets an English headline.
 *
 * The 393 imported records carry no translations, so every card and every
 * property page showed its Thai title on /en and /zh — the language switch
 * changed the navigation and left the listings themselves in Thai. These
 * cases use the shape of the real records, prefixes, inconsistent spacing
 * and all. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { composeTitle, canCompose, displayTitle } from '../../src/lib/propertyTitle.ts';
import { districtLabel, subdistrictLabel, provinceLabel } from '../../src/i18n/places.ts';
import { enumLabel, untranslated } from '../../src/i18n/enums.ts';

const warehouse = {
  typeLabel: 'โกดัง / คลังสินค้า',
  values: {
    deal_type: 'เช่า',
    subdistrict: 'ตำบล ราชาเทวะ',
    district: 'บางพลี',
    province: 'สมุทรปราการ',
    building_area_total: 1344,
  },
  area: 1344,
  code: 'JKPSPK1001',
};

describe('หัวเรื่องทรัพย์ในภาษาของคนอ่าน', () => {
  test('อังกฤษ: ไม่เหลืออักษรไทยสักตัว', () => {
    const en = composeTitle(warehouse, 'en');
    assert.equal(en, 'Warehouse for rent, 1,344 sqm — Racha Thewa, Bang Phli, Samut Prakan (JKPSPK1001)');
    assert.ok(!/[ก-๙]/.test(en), en);
  });

  test('จีน: ประเภทกับดีลเป็นจีน จังหวัดใช้ชื่อจีนที่มีอยู่จริง', () => {
    const zh = composeTitle(warehouse, 'zh');
    assert.match(zh, /仓库出租/);
    assert.match(zh, /北榄/); // สมุทรปราการ
    assert.match(zh, /\(JKPSPK1001\)/);
  });

  test('ไทยได้ชื่อที่ทีมพิมพ์เอง ไม่ใช่ชื่อที่ประกอบขึ้น', () => {
    const th = 'โกดัง ให้เช่า 1,344 ตร.ม. ตำบล ราชาเทวะ, บางพลี, สมุทรปราการ (รหัส : JKPSPK1001)';
    assert.equal(displayTitle(th, undefined, warehouse, 'th'), th);
  });

  test('ถ้ามีคำแปลที่คนเขียนไว้ ต้องชนะของที่ประกอบขึ้น', () => {
    const human = 'Prime warehouse next to Suvarnabhumi';
    assert.equal(displayTitle('หัวข้อไทย', human, warehouse, 'en'), human);
  });

  test('ข้อมูลไม่พอ (ไม่มีที่อยู่) → คงหัวข้อไทยไว้ ดีกว่าได้แค่รหัส', () => {
    const bare = { typeLabel: 'โรงงาน', values: {}, area: null, code: 'JKPX0001' };
    assert.equal(canCompose(bare), false);
    assert.equal(displayTitle('โรงงานให้เช่า', undefined, bare, 'en'), 'โรงงานให้เช่า');
  });

  test('ไม่มีพื้นที่ ไม่มีดีล → ประโยคยังอ่านรู้เรื่อง ไม่มีจุลภาคลอย', () => {
    const partial = { ...warehouse, area: null, values: { ...warehouse.values, deal_type: '' } };
    const en = composeTitle(partial, 'en');
    assert.equal(en, 'Warehouse — Racha Thewa, Bang Phli, Samut Prakan (JKPSPK1001)');
  });
});

describe('ชื่อสถานที่ที่ข้อมูลจริงใช้', () => {
  /* คำนำหน้าติดมากับค่าที่เก็บ และเว้นวรรคไม่เหมือนกัน — "แขวงคันนายาว"
     กับ "แขวง คันนายาว" คือที่เดียวกัน */
  test('คำนำหน้า แขวง/ตำบล และช่องว่าง ไม่ทำให้หาไม่เจอ', () => {
    for (const v of ['แขวง คันนายาว', 'แขวงคันนายาว', 'คันนายาว']) {
      assert.equal(subdistrictLabel(v, 'en'), 'Khan Na Yao', v);
    }
    assert.equal(districtLabel('เขต ลาดกระบัง', 'en'), 'Lat Krabang');
  });

  test('ภาษาไทยเก็บรูปเดิมไว้ทั้งคำนำหน้า', () => {
    assert.equal(subdistrictLabel('แขวง คันนายาว', 'th'), 'แขวง คันนายาว');
    assert.equal(districtLabel('ลาดกระบัง', 'th'), 'ลาดกระบัง');
  });

  test('เขตที่ยังไม่รู้จัก คงชื่อไทยไว้ทั้งคำนำหน้า ไม่ใช่ตัดครึ่ง ๆ กลาง ๆ', () => {
    assert.equal(districtLabel('เขตสมมุติ', 'en'), 'เขตสมมุติ');
    assert.equal(subdistrictLabel('แขวง สมมุติ', 'en'), 'แขวง สมมุติ');
  });

  test('จังหวัดที่ข้อมูลเขียนย่อ ก็ยังแปลได้', () => {
    assert.equal(provinceLabel('กรุงเทพ', 'en'), 'Bangkok');
    assert.equal(provinceLabel('กรุงเทพ', 'zh'), '曼谷');
  });
});

describe('ค่าตัวเลือกที่ทรัพย์จริงเก็บไว้', () => {
  /* รายการนี้มาจากค่าที่อยู่ในฐานข้อมูลจริง 393 รายการ ไม่ใช่จาก schema —
     สิ่งที่คนเห็นบนเว็บคือค่าที่ถูกเก็บ ไม่ใช่ตัวเลือกที่ตั้งไว้ */
  const REAL = [
    '1 ชั้น', '2 ชั้น', '3 ชั้น', '4 ชั้น', 'มากกว่า 3 ชั้น', 'ไม่มีออฟฟิศ',
    '1 เดือน', '2 เดือน', '3 เดือน', '4 เดือน', '1-3 ปี', '3 ปี',
    'ไม่ใช่', 'ไม่มี', 'ผู้ขายและผู้ซื้อ รับผิดชอบ 50/50',
    'มีพื้นที่สำนักงาน', 'มีที่จอดรถ', 'มีลานจอด / ลานเทรลเลอร์', 'รถคอนเทนเนอร์เข้าได้',
    'ยกพื้นเทียบตู้ (Dock leveler)', 'เครนเหนือศีรษะ', 'ใกล้ถนนหลัก', 'อาคารเดี่ยว', 'พื้นที่โครงการ',
    'ผลิต', 'โปรดักชั่น', 'ครัวกลาง', 'ศูนย์กระจายสินค้า', 'ห้องเก็บของ', 'สตูดิโอ', 'โชว์รูม',
    'เขียวอ่อน — อนุรักษ์สิ่งแวดล้อม', 'ม่วง — อุตสาหกรรม', '1 เฟส', '3 เฟส',
    'ปลอดอากร (Free Zone)', 'การนิคมอุตสาหกรรม (กนอ.)', 'วัตถุอันตราย (DG Zone)',
  ];

  for (const locale of ['en', 'zh'] as const) {
    test(`${locale}: แปลครบทุกค่า`, () => {
      assert.deepEqual(untranslated(REAL, locale), []);
    });
  }

  test('ค่าที่ไม่รู้จักตกกลับเป็นไทย ไม่ใช่ว่างเปล่า', () => {
    assert.equal(enumLabel('อะไรสักอย่างที่ยังไม่มีในตาราง', 'en'), 'อะไรสักอย่างที่ยังไม่มีในตาราง');
  });
});
