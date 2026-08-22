/* หน้า Dashboard เคยขึ้นบรรทัดกิจกรรมเป็นชื่อ action ดิบกับรหัสภายใน เช่น
   "กิตติพงษ์ พรหมทอง media.delete mediaAsset/cmt49p88x0000od0179vbbvse"
   ซึ่งคนใช้งานอ่านไม่รู้เรื่อง */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { actionLabel } from '../../src/lib/server/auditLabel.ts';

describe('บรรทัดกิจกรรมต้องเป็นภาษาคน', () => {
  test('action ทั่วไปแปลเป็นคำไทย', () => {
    assert.equal(actionLabel('property.update', 'property'), 'แก้ไขทรัพย์');
    assert.equal(actionLabel('property.create', 'property'), 'สร้างทรัพย์');
    assert.equal(actionLabel('media.delete', 'mediaAsset'), 'ลบไฟล์สื่อ');
    assert.equal(actionLabel('visit.create', 'visit'), 'สร้างแผนเข้าชม');
  });

  test('entity ที่บันทึกจริงชนะคำนำหน้า action เพราะตรงกว่า', () => {
    assert.equal(actionLabel('cms.delete', 'cmsPage'), 'ลบหน้าเนื้อหา');
  });

  test('คำที่ขึ้นต้นด้วยอักษรอังกฤษต้องเว้นวรรค ไม่ใช่ "ลบงานติดตามlead"', () => {
    assert.equal(actionLabel('lead.task.delete', 'lead'), 'ลบงานติดตาม lead');
    assert.equal(actionLabel('shortlist.create', 'shortlist'), 'สร้าง shortlist');
  });

  test('action ที่ประกอบคำแล้วอ่านแปลก เขียนเต็มไว้', () => {
    assert.equal(actionLabel('auth.login', 'user'), 'เข้าสู่ระบบ');
    assert.equal(actionLabel('requirement.availability', 'requirement'), 'เช็คว่างกับเจ้าของ');
  });

  test('ไม่รู้จักก็คืนของเดิม ดีกว่าขึ้นว่าง', () => {
    assert.equal(actionLabel('quantum.entangle', 'tachyon'), 'quantum.entangle');
  });

  test('ผลลัพธ์ต้องไม่มีรหัสภายในหรือชื่อ action ดิบหลุดออกมา', () => {
    for (const [a, e] of [['property.update', 'property'], ['media.delete', 'mediaAsset'], ['deal.create', 'deal']] as const) {
      const out = actionLabel(a, e);
      assert.doesNotMatch(out, /\./, `${a} ยังมีจุดแบบชื่อ action ดิบ`);
      assert.doesNotMatch(out, /\bc[a-z0-9]{20,}\b/, `${a} ยังมีรหัสภายใน`);
    }
  });
});
