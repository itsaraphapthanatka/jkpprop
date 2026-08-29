/* ไฟล์ขนาดศูนย์ไบต์ต้องไม่ถูกเสิร์ฟเป็นรูป
 *
 * 29 ส.ค. 2569 · คุณกิตติพงษ์แจ้งว่ารูปในคลังสื่อไม่แสดง · ตัวย่อตอบ 200 แต่
 * ขนาด 0 ไบต์ · บนเครื่องจริงมีไฟล์เปล่าค้างอยู่ 145 ไฟล์ (ตัวย่อ 86 · ไฟล์ปั๊ม 59)
 * เกิดตอนดิสก์เต็ม 100% — เขียนไม่ลงแต่ไฟล์เปล่าถูกสร้างค้างไว้ แล้วตัวที่เรียกใช้
 * กลืน error ทิ้ง (แคชพังไม่ควรทำให้คำขอล้ม) ระบบจึงเสิร์ฟไฟล์เปล่าเป็นแคชที่ใช้ได้
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let dir = '';
let store: typeof import('../../src/lib/server/mediaStore.ts');

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'jkp-empty-'));
  process.env.UPLOADS_DIR = dir;
  store = await import('../../src/lib/server/mediaStore.ts');
});
after(async () => { await rm(dir, { recursive: true, force: true }); });

describe('ไฟล์เปล่าในที่เก็บสื่อ', () => {
  test('อ่านไฟล์ 0 ไบต์ต้องได้ null ไม่ใช่รูปเปล่า', async () => {
    await writeFile(path.join(dir, 'aaa.jpg'), '');
    assert.equal(await store.getObject('aaa', 'image/jpeg'), null, 'เสิร์ฟไฟล์เปล่าออกไปเป็นแคชที่ใช้ได้');
  });

  test('ไฟล์ที่มีเนื้อหาจริงยังอ่านได้ตามปกติ', async () => {
    await writeFile(path.join(dir, 'bbb.jpg'), 'ข้อมูลรูป');
    const b = await store.getObject('bbb', 'image/jpeg');
    assert.ok(b && b.length > 0);
  });

  test('เขียนแล้วไม่เหลือไฟล์ชั่วคราวค้าง', async () => {
    await store.putObject('ccc', 'image/jpeg', Buffer.from('เนื้อหา'));
    const left = (await readdir(dir)).filter((n) => n.includes('.tmp-'));
    assert.deepEqual(left, [], 'มีไฟล์ชั่วคราวค้างอยู่');
    const back = await store.getObject('ccc', 'image/jpeg');
    assert.equal(back?.toString(), 'เนื้อหา');
  });
});
