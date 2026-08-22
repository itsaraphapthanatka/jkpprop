/* GET / PATCH /api/me — โปรไฟล์ของบัญชีที่ล็อกอินอยู่
 *
 * สไลด์ 45 · "ไม่มีหน้าที่ใส่ข้อมูลโปรไฟล์ของฉัน ควรตั้งชื่อได้ เบอร์โทร LINE
 * ที่อยู่ปัจจุบัน"
 *
 * เดิมแก้ข้อมูลตัวเองไม่ได้เลย มีแต่หน้าเปลี่ยนรหัสผ่าน ชื่อกับเบอร์ต้องรอให้
 * เจ้าของระบบแก้ให้จากหน้า Users ซึ่งเป็นหน้าที่คนอื่นเปิดไม่ได้
 *
 * แก้ได้เฉพาะข้อมูลติดต่อของตัวเอง — บทบาท ขอบเขต และสิทธิ์พิเศษไม่อยู่ในนี้
 * ต่อให้ยิงมาก็ไม่ถูกอ่าน คนจะได้เลื่อนขั้นตัวเองไม่ได้
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);

const dto = (u: { id: string; name: string; email: string; role: string; phone: string | null; line: string | null; address: string | null }) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  phone: u.phone ?? '', line: u.line ?? '', address: u.address ?? '',
});

export const GET = handler(async () => {
  const u = await requireUser();
  return ok(dto(u));
});

export const PATCH = handler(async (req: Request) => {
  const u = await requireUser();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const name = clean(body.name, 120);
  /* ชื่อว่างไม่ได้ — ชื่อนี้ไปโผล่ในช่อง "มอบหมาย" ในประวัติของ lead และใน
     audit log ถ้าปล่อยว่าง หน้าพวกนั้นจะมีแถวที่ไม่รู้ว่าใครทำ */
  if (name !== undefined && !name) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อ', 400);

  const data = {
    ...(name !== undefined ? { name } : {}),
    ...(clean(body.phone, 40) !== undefined ? { phone: clean(body.phone, 40) || null } : {}),
    ...(clean(body.line, 80) !== undefined ? { line: clean(body.line, 80) || null } : {}),
    ...(clean(body.address, 300) !== undefined ? { address: clean(body.address, 300) || null } : {}),
  };
  if (!Object.keys(data).length) return ok(dto(u));

  const updated = await db.user.update({ where: { id: u.id }, data });
  await audit({
    user: u, orgId: u.orgId, action: 'me.update', entity: 'user', entityId: u.id,
    before: { name: u.name, phone: u.phone, line: u.line, address: u.address },
    after: { name: updated.name, phone: updated.phone, line: updated.line, address: updated.address },
  });
  return ok(dto(updated));
});
