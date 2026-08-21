/* ช่องทางติดต่อที่หน้าเว็บเอาไปโชว์
 *
 * production เก็บข้อความตัวอย่างของช่องกรอกไว้เป็นค่าจริงสามช่อง — Line,
 * Facebook, Instagram — หน้าเว็บจึงมีปุ่มที่กดแล้วไปหน้าที่ไม่มีอยู่จริงมาตลอด
 * และไอดี WeChat เก็บไว้เป็น "#" ตัวเดียว คัดลอกไปก็ใช้ไม่ได้
 *
 * เพิ่งเห็นตอนทำแถบติดต่อขอบล่าง เพราะแถบเอาปุ่มพวกนี้มาวางไว้หน้าสุด
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { safeUrl, safeId } from '../../src/lib/server/company.ts';

describe('ช่องทางติดต่อที่ไม่ใช่คำตอบจริง ต้องไม่กลายเป็นปุ่ม', () => {
  test('ค่าที่เท่ากับข้อความตัวอย่างของช่องตัวเอง ถือว่ายังไม่ได้กรอก', () => {
    for (const v of [
      'https://line.me/R/ti/p/@yourid',
      'https://facebook.com/yourpage',
      'https://instagram.com/youraccount',
    ]) assert.equal(safeUrl(v), '', `${v} ไม่ควรกลายเป็นลิงก์`);
  });

  test('ลิงก์จริงยังผ่านตามเดิม', () => {
    assert.equal(safeUrl('https://line.me/R/ti/p/@jkpproperty'), 'https://line.me/R/ti/p/@jkpproperty');
    assert.equal(safeUrl('https://wa.me/66808304005'), 'https://wa.me/66808304005');
  });

  test('ยังกันลิงก์ที่ไม่ใช่ http(s) เหมือนเดิม', () => {
    for (const v of ['javascript:alert(1)', 'ftp://x', '', '   ', null, 42]) {
      assert.equal(safeUrl(v), '');
    }
  });

  test('ไอดีที่ไม่มีตัวอักษรหรือตัวเลขสักตัว ไม่ใช่ไอดี', () => {
    for (const v of ['#', '-', '  .  ', '', null]) assert.equal(safeId(v), '');
  });

  test('ไอดีจริงผ่าน ทั้งอังกฤษและไทย และตัดความยาวไว้ที่ 100', () => {
    assert.equal(safeId('  jkpproperty  '), 'jkpproperty');
    assert.equal(safeId('เจเคพี'), 'เจเคพี');
    assert.equal(safeId('a'.repeat(200)).length, 100);
  });
});
