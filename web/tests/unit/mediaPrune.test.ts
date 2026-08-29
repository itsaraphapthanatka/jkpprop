/* เก็บกวาดไฟล์ปั๊มลายน้ำรุ่นเก่า
 *
 * ทุกครั้งที่แก้ตั้งค่าลายน้ำ wmVersion เด้ง แล้วรูปประกาศทุกใบถูกปั๊มใหม่ทั้งชุด
 * ใต้คีย์ของเวอร์ชันใหม่ — ชุดเก่าไม่เคยถูกลบ 29 ส.ค. 2569 เครื่องจริงมีค้างอยู่
 * สิบกว่ารุ่น 3,098 ไฟล์ 1.1GB และดิสก์เต็ม 100% เหลือ 49MB ทั้งที่มีเว็บ
 * production อีก 17 ตัวใช้ดิสก์ก้อนเดียวกัน
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let dir = '';
let prune: (keep: number) => Promise<number>;

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'jkp-media-'));
  process.env.UPLOADS_DIR = dir;
  /* โมดูลอ่าน UPLOADS_DIR ตอนถูกโหลด จึงต้องตั้งค่าก่อน import */
  ({ pruneWatermarkVersions: prune } = await import('../../src/lib/server/mediaStore.ts'));
});

after(async () => { await rm(dir, { recursive: true, force: true }); });

describe('เก็บกวาดไฟล์ปั๊มลายน้ำ', () => {
  test('ลบทุกรุ่นที่ไม่ใช่รุ่นที่ใช้อยู่ และไม่แตะไฟล์อื่นเลย', async () => {
    const keep = [
      'abc123.jpg',            // ไฟล์สาธารณะ
      'abc123-original.jpg',   // ต้นฉบับที่ห้ามหาย
      'abc123-wm82.jpg',       // รุ่นที่ใช้อยู่
      'abc123-w320v82.jpg',    // ตัวย่อของรุ่นที่ใช้อยู่
      'abc123-w320.jpg',       // ตัวย่อของรูปที่ไม่มีลายน้ำ (ไม่มีเลขรุ่น)
      'logo.png',              // ไฟล์อื่นที่ไม่เข้าแบบแผน
    ];
    const drop = [
      'abc123-wm4.jpg', 'abc123-wm81.jpg', 'def456-wm70.jpg',
      'abc123-w320v4.jpg', 'def456-w640v70.jpg',
    ];
    for (const n of [...keep, ...drop]) await writeFile(path.join(dir, n), 'x');

    const removed = await prune(82);
    assert.equal(removed, drop.length);

    const left = (await readdir(dir)).sort();
    assert.deepEqual(left, [...keep].sort(), 'ลบผิดไฟล์ หรือลบไม่ครบ');
  });

  test('เรียกซ้ำแล้วไม่มีอะไรให้ลบอีก', async () => {
    assert.equal(await prune(82), 0);
  });
});
