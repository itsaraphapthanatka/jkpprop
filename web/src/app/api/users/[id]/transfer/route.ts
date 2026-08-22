/* POST /api/users/:id/transfer — โอนทรัพย์ทั้งหมดของคนหนึ่งไปให้อีกคน
 *
 * สไลด์ 46 · "เจ้าของสามารถโอนสิทธิ์ Property ได้ · เตรียมไว้คนลาออก"
 *
 * คอลัมน์ ownerId บนทรัพย์มีมาตั้งแต่แรกและตั้งให้คนสร้างตอนสร้าง แต่ไม่เคยมี
 * ทางแก้ วันที่คนดูแลลาออกจริง ทรัพย์ของเขาจะค้างอยู่กับบัญชีที่ปิดไปแล้ว —
 * ปิดบัญชีแล้วเซสชันถูกลบทันที แต่ทรัพย์ยังผูกกับ id นั้นตลอดไป
 *
 * ทำทีละใบผ่านหน้าทรัพย์ก็ได้ (PATCH /api/properties/:id) แต่คนลาออกหนึ่งคนมี
 * ทรัพย์เป็นร้อย จึงต้องมีทางโอนยกชุด
 *
 * เจ้าของระบบเท่านั้น ตามที่สไลด์เขียน
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const runtime = 'nodejs';

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');
  const { id } = await ctx.params;

  const from = await db.user.findFirst({ where: { id, orgId: actor.orgId } });
  if (!from) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้ที่จะโอนทรัพย์ออก', 404);

  const body = (await req.json().catch(() => null)) as { toUserId?: string } | null;
  const toId = String(body?.toUserId ?? '').trim();
  if (!toId) throw new ApiError('VALIDATION', 'กรุณาเลือกผู้รับโอน', 400);
  if (toId === id) throw new ApiError('VALIDATION', 'โอนให้ตัวเองไม่ได้', 400);

  /* ผู้รับต้องเป็นบัญชีที่ยังใช้งานอยู่ — โอนไปให้บัญชีที่ปิดแล้วคือย้ายปัญหา
     เดิมไปไว้อีกที่ */
  const to = await db.user.findFirst({ where: { id: toId, orgId: actor.orgId, active: true } });
  if (!to) throw new ApiError('VALIDATION', 'ผู้รับโอนต้องเป็นบัญชีที่ยังใช้งานอยู่', 400);

  const { count } = await db.property.updateMany({
    where: { orgId: actor.orgId, ownerId: id },
    data: { ownerId: toId },
  });

  await audit({
    user: actor, orgId: actor.orgId, action: 'user.transfer_properties', entity: 'user', entityId: id,
    before: { owner: from.name, ownerId: id },
    after: { newOwner: to.name, newOwnerId: toId, moved: count },
  });

  return ok({ moved: count, from: from.name, to: to.name });
});
