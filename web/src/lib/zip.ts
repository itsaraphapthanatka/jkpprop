/* ZIP แบบเก็บดิบ (stored, ไม่บีบอัด) — ใช้รวมรูปของประกาศหนึ่งให้โหลดทีเดียว
 *
 * สไลด์ 35 · "Social Status ไม่มีให้โหลดรูปภาพของแต่ละประกาศ · จำเป็น"
 * ทีมต้องเอารูปไปโพสต์ตามช่องทาง แต่หน้านี้ให้ได้แค่ดูรูปหน้าปก จะเอารูปจริงต้อง
 * ไปเปิดหน้าทรัพย์แล้วคลิกขวาบันทึกทีละใบ
 *
 * เขียนเองเพราะไม่อยากลากไลบรารีบีบอัดเข้ามาเพื่องานเดียว และรูปเป็น JPEG/PNG
 * ที่บีบอัดมาแล้ว การบีบซ้ำแทบไม่ลดขนาด — โหมด stored จึงเหมาะกว่าและสั้นกว่ามาก
 *
 * รูปแบบไฟล์: local header ต่อหนึ่งไฟล์ → central directory → end record
 * (PKWARE APPNOTE 4.3) ใช้ได้กับตัวแตกไฟล์ของ Windows, macOS และ Google Drive
 *
 * ข้อควรรู้: ชื่อไฟล์ "ข้างใน" ควรเป็น ASCII — ตั้งธง UTF-8 (บิต 11) ไว้แล้วก็จริง
 * และตัวแตกไฟล์รุ่นใหม่อ่านได้ แต่ unzip ที่ติดมากับ macOS เป็นรุ่นเก่า เขียนไฟล์
 * ชื่อไทยไม่ได้ (จบด้วยรหัส 50) ตัวเรียกใช้จึงตั้งชื่อด้วยรหัสทรัพย์ล้วน ๆ
 * ส่วนชื่อไฟล์ ZIP ด้านนอกเป็นภาษาไทยได้ ไม่เกี่ยวกัน
 */

/** ตาราง CRC-32 มาตรฐาน สร้างครั้งเดียวตอนเรียกใช้ครั้งแรก */
let TABLE: Uint32Array | null = null;
const crcTable = (): Uint32Array => {
  if (TABLE) return TABLE;
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  TABLE = t;
  return t;
};

export function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

export type ZipEntry = { name: string; bytes: Uint8Array };

/* วันเวลาในรูปแบบ MS-DOS ที่ ZIP ใช้ — ตัวแตกไฟล์บางตัวไม่ยอมถ้าเป็นศูนย์ */
const dosTime = (d: Date) =>
  ((d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2))) & 0xFFFF;
const dosDate = (d: Date) =>
  (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;

/** รวมไฟล์เป็น ZIP หนึ่งก้อน — ชื่อไฟล์เข้ารหัส UTF-8 (ตั้งธงบิต 11 ไว้) */
export function buildZip(entries: ZipEntry[], now = new Date()): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const time = dosTime(now);
  const date = dosDate(now);

  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = enc.encode(e.name);
    const crc = crc32(e.bytes);
    const size = e.bytes.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);   // signature
    lv.setUint16(4, 20, true);           // version needed
    lv.setUint16(6, 0x0800, true);       // flag: ชื่อไฟล์เป็น UTF-8
    lv.setUint16(8, 0, true);            // method 0 = stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);        // compressed
    lv.setUint32(22, size, true);        // uncompressed
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);           // extra length
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);           // version made by
    cv.setUint16(6, 20, true);           // version needed
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);      // ตำแหน่งของ local header
    central.set(name, 46);

    locals.push(local, e.bytes);
    centrals.push(central);
    offset += local.length + size;
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const total = offset + centralSize + end.length;
  const out = new Uint8Array(new ArrayBuffer(total));
  let at = 0;
  for (const part of [...locals, ...centrals, end]) { out.set(part, at); at += part.length; }
  return out;
}

/** นามสกุลจากชนิดไฟล์ที่เซิร์ฟเวอร์ตอบมา — ชื่อในลิงก์ไม่ได้บอกเสมอไป */
export const extForMime = (mime: string): string => {
  const m = mime.split(';')[0].trim().toLowerCase();
  return m === 'image/png' ? 'png'
    : m === 'image/webp' ? 'webp'
      : m === 'image/gif' ? 'gif'
        : 'jpg';
};

/** ชื่อไฟล์ที่ระบบไฟล์ทุกตัวรับได้ */
export const safeFileName = (s: string): string =>
  s.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) || 'file';
