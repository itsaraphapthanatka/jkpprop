/* เอาลายน้ำ "ข้อความ" ที่ฝังตอนอัปโหลดออกจากไฟล์ที่เสิร์ฟ
 *
 *   npm run media:one-watermark              # ดูว่าจะแตะไฟล์ไหนบ้าง
 *   npm run media:one-watermark -- --commit
 *
 * ลูกค้าแจ้งว่า "ทำลายน้ำตำแหน่งเดียวกัน" — รูปหนึ่งใบมีลายน้ำสองชั้นคนละที่:
 * ข้อความที่ประทับตอนอัปโหลด (มุมล่างขวา/เรียงทั้งภาพ) กับโลโก้ที่ประทับตอนเสิร์ฟ
 * ตามค่าใน /admin/branding ชั้นแรกฝังลงไฟล์ถาวรและขยับไม่ได้
 *
 * สคริปต์นี้เอาไฟล์ต้นฉบับ (ที่ระบบเก็บคู่กันไว้เสมอ) มาทับไฟล์สาธารณะ แล้วตั้ง
 * watermarkType = none เหลือลายน้ำโลโก้ชั้นเดียวที่ขยับได้จากหลังบ้าน
 * ไฟล์ที่ไม่มีต้นฉบับเก็บไว้จะถูกข้ามและรายงาน ไม่แตะ
 */
import { PrismaClient } from '@prisma/client';
import { getObject, putObject, originalKey } from '../src/lib/server/mediaStore';

const commit = process.argv.includes('--commit');
const db = new PrismaClient();

const rows = await db.mediaAsset.findMany({ where: { watermarkType: { not: 'none' } } });
console.log(`ไฟล์ที่ยังมีลายน้ำข้อความฝังอยู่: ${rows.length} ไฟล์`);

let done = 0;
const skipped: string[] = [];
for (const a of rows) {
  const original = await getObject(a.id, a.mime, originalKey(a.id, a.mime));
  if (!original) { skipped.push(`${a.filename} (ไม่มีต้นฉบับเก็บไว้)`); continue; }
  done++;
  if (commit) {
    await putObject(a.id, a.mime, original);
    await db.mediaAsset.update({ where: { id: a.id }, data: { watermarkType: 'none' } });
  }
}

/* ภาพย่อและไฟล์ที่ประทับโลโก้ไว้แล้วถูกแคชด้วยเวอร์ชันลายน้ำ — ขยับเวอร์ชันหนึ่ง
   ขั้นเพื่อให้สร้างใหม่จากไฟล์ที่สะอาดแล้ว */
if (commit && done) {
  await db.branding.updateMany({ data: { wmVersion: { increment: 1 } } });
}

console.log(`${commit ? 'ล้างแล้ว' : 'จะล้าง'} ${done} ไฟล์${skipped.length ? ` · ข้าม ${skipped.length}` : ''}`);
for (const s of skipped.slice(0, 10)) console.log('  ข้าม: ' + s);
if (!commit && done) console.log('\nยังไม่เขียนอะไร — ใส่ --commit เพื่อทำจริง');
await db.$disconnect();
