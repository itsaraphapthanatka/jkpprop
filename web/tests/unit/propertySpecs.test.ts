/* The public spec table against the org's Field Builder settings.
   Switching a field off used to hide it from the admin form only — the page
   kept printing whatever was already stored — and a field the team added
   never appeared at all. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { stripInternal } from '../../src/lib/server/propertyDto.ts';
import { PROPERTY_TYPES, propertyType } from '../../src/lib/propertySchema.ts';
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

/* The pin is not public. It was for four of the six types: warehouses and
   showrooms saved it under `location_map`, which every public payload deletes,
   while a house, a condo, a plot and a factory had a text box that saved it
   inside the location group — where no filter looked. */
describe('the exact location never leaves the building', () => {
  const pin = '13.6688, 100.6014';

  test('a coordinate typed into the old text box is stripped', () => {
    const out = stripInternal('house', {
      location: { project: 'บ้านสวย', tambon: 'บางนา', province: 'กรุงเทพมหานคร', map: pin },
    }, null);
    assert.equal(JSON.stringify(out).includes(pin), false, 'the pin reached a public payload');
    // the rest of the address survives — it is what the page shows
    assert.equal((out.location as Record<string, string>).tambon, 'บางนา');
  });

  test('and so is the map picker\'s own field', () => {
    const out = stripInternal('warehouse', { location_map: pin, province: 'ชลบุรี' }, null);
    assert.equal(JSON.stringify(out).includes(pin), false);
    assert.equal(out.province, 'ชลบุรี');
  });

  test('every type asks for the pin the same way', () => {
    for (const t of PROPERTY_TYPES) {
      const keys = t.fields.map((f) => f.key);
      assert.ok(keys.includes('location_map'), `${t.key} has no map field`);
      const loc = t.fields.find((f) => f.key === 'location');
      assert.ok(!loc?.sub?.some((sf) => sf.key === 'map'),
        `${t.key} still has a coordinate box inside its location group`);
    }
  });
});


/* สไลด์ 27 (แก้เพิ่มหลังรอบแรก) · "ความสูงใต้คาน" และ "โกดัง โรงงาน โชว์รูม
   มีฟิลเลือกเครน มี/ไม่มี" — สองช่องนี้เคยมีแต่ในชุดของโรงงาน ส่วน ร.ง.4 เป็น
   ช่องติ๊กที่ตอบได้แค่มี และไม่มีที่เขียนว่าใบไหน */
describe('ช่องที่ลูกค้าขอเพิ่มในสไลด์ 27', () => {
  const fieldsOf = (key: string) => propertyType(key).fields;
  const find = (key: string, fieldKey: string) => fieldsOf(key).find((f) => f.key === fieldKey);

  for (const type of ['warehouse', 'factory', 'showroom']) {
    test(`${type} มีความสูงใต้คานและเครน`, () => {
      const height = find(type, 'clear_height');
      assert.ok(height, `${type} ไม่มีช่องความสูงใต้คาน`);
      const crane = find(type, 'overhead_crane');
      assert.ok(crane, `${type} ไม่มีช่องเครน`);
      assert.equal(crane!.kind, 'select', 'เครนต้องเลือก มี/ไม่มี ไม่ใช่ติ๊กถูก');
      assert.deepEqual(crane!.options, ['มี', 'ไม่มี']);
    });
  }

  test('โรงงานเลือก ร.ง.4 มี/ไม่มี และระบุประเภทใบอนุญาตได้', () => {
    const lic = find('factory', 'factory_license');
    assert.ok(lic, 'ไม่มีช่องใบอนุญาต ร.ง.4');
    assert.equal(lic!.kind, 'select');
    assert.deepEqual(lic!.options, ['มี', 'ไม่มี']);

    const note = find('factory', 'factory_license_type');
    assert.ok(note, 'ไม่มีช่องระบุประเภทใบอนุญาต');
    /* ถามเฉพาะเมื่อบอกว่ามีใบ — ไม่งั้นเป็นช่องว่างที่ไม่มีใครกรอก */
    assert.deepEqual(note!.showWhen, { field: 'factory_license', in: ['มี'] });
  });

  test('ทุกช่องที่เพิ่มมีคำแปลในตารางสเปค', () => {
    for (const key of ['clear_height', 'overhead_crane', 'factory_license', 'factory_license_type']) {
      const row = buildSpecs({ [key]: key === 'clear_height' ? 6 : 'มี' }, 'en', { disabled: [], extra: [] })
        .rows.find((r) => r.key === key);
      assert.ok(row, `${key} ไม่โผล่ในตารางสเปค`);
      assert.ok(!/[ก-๙]/.test(row!.label), `${key} ป้ายยังเป็นไทยในภาษาอังกฤษ: ${row!.label}`);
    }
  });
});


/* สไลด์ 26 · ลูกศรชี้ให้สลับสองช่องในหมวดพื้นที่ — วัดกว้าง x ลึกก่อน แล้วค่อย
   ได้พื้นที่ ซึ่งเป็นลำดับเดียวกับคู่ที่ดินที่อยู่เหนือขึ้นไป */
describe('ลำดับช่องในหมวดพื้นที่ (สไลด์ 26)', () => {
  const areaKeys = (typeKey: string) =>
    propertyType(typeKey).fields.filter((f) => f.section === 'พื้นที่').map((f) => f.key);

  for (const type of ['warehouse', 'factory', 'showroom']) {
    test(`${type} · กว้าง x ลึก มาก่อนพื้นที่`, () => {
      const keys = areaKeys(type);
      const wh = keys.indexOf('building_wh');
      const area = keys.indexOf('building_area');
      assert.ok(wh >= 0 && area >= 0, 'ต้องมีทั้งสองช่อง');
      assert.ok(wh < area, `กว้าง x ลึก ต้องอยู่ก่อนพื้นที่ — ตอนนี้ ${keys.join(' → ')}`);
      /* ทั้งสามคู่ต้องเรียงแบบเดียวกัน — วัดกว้าง x ลึกก่อน แล้วค่อยพื้นที่ */
      const pairs: [string, string, string][] = [
        ['land_wh', 'land_area_total', 'ที่ดิน'],
        ['building_total_wh', 'building_area_total', 'อาคารรวม'],
      ];
      for (const [dim, total, name] of pairs) {
        const a = keys.indexOf(dim);
        const b = keys.indexOf(total);
        if (a >= 0 && b >= 0) assert.ok(a < b, `คู่${name}ต้องเรียงแบบเดียวกัน — ตอนนี้ ${keys.join(' → ')}`);
      }
      /* ออฟฟิศ ชั้น 1 กับออฟฟิศรวมต้องอยู่ติดกัน ไม่มีช่องของอาคารมาคั่น */
      const f1 = keys.indexOf('office_area_f1');
      const offTotal = keys.indexOf('office_area_total');
      if (f1 >= 0 && offTotal >= 0) {
        assert.equal(offTotal, f1 + 1, `ช่องออฟฟิศต้องอยู่ติดกัน — ตอนนี้ ${keys.join(' → ')}`);
      }
    });
  }
});

/* ลูกค้าส่งลิงก์เว็บ thaiindustrialproperty.com มาแล้วบอกว่า "อยากให้เรียง
   รายละเอียดเหมือน web นี้" — ตารางของเขาเปิดด้วย รหัส / สถานะ / ประเภท
   แล้วค่อยทำเล → โซน → พื้นที่ → สเปคอาคาร → ราคา → เงื่อนไข

   ที่สำคัญกว่าลำดับคือหมวด "พื้นที่" ทั้งบล็อกไม่เคยขึ้นหน้าเว็บเลย ทั้งที่
   ทีมกรอกไว้ 200 จาก 248 รายการ — พื้นที่อาคารรวมที่เป็นตัวเลขหลักของประกาศ
   ก็หายไปด้วย */
describe('ลำดับตารางรายละเอียดตามเว็บที่ลูกค้าอ้างอิง', () => {
  const full = {
    province: 'สมุทรปราการ', district: 'บางพลี', subdistrict: 'ราชาเทวะ',
    zoning_color: 'ม่วง — อุตสาหกรรม', zone: ['กนอ.'],
    building_total_wh: '20 x 40', building_area_total: 800,
    building_wh: '14 x 20', building_area: 280,
    office_floors: '1 ชั้น', office_area_f1: 40, office_area_total: 40,
    building_floors: '1 ชั้น',
    land_wh: '30 x 50', land_area_total: { rai: 2, ngan: 1, wa: 30 },
    clear_height: 8, building_height: 10, floor_loading: '3 ตัน',
    power_phase: '3 เฟส', doors: 2, door_wh: '4 x 4',
    price_rent: 120000, deposit_months: 3, lease_term: 3,
  };
  const head = { code: 'JKPSPK1001', typeLabel: 'โกดัง / คลังสินค้า' };
  const at = (rows: { key: string }[], key: string) => rows.findIndex((r) => r.key === key);

  test('สามแถวแรกคือ รหัส → สถานะ → ประเภท', () => {
    const rows = buildSpecs({ ...full, deal_type: 'ให้เช่า' }, 'th', {}, undefined, head).rows;
    assert.deepEqual(rows.slice(0, 3).map((r) => r.key), ['property_code', 'deal_type', 'property_type']);
    assert.equal(rows[0].value, 'JKPSPK1001');
  });

  test('รหัสกับประเภทไม่ขึ้นเองถ้าหน้าเพจไม่ได้ส่งมา', () => {
    const rows = buildSpecs(full, 'th').rows;
    assert.ok(!rows.some((r) => r.key === 'property_code' || r.key === 'property_type'));
  });

  /* ลำดับที่คุณ Jacky สั่งมาเป็นข้อ ๆ 22 แถว (เด็ค Web 2026 ข้อ 3 · 23 ส.ค.)
     แทนลำดับเดิมที่จัดเป็นหมวด ทำเล → โซน → พื้นที่ → สเปค → ราคา */
  test('เรียงตาม 22 ข้อที่สั่งมา', () => {
    const rows = buildSpecs(full, 'th', {}, undefined, head).rows;
    const order = [
      'property_code', 'deal_type', 'property_type',
      'province', 'district', 'subdistrict',
      'building_floors', 'building_area_total', 'building_total_wh',
      'building_area', 'building_wh',
      'office_floors', 'office_area_total',
      'clear_height', 'floor_loading',
      'power_system', 'price_rent', 'price_per_sqm',
      'deposit_months', 'lease_term',
    ].filter((k) => at(rows, k) !== -1);
    for (let i = 1; i < order.length; i += 1) {
      assert.ok(at(rows, order[i - 1]) < at(rows, order[i]),
        `${order[i - 1]} ต้องมาก่อน ${order[i]} — ตอนนี้ ${rows.map((r) => r.key).join(' → ')}`);
    }
  });

  /* แถวที่ไม่อยู่ใน 22 ข้อ ยังอยู่ต่อท้าย ยังไม่ได้ตัดทิ้ง — บางแถวมาจากคำขอ
     รอบก่อน (เครนกับ ร.ง.4 จากสไลด์ 27 · พื้นที่สีกับโซนจากข้อ 8) */
  test('แถวนอกรายการ 22 ข้อ ไปต่อท้าย ไม่หายไป', () => {
    const rows = buildSpecs(full, 'th', {}, undefined, head).rows;
    for (const key of ['zoning_color', 'zone', 'land_area_total', 'door_wh']) {
      assert.ok(at(rows, key) !== -1, `${key} หายไปจากตาราง`);
      assert.ok(at(rows, key) > at(rows, 'lease_term'), `${key} ต้องอยู่หลัง 22 ข้อที่สั่งมา`);
    }
  });

  test('หมวดพื้นที่ที่เคยหายไปทั้งบล็อกขึ้นครบ พร้อมหน่วย', () => {
    const byKey = new Map(buildSpecs(full, 'th', {}, undefined, head).rows.map((r) => [r.key, r.value]));
    assert.equal(byKey.get('building_area_total'), '800 ตร.ม.');
    assert.equal(byKey.get('building_wh'), '14 x 20 ม.');
    assert.equal(byKey.get('door_wh'), '4 x 4 ม.');
    assert.equal(byKey.get('office_area_total'), '40 ตร.ม.');
    // ไร่/งาน/ตร.ว. เก็บเป็นอ็อบเจกต์ เดิมตกไปทาง payer/amount แล้วได้แถวว่าง
    assert.equal(byKey.get('land_area_total'), '2 ไร่ 1 งาน 30 ตร.ว.');
  });

  test('ทรัพย์ที่ไม่มีออฟฟิศไม่ต้องมีแถว "0 ตร.ม." สองแถว', () => {
    const rows = buildSpecs({ ...full, office_area_f1: 0, office_area_total: 0 }, 'th', {}, undefined, head).rows;
    assert.ok(!rows.some((r) => r.key.startsWith('office_area')), 'พื้นที่ 0 คือไม่มี ไม่ใช่ข้อมูล');
    assert.ok(rows.some((r) => r.key === 'office_floors'), 'แต่ "จำนวนชั้นออฟฟิศ" ยังบอกได้');
  });

  test('หน่วยอังกฤษเป็นเอกพจน์เมื่อมีชิ้นเดียว', () => {
    const one = buildSpecs({ doors: 1, parking: 1 }, 'en').rows;
    assert.equal(one.find((r) => r.key === 'doors')!.value, '1 door');
    const many = buildSpecs({ doors: 4 }, 'en').rows;
    assert.equal(many.find((r) => r.key === 'doors')!.value, '4 doors');
  });

  test('ราคาต่อ ตร.ม. ที่หารมาปัดเป็นบาทเต็ม', () => {
    const rows = buildSpecs({ price_per_sqm: 234.375, elec_rate: 4.5 }, 'th').rows;
    assert.equal(rows.find((r) => r.key === 'price_per_sqm')!.value, '฿234');
    // ค่าไฟยังเก็บทศนิยม เพราะ 4.50 บาท/หน่วย คือราคาจริง
    assert.equal(rows.find((r) => r.key === 'elec_rate')!.value, '฿4.5');
  });
});
