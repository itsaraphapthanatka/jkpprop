/* ข้อความสำหรับโพสต์โซเชียล (lib/summaryTemplate)
 *
 * บรรทัดหัวเคยประกอบเองในลำดับเก่า และหน้า Social Status ส่ง "ชื่อประกาศทั้งดุ้น"
 * มาเป็นชื่อประเภททรัพย์ หัวข้อความจึงกลายเป็นชื่อประกาศ ตามด้วยครึ่งหลังของ
 * ตัวเองซ้ำอีกรอบในบรรทัดเดียว และตัวเลขไม่มีจุลภาคคั่นหลักพันเหมือนในชื่อ
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildSummary } from '../../src/lib/summaryTemplate.ts';

const values = {
  deal_type: 'ให้เช่า',
  subdistrict: 'แขวง ลำผักชี',
  district: 'หนองจอก',
  province: 'กรุงเทพ',
  building_area_total: 8188,
  building_height: 12,
  office_floors: '2 ชั้น',
  office_area_total: 268,
};

describe('หัวข้อความโพสต์ = ชื่อประกาศ ไม่ใช่ชื่อประกาศบวกตัวเองอีกรอบ', () => {
  const head = () => buildSummary({ typeLabel: 'โกดัง', code: 'JKPBKK1005', values }).text.split('\n')[0];

  test('เรียงตามลำดับที่ลูกค้ากำหนด และรหัสอยู่ท้ายสุด', () => {
    assert.equal(head(), // จังหวัดถูกทำให้เป็นชื่อทางการ — ข้อมูลเขียน "กรุงเทพ" ทั้ง 203 รายการ
      'โกดัง 8,188 ตร.ม. ให้เช่า ที่ ลำผักชี, หนองจอก, กรุงเทพมหานคร (JKPBKK1005)');
  });

  test('ตัวเลขมีจุลภาคคั่นหลักพัน เหมือนที่หน้าเว็บใช้', () => {
    assert.ok(head().includes('8,188'), head());
    assert.ok(!head().includes('8188 '), 'ยังมีตัวเลขที่ไม่ได้คั่นหลัก');
  });

  test('ไม่มีส่วนไหนซ้ำสองรอบในบรรทัดเดียว', () => {
    const h = head();
    assert.equal(h.split('ให้เช่า').length - 1, 1, h);
    assert.equal(h.split('JKPBKK1005').length - 1, 1, h);
    assert.equal(h.split('หนองจอก').length - 1, 1, h);
  });

  test('รายละเอียดด้านล่างยังอยู่ครบ รวมแถวที่ยังไม่มีค่า (ทีมขอโครงเต็มไว้วาง)', () => {
    const s = buildSummary({ typeLabel: 'โกดัง', code: 'JKPBKK1005', values });
    assert.ok(s.text.includes('- ความสูง : 12 ม.'));
    assert.ok(s.text.includes('- พื้นที่ดิน :'), 'แถวที่ยังไม่มีค่าต้องยังอยู่');
    assert.ok(s.total > s.filled, 'ต้องนับได้ว่ายังกรอกไม่ครบกี่แถว');
  });

  /* คุณกิตติพงษ์แจ้ง 26 ส.ค. 2569 · "รายละเอียดที่ทีม Marketing ลง คั่นหน่วยหาย
     ครับ พวกราคากับขนาด เช่น 1000" — บรรทัดหัวใส่จุลภาคให้อยู่แล้ว แต่แถว
     รายละเอียดข้างล่างพิมพ์ตัวเลขออกดิบ ๆ ข้อความก้อนเดียวกันจึงคั่นหลักสองแบบ */
  test('ราคาและขนาดในแถวรายละเอียด คั่นหลักพันเหมือนบรรทัดหัว', () => {
    const s = buildSummary({
      typeLabel: 'โรงงาน', code: 'JKPBKK1044',
      values: { ...values, building_area_total: 1875, price_sale: 50000000, price_rent: 150000, office_area_total: 800 },
    });
    assert.ok(s.text.includes('- พื้นที่ใช้สอยรวม : 1,875 ตร.ม.'), s.text);
    assert.ok(s.text.includes('- ราคาขาย : 50,000,000 บาท'), s.text);
    assert.ok(s.text.includes('- ค่าเช่า : 150,000 บาท/เดือน'), s.text);
    assert.ok(s.text.includes('800 ตร.ม.'), s.text);
  });

  /* ช่องที่คนกรอกพิมพ์เป็นข้อความเอง ต้องออกมาเหมือนที่พิมพ์ — จัดหลักให้มันคือ
     การแก้คำพูดของคนกรอก ไม่ใช่จัดรูปแบบตัวเลข */
  test('ค่าที่เก็บเป็นข้อความ ไม่ถูกจัดหลักใหม่', () => {
    const s = buildSummary({
      typeLabel: 'โรงงาน', code: 'JKPBKK1044',
      values: { ...values, floor_loading: '3 ตัน', power_system: '3 Phase 30/100 amp (Upgradeable)' },
    });
    assert.ok(s.text.includes('- พื้นรับน้ำหนัก : 3 ตัน'), s.text);
    assert.ok(s.text.includes('- ระบบไฟฟ้า : 3 Phase 30/100 amp (Upgradeable)'), s.text);
  });

  test('ทรัพย์ที่ยังไม่มีทำเล ก็ยังได้หัวข้อความที่อ่านรู้เรื่อง', () => {
    const head2 = buildSummary({ typeLabel: 'โกดัง', code: 'JKPBKK9999', values: { deal_type: 'ขาย' } }).text.split('\n')[0];
    assert.ok(head2.startsWith('โกดัง'), head2);
    assert.ok(head2.includes('(JKPBKK9999)'), head2);
  });
});
