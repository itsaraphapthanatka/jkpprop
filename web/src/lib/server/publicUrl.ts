/* ที่อยู่จริงของเว็บ สำหรับใส่ในลิงก์ที่ส่งออกไปข้างนอก
 *
 * 29 ส.ค. 2569 · ลิงก์ตั้งรหัสผ่านที่ส่งให้ผู้ใช้ชี้ไปที่ https://0.0.0.0/... กดแล้ว
 * เบราว์เซอร์ขึ้น ERR_SSL_PROTOCOL_ERROR
 *
 * เพราะเดิมประกอบ URL จาก new URL(req.url).origin ซึ่งเป็นที่อยู่ที่ "โปรเซส"
 * รับคำขอ ไม่ใช่ที่อยู่ที่ "ผู้ใช้" พิมพ์ — แอปรันใน container ที่ผูกกับ 0.0.0.0:3000
 * และมี nginx อยู่หน้า ค่าที่ได้จึงเป็น 0.0.0.0:3000 เสมอ
 *
 * ที่อยู่จริงอยู่ในหัวข้อความที่ nginx ส่งต่อมาให้ (X-Forwarded-Host / -Proto)
 */

/* ที่อยู่ระดับเครือข่ายที่ไม่มีทางเป็นชื่อเว็บจริง — ถ้าเจอค่าพวกนี้แปลว่าอ่าน
   มาจากที่ผิด ให้ถอยไปหาแหล่งถัดไปแทนที่จะปล่อยลิงก์เสียออกไป */
const NOT_A_SITE = new Set(['0.0.0.0', '127.0.0.1', '::1', 'localhost']);

const hostOnly = (v: string) => v.split(',')[0].trim().replace(/^\[|\]$/g, '').split(':')[0];

export function publicOrigin(req: Request): string {
  const h = req.headers;
  const proto = (h.get('x-forwarded-proto') ?? '').split(',')[0].trim();
  const candidates = [h.get('x-forwarded-host'), h.get('host')];

  for (const raw of candidates) {
    if (!raw) continue;
    const first = raw.split(',')[0].trim();
    if (!first || NOT_A_SITE.has(hostOnly(first))) continue;
    /* ไม่มี x-forwarded-proto (เช่นเรียกตรงตอนพัฒนา) — เดาจากพอร์ตแทน */
    const scheme = proto || (first.includes(':') ? 'http' : 'https');
    return `${scheme}://${first}`;
  }

  /* ไม่มีหัวข้อความให้ใช้เลย — ถอยไปที่ URL ของคำขอ ซึ่งใช้ได้ตอนพัฒนาในเครื่อง */
  const fallback = new URL(req.url).origin;
  return fallback;
}

/** ลิงก์เต็มที่เอาไปวางในอีเมลได้ */
export const publicUrl = (req: Request, path: string) => new URL(path, publicOrigin(req)).toString();
