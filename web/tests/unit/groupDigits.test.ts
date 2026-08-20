/* สไลด์ 25 · "ช่องจำนวนเงินกับขนาดพื้นที่ ทุกช่องใส่ , ขั้นหน่วย"
 *
 * ตัวเลขหกเจ็ดหลักในช่องกรอกไม่มีตัวคั่นเลย คนกรอกจึงไม่เห็นว่าพิมพ์ศูนย์เกิน
 * ไปตัวหรือเปล่า ตัวคั่นต้องเป็นเรื่องของการแสดงผลอย่างเดียว — ค่าที่ส่งไป
 * บันทึกยังต้องเป็นตัวเลขล้วน ไม่งั้นฐานข้อมูลจะได้ "1,500" เป็นข้อความ
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { groupDigits, ungroupDigits, numericValue } from '../../src/lib/numberFormat.ts';

describe('คั่นหลักพันในช่องกรอกตัวเลข', () => {
  test('คั่นตามหลักพัน', () => {
    assert.equal(groupDigits('1500'), '1,500');
    assert.equal(groupDigits('150000'), '150,000');
    assert.equal(groupDigits('13860000'), '13,860,000');
    assert.equal(groupDigits('999'), '999');
  });

  test('พิมพ์ค้างกลางคันแล้วไม่พัง', () => {
    assert.equal(groupDigits(''), '');
    assert.equal(groupDigits('-'), '-');
    assert.equal(groupDigits('12.'), '12.');
    assert.equal(groupDigits('1234.5'), '1,234.5');
    assert.equal(groupDigits('-2500'), '-2,500');
  });

  test('ค่าที่คั่นแล้วส่งกลับเข้ามาไม่ซ้อนตัวคั่น', () => {
    assert.equal(groupDigits('1,500'), '1,500');
    assert.equal(groupDigits('13,860,000'), '13,860,000');
  });

  test('ค่าที่ส่งไปบันทึกไม่มีตัวคั่นติดไป', () => {
    assert.equal(ungroupDigits('13,860,000'), '13860000');
    assert.equal(Number(ungroupDigits(groupDigits('150000'))), 150000);
  });

  /* ฟอร์มเก็บทุกอย่างเป็นข้อความ ราคาที่แก้ผ่านหลังบ้านจึงเคยถูกบันทึกเป็น
     "150000" แล้วหน้าเว็บขึ้นว่า "ติดต่อสอบถาม" เพราะอ่านด้วย typeof number */
  test('ค่าที่เก็บลงฐานข้อมูลเป็นตัวเลขจริง', () => {
    assert.equal(numericValue('150,000'), 150000);
    assert.equal(typeof numericValue('150,000'), 'number');
    assert.equal(numericValue('1,234.5'), 1234.5);
    assert.equal(numericValue(''), undefined, 'ช่องว่างต้องไม่กลายเป็น 0');
    assert.equal(numericValue('   '), undefined);
    assert.equal(numericValue('-'), undefined, 'พิมพ์ค้างยังไม่ใช่ตัวเลข');
    assert.equal(numericValue('ห้าหมื่น'), undefined);
  });

  test('ข้อความที่ไม่ใช่ตัวเลขปล่อยผ่านตามเดิม', () => {
    assert.equal(groupDigits('ติดต่อสอบถาม'), 'ติดต่อสอบถาม');
    assert.equal(groupDigits('5 x 5'), '5 x 5');
  });
});
