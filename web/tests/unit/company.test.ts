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
import { readFileSync } from 'node:fs';
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

/* เด็ค Web 2026 ข้อ 20 · "ที่คุยกันต้องเป็นข้อมูลบริษัทเราครับ · ไม่แสดงผลครับ"
 *
 * ค่าตั้งต้นในโค้ดเคยมีอีเมลของอีกบริษัทที่ติดมากับเทมเพลต พอช่อง "อีเมล
 * ฝ่ายขาย" ในหลังบ้านว่าง หน้าติดต่อก็เอาอีเมลนั้นขึ้นแทน — และมันขึ้นอยู่บน
 * เว็บจริงมาตลอด แปลว่าลูกค้าที่ติดต่อทางอีเมลฝ่ายขาย ส่งไปเข้ากล่องของคนอื่น
 *
 * ช่องที่พาคนออกไปข้างนอก (อีเมล เบอร์โทร) จึงห้ามมีค่าตั้งต้นเด็ดขาด
 */
describe('ค่าตั้งต้นของข้อมูลบริษัท ต้องไม่พาลูกค้าไปหาคนอื่น', () => {
  const src = readFileSync(new URL('../../src/lib/server/company.ts', import.meta.url), 'utf8');
  /* ตัดคอมเมนต์ออกก่อน — คำอธิบายว่าเคยมีอีเมลอะไรอยู่ ไม่ใช่ค่าที่ถูกใช้จริง */
  const defaults = src
    .slice(src.indexOf('const DEFAULTS'), src.indexOf('export async function loadCompany'))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  test('ไม่มีอีเมลของบริษัทอื่นหลงเหลืออยู่', () => {
    const emails = defaults.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [];
    assert.deepEqual(emails, [], `ยังมีอีเมลอยู่ในค่าตั้งต้น: ${emails.join(', ')}`);
  });

  test('ไม่มีเบอร์โทรอยู่ในค่าตั้งต้น', () => {
    const phones = defaults.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
    assert.deepEqual(phones, [], `ยังมีเบอร์โทรอยู่ในค่าตั้งต้น: ${phones.join(', ')}`);
  });

  test('ชื่อบริษัทกับที่อยู่ยังมีค่าตั้งต้นได้ เพราะไม่ได้พาใครไปไหน', () => {
    assert.match(defaults, /JKP PROPERTY/, 'ชื่อบริษัทหายไปจากค่าตั้งต้น');
  });
});
