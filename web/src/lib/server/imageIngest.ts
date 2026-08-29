/* ย่อและบีบอัดรูปตอนอัปโหลด
 *
 * 29 ส.ค. 2569 · คุณกิตติพงษ์ถามว่าลดขนาดไฟล์ตอนอัปโหลดได้ไหม
 * คลังสื่อตอนนั้น 2.9GB · JPEG เฉลี่ย 1.4MB ใหญ่สุด 7.3MB — เป็นรูปจากมือถือ
 * ขนาดเต็มที่ไม่มีหน้าไหนบนเว็บใช้ความละเอียดขนาดนั้นเลย และเก็บสองชุดต่อรูป
 * (ชุดที่มีลายน้ำกับต้นฉบับสะอาด) พื้นที่จึงโตเป็นเท่าตัว
 *
 * ย่อครั้งเดียวตอนรับเข้า แล้วทั้งสองชุดสร้างจากตัวที่ย่อแล้ว
 *
 * ความกว้างสูงสุดตั้งไว้กว้างกว่าที่หน้าเว็บใช้จริงหลายเท่า (รูปใหญ่สุดบนเว็บ
 * กว้างราว 1,600px) เผื่อไว้ให้ทีมเอาไปทำงานต่อได้ · ไฟล์ที่เล็กกว่านี้อยู่แล้ว
 * ไม่ถูกแตะเลย จะได้ไม่ทำให้รูปที่คมอยู่แล้วแย่ลงโดยเปล่าประโยชน์
 */
import sharp from 'sharp';

export const MAX_EDGE = 2560;
export const JPEG_QUALITY = 82;
export const PNG_EFFORT = 8;

/** ชนิดที่ย่อได้ — PDF และไฟล์อื่นผ่านไปตามเดิม */
export const canShrink = (mime: string) =>
  mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp';

export type Shrunk = { buffer: Buffer; mime: string; width: number | null; height: number | null; changed: boolean };

/**
 * คืนไฟล์ที่ย่อแล้ว · ถ้าย่อไม่ได้หรือย่อแล้วไม่เล็กลง คืนของเดิม
 * รูปพังหรืออ่านไม่ออกต้องไม่ทำให้การอัปโหลดล้ม — ผู้ใช้เสียไฟล์ไปเปล่า ๆ
 */
export async function shrinkImage(input: Buffer, mime: string): Promise<Shrunk> {
  const unchanged: Shrunk = { buffer: input, mime, width: null, height: null, changed: false };
  if (!canShrink(mime)) return unchanged;

  try {
    const img = sharp(input, { failOn: 'none' });
    const meta = await img.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) return unchanged;

    const tooBig = Math.max(w, h) > MAX_EDGE;
    /* หมุนตามข้อมูล EXIF ก่อน แล้วค่อยตัดข้อมูล EXIF ทิ้ง — ไม่งั้นรูปจากมือถือ
       บางรุ่นจะกลายเป็นตะแคงหลังบีบอัด และ EXIF ยังพกพิกัดที่ถ่ายมาด้วย
       ซึ่งไม่ควรหลุดออกไปกับรูปที่เผยแพร่บนเว็บ */
    let pipeline = img.rotate();
    if (tooBig) pipeline = pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });

    const out = mime === 'image/png'
      ? await pipeline.png({ compressionLevel: PNG_EFFORT }).toBuffer()
      : mime === 'image/webp'
        ? await pipeline.webp({ quality: JPEG_QUALITY }).toBuffer()
        : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

    /* บีบแล้วใหญ่ขึ้นก็มี (ไฟล์ที่บีบมาดีอยู่แล้ว) — เก็บของเดิมดีกว่า
       แต่ถ้าต้องย่อขนาดจริง ๆ ต้องใช้ตัวใหม่เสมอ ไม่งั้นรูป 6000px จะรอดไปได้ */
    if (!tooBig && out.length >= input.length) return unchanged;

    const after = await sharp(out).metadata();
    return { buffer: out, mime, width: after.width ?? null, height: after.height ?? null, changed: true };
  } catch {
    return unchanged;
  }
}
