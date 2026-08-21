/* ลูกค้าเห็นรหัสภายในบนหน้าดีล — "สถานะเปลี่ยนเป็น "ไม่สำเร็จ" · deal
   cmt0wopu8003dp501haasx0sn lost" — ซึ่งเป็นเหตุผลสำหรับ audit log ไม่ใช่ข้อความ
   สำหรับคนอ่าน ระบบเลิกเขียนส่วนนี้แล้ว แต่แถวเก่ายังมีอยู่ จึงตัดตอนแสดงผล */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { displayNoteText } from '../../src/lib/server/leadNoteText.ts';

describe('บันทึกอัตโนมัติของ lead ต้องไม่โชว์รหัสภายใน', () => {
  test('ตัดเหตุผลของ audit log ที่ต่อท้ายออก', () => {
    assert.equal(
      displayNoteText('สถานะเปลี่ยนเป็น "ไม่สำเร็จ" · deal cmt0wopu8003dp501haasx0sn lost'),
      'สถานะเปลี่ยนเป็น "ไม่สำเร็จ"',
    );
    assert.equal(
      displayNoteText('สถานะเปลี่ยนเป็น "นัดเข้าชมแล้ว" · visit cmt0vp1x20025p5018nwcyfle'),
      'สถานะเปลี่ยนเป็น "นัดเข้าชมแล้ว"',
    );
    assert.equal(
      displayNoteText('สถานะเปลี่ยนเป็น "ยืนยันความต้องการแล้ว" · confirm cmt0abcd1234567890abcdef'),
      'สถานะเปลี่ยนเป็น "ยืนยันความต้องการแล้ว"',
    );
  });

  test('ของใหม่ที่ไม่มีส่วนท้ายอยู่แล้ว ไม่ถูกแตะ', () => {
    assert.equal(displayNoteText('สถานะเปลี่ยนเป็น "ปิดดีลสำเร็จ"'), 'สถานะเปลี่ยนเป็น "ปิดดีลสำเร็จ"');
  });

  test('บันทึกที่คนพิมพ์เองไม่ถูกแตะ แม้จะมีจุดคั่นอยู่ในข้อความ', () => {
    for (const v of [
      'โทรหาลูกค้าแล้ว · รอเอกสาร',
      'ลูกค้าขอดูทรัพย์เพิ่ม · deal นี้ต่อรองยาก',
      'ส่ง shortlist ให้แล้ว',
    ]) assert.equal(displayNoteText(v), v);
  });

  test('ไม่ตัดข้อความที่ลงท้ายด้วยคำธรรมดา ไม่ใช่รหัส', () => {
    const v = 'สถานะเปลี่ยนเป็น "กำลังเจรจา" · ตามที่ลูกค้าแจ้ง';
    assert.equal(displayNoteText(v), v);
  });
});
