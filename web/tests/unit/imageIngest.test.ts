/* ย่อและบีบอัดรูปตอนอัปโหลด
 *
 * 29 ส.ค. 2569 · คลังสื่อ 2.9GB · JPEG เฉลี่ย 1.4MB ใหญ่สุด 7.3MB เป็นรูปจาก
 * มือถือขนาดเต็มที่ไม่มีหน้าไหนบนเว็บใช้ความละเอียดขนาดนั้น และเก็บสองชุดต่อรูป
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { shrinkImage, MAX_EDGE } from '../../src/lib/server/imageIngest.ts';

/* รูปที่มีรายละเอียดจริง — ภาพสีเดียวบีบได้เกือบเป็นศูนย์ ทดสอบแล้วไม่บอกอะไร */
const photo = (w: number, h: number) => {
  const px = Buffer.alloc(w * h * 3);
  for (let i = 0; i < px.length; i += 3) {
    px[i] = (i * 7) % 256; px[i + 1] = (i * 13) % 256; px[i + 2] = (i * 29) % 256;
  }
  return sharp(px, { raw: { width: w, height: h, channels: 3 } });
};

describe('ย่อรูปตอนอัปโหลด', () => {
  test('รูปที่ใหญ่เกินกำหนด ถูกย่อลงและเล็กลงจริง', async () => {
    const big = await photo(4000, 3000).jpeg({ quality: 95 }).toBuffer();
    const r = await shrinkImage(big, 'image/jpeg');
    assert.equal(r.changed, true, 'ไม่ได้ย่อเลย');
    assert.ok(Math.max(r.width!, r.height!) <= MAX_EDGE, `ยังกว้าง ${r.width}x${r.height}`);
    assert.ok(r.buffer.length < big.length, 'ย่อแล้วแต่ไฟล์ไม่เล็กลง');
  });

  test('รูปที่เล็กอยู่แล้วและบีบมาดีแล้ว ไม่ถูกแตะ', async () => {
    const small = await photo(800, 600).jpeg({ quality: 60 }).toBuffer();
    const r = await shrinkImage(small, 'image/jpeg');
    assert.equal(r.changed, false, 'ไปบีบรูปที่บีบมาดีอยู่แล้วจนอาจแย่ลง');
    assert.equal(r.buffer, small);
  });

  test('PNG ยังเป็น PNG · WebP ยังเป็น WebP', async () => {
    for (const [mime, make] of [
      ['image/png', () => photo(3200, 2400).png().toBuffer()],
      ['image/webp', () => photo(3200, 2400).webp({ quality: 95 }).toBuffer()],
    ] as const) {
      const src = await make();
      const r = await shrinkImage(src, mime);
      assert.equal(r.mime, mime, `${mime} ถูกเปลี่ยนชนิดไฟล์`);
      const meta = await sharp(r.buffer).metadata();
      assert.ok((meta.width ?? 0) <= MAX_EDGE, `${mime} ยังกว้างเกิน`);
    }
  });

  test('PDF และไฟล์ที่ย่อไม่ได้ ผ่านไปเหมือนเดิม', async () => {
    const pdf = Buffer.from('%PDF-1.4 ไม่ใช่รูป');
    const r = await shrinkImage(pdf, 'application/pdf');
    assert.equal(r.changed, false);
    assert.equal(r.buffer, pdf);
  });

  test('ไฟล์เสียต้องไม่ทำให้การอัปโหลดล้ม', async () => {
    const broken = Buffer.from('ไม่ใช่รูปเลยสักนิด');
    const r = await shrinkImage(broken, 'image/jpeg');
    assert.equal(r.changed, false, 'ควรคืนของเดิมแทนที่จะโยน error');
    assert.equal(r.buffer, broken);
  });

  test('ข้อมูล EXIF ถูกตัดออก — พิกัดที่ถ่ายต้องไม่ติดไปกับรูปบนเว็บ', async () => {
    const withExif = await photo(3000, 2000)
      .withExif({ IFD0: { Copyright: 'JKP' }, GPS: { GPSLatitudeRef: 'N' } })
      .jpeg({ quality: 90 }).toBuffer();
    const r = await shrinkImage(withExif, 'image/jpeg');
    const meta = await sharp(r.buffer).metadata();
    assert.equal(meta.exif, undefined, 'EXIF ยังติดมากับรูปที่จะเผยแพร่');
  });
});
