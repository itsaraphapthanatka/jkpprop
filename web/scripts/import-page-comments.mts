/* ขนความคิดเห็นบนหน้าเช็คลิสต์จากไฟล์ JSON เดิม เข้ามาเก็บในฐานข้อมูล
 *
 *   npx tsx scripts/import-page-comments.mts <comments.json> <โฟลเดอร์ uploads> [--commit]
 *
 * เดิมข้อมูลนี้เป็นไฟล์บนดิสก์ของเครื่องเก่า คู่กับ PHP หนึ่งไฟล์และกฎ nginx
 * · 29 ส.ค. 2569 ย้ายเว็บไปเครื่องใหม่ที่ใช้ Cloudflare Tunnel ส่งเข้าแอปตรง ๆ
 * หน้าเหล่านั้นจึง 404 ทั้งหมดสำหรับลูกค้า
 *
 * ภาพแนบถูกย้ายเข้าคลังสื่อเดียวกับรูปอื่น จะได้อยู่ใน volume ที่มีสำรองรายคืน
 * อยู่แล้ว ไม่ใช่โฟลเดอร์แยกที่ไม่มีใครดูแล
 *
 * รันซ้ำได้ — ข้ามรายการที่ขนไปแล้ว โดยดูจากชื่อ เวลา และข้อไหน
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { putObject, objectKey } from '../src/lib/server/mediaStore.ts';

const [, , jsonPath, uploadsDir] = process.argv;
const commit = process.argv.includes('--commit');
if (!jsonPath || !uploadsDir) {
  console.error('ใช้: npx tsx scripts/import-page-comments.mts <comments.json> <uploadsDir> [--commit]');
  process.exit(1);
}

/* คีย์ของแต่ละหน้าถูกตั้งไม่ให้ชนกันตั้งแต่ตอนที่ทั้งสามหน้าใช้ที่เก็บก้อนเดียวกัน
   ตอนนี้แยก page แล้ว จึงแปลงกลับตามรูปแบบชื่อคีย์ */
const pageOf = (item: string): string => {
  if (item.startsWith('f') && /^f(\d+|plan|general)$/.test(item)) return 'flow';
  if (/^c(\d+|plan|general)$/.test(item)) return 'compare';
  return 'checklist';
};

const EXT_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif',
};

/** รับได้ทั้งข้อความ ISO และตัวเลขมิลลิวินาที */
function parseWhen(v: unknown): Date {
  if (typeof v === 'number' && Number.isFinite(v)) return new Date(v);
  const d = new Date(String(v ?? ''));
  if (!Number.isNaN(d.getTime())) return d;
  throw new Error(`อ่านเวลาไม่ออก: ${JSON.stringify(v)}`);
}

const db = new PrismaClient();

type Old = { item?: unknown; name?: unknown; text?: unknown; imgs?: unknown; ts?: unknown };

const raw = JSON.parse(await readFile(jsonPath, 'utf8')) as { comments?: Old[] } | Old[];
const rows: Old[] = Array.isArray(raw) ? raw : (raw.comments ?? []);
console.log(`อ่านมาได้ ${rows.length} ความคิดเห็น`);

const org = await db.org.findFirst({ select: { id: true } });
if (!org) { console.error('ไม่พบ organization — ฐานข้อมูลนี้ยังไม่ได้ seed'); process.exit(1); }

let added = 0, skipped = 0, images = 0, missing = 0;

for (const c of rows) {
  const item = String(c.item ?? '').trim();
  if (!item) { skipped += 1; continue; }
  const page = pageOf(item);
  const name = String(c.name ?? 'ไม่ระบุชื่อ').slice(0, 60);
  const text = String(c.text ?? '').slice(0, 4000);
  /* ไฟล์เดิมเก็บเวลาเป็นข้อความ ISO ("2026-08-23T11:00:27+00:00") ไม่ใช่ตัวเลข
     Number() จึงได้ NaN แล้วตกไปใช้เวลาปัจจุบัน — วันเวลาของทุกความคิดเห็นจะ
     กลายเป็นวันที่ขนข้อมูล และตัวกันซ้ำก็ใช้ไม่ได้เพราะเวลาต่างกันทุกรอบ */
  const createdAt = parseWhen(c.ts);

  const already = await db.pageComment.findFirst({ where: { page, item, name, createdAt } });
  if (already) { skipped += 1; continue; }

  const imgs: string[] = [];
  for (const rel of (Array.isArray(c.imgs) ? c.imgs : []) as string[]) {
    const file = path.join(uploadsDir, path.basename(String(rel)));
    const ext = path.extname(file).toLowerCase();
    const mime = EXT_MIME[ext];
    if (!mime) { missing += 1; continue; }
    const buf = await readFile(file).catch(() => null);
    /* ภาพที่หายไปแล้วไม่ควรทำให้ทั้งความคิดเห็นตกหล่น — ข้อความสำคัญกว่า */
    if (!buf || !buf.length) { missing += 1; continue; }

    if (commit) {
      const asset = await db.mediaAsset.create({
        data: {
          orgId: org.id, filename: path.basename(file), mime,
          size: buf.length, path: '', watermarkType: 'none', createdAt,
        },
      });
      await putObject(asset.id, mime, buf, objectKey(asset.id, mime));
      const src = `/api/media/${asset.id}/raw`;
      await db.mediaAsset.update({ where: { id: asset.id }, data: { path: src } });
      imgs.push(src);
    }
    images += 1;
  }

  if (commit) {
    await db.pageComment.create({ data: { page, item, name, text, images: imgs, createdAt } });
  }
  added += 1;
}

console.log(`เพิ่ม ${added} · ข้าม ${skipped} · ภาพ ${images}${missing ? ` · ภาพที่หาไม่เจอ ${missing}` : ''}`);
if (!commit) console.log('— ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)');
await db.$disconnect();
