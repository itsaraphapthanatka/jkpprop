/* ตัวรวมไฟล์ ZIP (lib/zip) — สไลด์ 35 "Social Status ไม่มีให้โหลดรูปภาพของแต่ละ
   ประกาศ · จำเป็น" หน้านั้นรวมรูปเป็นไฟล์เดียวให้ทีมโหลดไปโพสต์
   ไฟล์ที่สร้างต้องแตกได้จริงด้วยตัวแตกไฟล์มาตรฐาน ไม่ใช่แค่มีขนาดถูก — เทสต์นี้
   จึงให้ระบบปฏิบัติการแตกไฟล์จริงแล้วเทียบเนื้อในทีละไบต์ */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildZip, crc32, extForMime, safeFileName } from '../../src/lib/zip.ts';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('รวมไฟล์เป็น ZIP', () => {
  test('CRC-32 ตรงกับค่ามาตรฐาน', () => {
    // ค่าอ้างอิงที่ทุกตำราใช้
    assert.equal(crc32(bytes('123456789')).toString(16), 'cbf43926');
    assert.equal(crc32(new Uint8Array(0)), 0);
  });

  test('ไฟล์ที่ได้แตกได้จริง และเนื้อในตรงทุกไบต์', () => {
    /* ชื่อไฟล์ข้างในเป็นรหัสทรัพย์ ซึ่งเป็น ASCII เสมอ — ตรงกับที่ฟีเจอร์สร้างจริง */
    const files = [
      { name: 'JKPBKK1005-01.jpg', bytes: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3, 0]) },
      { name: 'JKPBKK1005-02.png', bytes: bytes('เนื้อไฟล์ภาษาไทย ทดสอบ UTF-8') },
      { name: 'JKPBKK1005-03.jpg', bytes: new Uint8Array(0) },
    ];
    const dir = mkdtempSync(join(tmpdir(), 'jkpzip-'));
    try {
      const zipPath = join(dir, 'out.zip');
      writeFileSync(zipPath, buildZip(files, new Date(2026, 7, 22, 10, 30, 0)));

      // ให้ตัวแตกไฟล์ของเครื่องเป็นคนตัดสิน ไม่ใช่โค้ดของเราเอง
      execFileSync('unzip', ['-qq', 'out.zip', '-d', 'x'], { cwd: dir });
      assert.deepEqual(readdirSync(join(dir, 'x')).sort(), files.map((f) => f.name).sort());

      for (const f of files) {
        const back = new Uint8Array(readFileSync(join(dir, 'x', f.name)));
        assert.deepEqual([...back], [...f.bytes], f.name);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /* ธง "ชื่อไฟล์เป็น UTF-8" (บิต 11) ต้องถูกตั้งไว้ ตัวแตกไฟล์รุ่นใหม่จะได้อ่าน
     ชื่อไทยถูก — ส่วน unzip ที่ติดมากับ macOS เป็นรุ่นเก่าและเขียนไฟล์ชื่อไทย
     ไม่ได้ (จบด้วยรหัส 50) ฟีเจอร์นี้จึงตั้งชื่อไฟล์ข้างในด้วยรหัสทรัพย์ล้วน ๆ */
  test('ตั้งธงชื่อไฟล์เป็น UTF-8 ไว้ในหัวทั้งสองที่', () => {
    const z = buildZip([{ name: 'ไทย.txt', bytes: new Uint8Array([1]) }]);
    const dv = new DataView(z.buffer, z.byteOffset, z.byteLength);
    assert.equal(dv.getUint16(6, true) & 0x0800, 0x0800, 'local header');
    const nameLen = new TextEncoder().encode('ไทย.txt').length;
    const centralAt = 30 + nameLen + 1;
    assert.equal(dv.getUint32(centralAt, true), 0x02014b50, 'central directory อยู่ตรงตำแหน่งที่คำนวณไว้');
    assert.equal(dv.getUint16(centralAt + 8, true) & 0x0800, 0x0800, 'central directory');
  });

  test('ไฟล์เปล่า (ไม่มีรูปสักใบ) ยังเป็น ZIP ที่ถูกต้อง', () => {
    const z = buildZip([]);
    assert.equal(z.length, 22, 'เหลือแค่ end-of-central-directory');
    assert.deepEqual([...z.slice(0, 4)], [0x50, 0x4b, 0x05, 0x06]);
  });

  test('เดานามสกุลจากชนิดไฟล์ที่เซิร์ฟเวอร์ตอบ', () => {
    assert.equal(extForMime('image/png'), 'png');
    assert.equal(extForMime('image/webp'), 'webp');
    assert.equal(extForMime('image/jpeg; charset=binary'), 'jpg');
    assert.equal(extForMime(''), 'jpg', 'ไม่รู้ก็เดาเป็น jpg ดีกว่าไม่มีนามสกุล');
  });

  test('ชื่อไฟล์ที่ระบบไฟล์รับไม่ได้ถูกแทนที่', () => {
    assert.equal(safeFileName('JKP/BKK:1005*?'), 'JKP-BKK-1005--');
    assert.equal(safeFileName('   '), 'file');
    assert.ok(safeFileName('ก'.repeat(200)).length <= 80);
  });
});
