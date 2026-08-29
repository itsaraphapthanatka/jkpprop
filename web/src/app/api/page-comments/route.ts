/* GET/POST /api/page-comments — ความคิดเห็นบนหน้าเช็คลิสต์ที่ส่งให้ลูกค้า
 *
 * แทนที่ comments.php ที่เคยอยู่บนดิสก์ของเครื่องเก่าและต้องมีกฎ nginx เสิร์ฟให้
 * เป็นพิเศษ · 29 ส.ค. 2569 ย้ายเว็บไปเครื่องใหม่ที่ใช้ Cloudflare Tunnel ส่งเข้า
 * แอปตรง ๆ ไม่มี nginx คั่น หน้าเหล่านั้นจึง 404 ทั้งหมดสำหรับลูกค้า ทั้งที่ไฟล์
 * ถูกคัดลอกไปแล้ว
 *
 * 🔵 PUBLIC — หน้าเช็คลิสต์เปิดได้โดยไม่ต้องเข้าสู่ระบบ เพราะส่งลิงก์ให้ลูกค้า
 * ที่ไม่มีบัญชี จึงต้องกันสแปมและกันเนื้อหาบวมด้วยตัวเอง
 */
import { ok, handler, ApiError, rateLimit, clientIp } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { putObject, objectKey, MAX_UPLOAD_BYTES } from '@/lib/server/mediaStore';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const MAX_IMGS = 6;
const MAX_TEXT = 4000;
const MAX_NAME = 60;
/* ภาพหนึ่งใบหลังถอดรหัสแล้ว — หน้าเว็บย่อให้ก่อนส่งอยู่แล้ว ค่านี้เป็นเพดานกันพลาด */
const MAX_IMG_BYTES = 2 * 1024 * 1024;

/* ตัดอักขระควบคุมทิ้ง — มันมองไม่เห็นบนหน้าจอแต่ทำให้ข้อความที่บันทึกไว้
   ต่างจากที่คนพิมพ์ และบางตัวทำให้ layout เพี้ยนตอนแสดงผล */
const CONTROL = /[\u0000-\u001F\u007F]/g;
const clean = (v: unknown, max: number) => String(v ?? '').replace(CONTROL, '').trim().slice(0, max);

export const GET = handler(async (req: Request) => {
  const page = clean(new URL(req.url).searchParams.get('page'), 40);
  const rows = await db.pageComment.findMany({
    where: page ? { page } : {},
    orderBy: { createdAt: 'asc' },
    take: 2000,
  });
  /* รูปร่างเดิมของ comments.php — หน้าเว็บที่ใช้อยู่จะได้ไม่ต้องแก้ตรรกะ */
  return ok({
    comments: rows.map((c) => ({
      id: c.id, item: c.item, name: c.name, text: c.text,
      imgs: c.images, ts: c.createdAt.getTime(),
    })),
  });
});

/* data:image/…;base64,xxxx → เก็บลงคลังสื่อ แล้วคืน URL ที่เสิร์ฟได้
   ใช้คลังสื่อเดียวกับรูปอื่น จะได้อยู่ใน volume ที่มีสำรองรายคืนอยู่แล้ว
   ไม่ใช่โฟลเดอร์แยกที่ไม่มีใครดูแล */
const MIME_OK: Record<string, true> = {
  'image/jpeg': true, 'image/png': true, 'image/webp': true, 'image/gif': true,
};

async function storeImage(dataUri: string): Promise<string | null> {
  const m = /^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUri.trim());
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!MIME_OK[mime]) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (!buf.length || buf.length > MAX_IMG_BYTES) return null;

  const org = await db.org.findFirst({ select: { id: true } });
  if (!org) return null;
  const asset = await db.mediaAsset.create({
    data: {
      orgId: org.id, filename: `comment-${randomUUID().slice(0, 8)}`, mime,
      size: buf.length, path: '', watermarkType: 'none',
    },
  });
  await putObject(asset.id, mime, buf, objectKey(asset.id, mime));
  const src = `/api/media/${asset.id}/raw`;
  await db.mediaAsset.update({ where: { id: asset.id }, data: { path: src } });
  return src;
}

export const POST = handler(async (req: Request) => {
  /* หน้านี้เปิดสาธารณะ — จำกัดจำนวนต่อผู้ใช้ ไม่งั้นใครก็เติมข้อความได้ไม่จำกัด */
  rateLimit(`pc:${clientIp(req)}`, 10, 600_000);

  const raw = await req.text();
  if (raw.length > MAX_UPLOAD_BYTES) throw new ApiError('VALIDATION', 'ข้อมูลใหญ่เกินไป', 413);
  const body = (() => {
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
  })();
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const page = clean(body.page, 40) || 'checklist';
  const item = clean(body.item, 40);
  if (!item) throw new ApiError('VALIDATION', 'ไม่ทราบว่าเป็นความคิดเห็นของข้อไหน', 400);

  const text = clean(body.text, MAX_TEXT);
  const imgsIn = Array.isArray(body.imgs) ? body.imgs.slice(0, MAX_IMGS) : [];
  if (!text && !imgsIn.length) throw new ApiError('VALIDATION', 'กรุณาพิมพ์ข้อความหรือแนบภาพ', 400);

  const images: string[] = [];
  for (const one of imgsIn) {
    const src = typeof one === 'string' ? await storeImage(one) : null;
    /* ภาพที่อ่านไม่ออกให้ข้ามไป ไม่ทิ้งทั้งความคิดเห็น — คนพิมพ์ข้อความมาแล้ว */
    if (src) images.push(src);
  }

  const row = await db.pageComment.create({
    data: { page, item, name: clean(body.name, MAX_NAME) || 'ไม่ระบุชื่อ', text, images },
  });

  return ok({
    ok: true,
    comment: {
      id: row.id, item: row.item, name: row.name, text: row.text,
      imgs: row.images, ts: row.createdAt.getTime(),
    },
  }, { status: 201 });
});
