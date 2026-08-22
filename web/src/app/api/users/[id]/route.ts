/* PATCH / DELETE /api/users/:id — แก้อีเมล และลบบัญชีออกจากระบบ
 *
 * ลูกค้าแจ้งว่า "Users & Roles ไม่มี ลบ user และไม่มีแก้ไข email"
 *
 * เดิมทำได้แค่สร้าง (invite) ปิดใช้งาน (status) และตั้งสิทธิ์ (permissions)
 * อีเมลตั้งได้ครั้งเดียวตอนเชิญ พิมพ์ผิดก็แก้ไม่ได้ ต้องเชิญใหม่แล้วปล่อยบัญชี
 * ที่พิมพ์ผิดค้างไว้ — ซึ่งเป็นที่มาของบัญชีขยะในรายชื่อ
 *
 * เจ้าของระบบเท่านั้น ทั้งสองอย่าง
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---- แก้อีเมล ------------------------------------------------------- */
export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');
  const { id } = await ctx.params;

  const target = await db.user.findFirst({ where: { id, orgId: actor.orgId } });
  if (!target) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้นี้', 404);

  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  /* อีเมลเป็นชื่อผู้ใช้ตอนเข้าสู่ระบบ — ตัดช่องว่างและทำเป็นตัวพิมพ์เล็กให้
     เหมือนกันทุกที่ ไม่งั้น "A@x.com" กับ "a@x.com" จะกลายเป็นคนละบัญชี */
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!email) throw new ApiError('VALIDATION', 'กรุณากรอกอีเมล', 400);
  if (email.length > 160) throw new ApiError('VALIDATION', 'อีเมลยาวเกินไป', 400);
  if (!EMAIL.test(email)) throw new ApiError('VALIDATION', 'รูปแบบอีเมลไม่ถูกต้อง', 400);
  if (email === target.email) return ok({ id, email });

  /* อีเมลซ้ำได้ทั้งระบบ ไม่ใช่แค่ในองค์กรเดียวกัน (unique ที่คอลัมน์) เช็คก่อน
     เพื่อได้ข้อความไทย แทนที่จะโยน error ของฐานข้อมูลออกไป */
  const taken = await db.user.findUnique({ where: { email } });
  if (taken) throw new ApiError('VALIDATION', 'อีเมลนี้มีคนใช้แล้ว', 400);

  await db.user.update({ where: { id }, data: { email } });
  await audit({
    user: actor, orgId: actor.orgId, action: 'user.update', entity: 'user', entityId: id,
    before: { email: target.email }, after: { email },
  });
  return ok({ id, email });
});

/* ---- ลบบัญชี -------------------------------------------------------- */
export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');
  const { id } = await ctx.params;
  if (id === actor.id) throw new ApiError('VALIDATION', 'ลบบัญชีของตัวเองไม่ได้', 400);

  const target = await db.user.findFirst({ where: { id, orgId: actor.orgId } });
  if (!target) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้นี้', 404);

  /* เหลือเจ้าของระบบคนเดียวแล้วลบทิ้ง = ไม่มีใครตั้งสิทธิ์ให้ใครได้อีกเลย */
  if (target.role === 'owner') {
    const owners = await db.user.count({ where: { orgId: actor.orgId, role: 'owner' } });
    if (owners <= 1) throw new ApiError('VALIDATION', 'ลบเจ้าของระบบคนสุดท้ายไม่ได้ — ตั้งเจ้าของอีกคนก่อน', 400);
  }

  /* ownerId กับ assigneeId เป็นข้อความเปล่า ไม่มี foreign key ฐานข้อมูลจึงยอม
     ให้ลบได้เงียบ ๆ แล้วทิ้งทรัพย์กับ lead ผูกกับ id ที่ไม่มีตัวตน ซึ่งจะหลุด
     ออกจากทุกตัวกรองและไม่มีใครเห็นอีกเลย · ต้องโอนออกให้หมดก่อน (ปุ่ม
     "โอนทรัพย์" ในหน้าเดียวกัน) */
  const [props, leads] = await Promise.all([
    db.property.count({ where: { orgId: actor.orgId, ownerId: id } }),
    db.lead.count({ where: { orgId: actor.orgId, assigneeId: id } }),
  ]);
  if (props || leads) {
    const parts = [props ? `ทรัพย์ ${props} รายการ` : '', leads ? `lead ${leads} รายการ` : ''].filter(Boolean);
    throw new ApiError('VALIDATION', `ยังมี${parts.join(' และ ')}อยู่กับบัญชีนี้ — โอนออกให้คนอื่นก่อนจึงจะลบได้`, 400);
  }

  /* บันทึกก่อนลบ เพราะหลังลบแล้วไม่เหลือชื่อให้เขียนลง audit
     AuditLog เก็บ userName ไว้ในแถวอยู่แล้ว ประวัติเก่าจึงยังอ่านออก */
  await audit({
    user: actor, orgId: actor.orgId, action: 'user.delete', entity: 'user', entityId: id,
    before: { name: target.name, email: target.email, role: target.role }, after: null,
  });
  await db.session.deleteMany({ where: { userId: id } });
  await db.user.delete({ where: { id } });

  return ok({ id, deleted: true });
});
