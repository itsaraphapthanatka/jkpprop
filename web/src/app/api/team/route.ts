/* GET /api/team — สมุดรายชื่อทีม
 *
 * สไลด์ 45 · "ไม่มีหน้าแสดงต่อ ข้อมูลติดต่อและตำแหน่งคนในทีม"
 *
 * /api/users มีอยู่แล้วแต่เป็นของเจ้าของระบบคนเดียว เพราะมันส่งบทบาท ขอบเขต
 * และสิทธิ์พิเศษออกไปด้วย ซึ่งไม่ควรให้ทุกคนเห็น
 *
 * อันนี้ส่งเฉพาะสิ่งที่คนในทีมต้องใช้ติดต่อกัน — ชื่อ ตำแหน่ง เบอร์ LINE อีเมล
 * ไม่มีสิทธิ์ ไม่มีขอบเขต ไม่มีวันหมดอายุบัญชี และเห็นเฉพาะบัญชีที่ยังใช้งานอยู่
 * เบอร์ของเพื่อนร่วมงานไม่ใช่ข้อมูลลูกค้า จึงไม่ต้องปิดบังตามกติกา PDPA ที่ใช้
 * กับ lead — แต่ก็ไม่ออกไปหน้าเว็บสาธารณะเช่นกัน
 */
import { ok, handler } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';

export const GET = handler(async () => {
  const me = await requireUser();
  const rows = await db.user.findMany({
    where: { orgId: me.orgId, active: true },
    select: { id: true, name: true, email: true, role: true, phone: true, line: true, address: true },
    orderBy: { name: 'asc' },
  });
  return ok({
    items: rows.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      phone: u.phone ?? '', line: u.line ?? '', address: u.address ?? '',
      me: u.id === me.id,
    })),
  });
});
