/* PATCH /api/users/:id/status — activate / deactivate a user (§12.5).
   Owner only, and an owner cannot deactivate themselves (lock-out guard). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');
  const { id } = await ctx.params;
  if (id === actor.id) throw new ApiError('VALIDATION', 'ปิดใช้งานบัญชีของตัวเองไม่ได้', 400);

  const target = await db.user.findFirst({ where: { id, orgId: actor.orgId } });
  if (!target) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้นี้', 404);

  const body = (await req.json().catch(() => null)) as { active?: boolean } | null;
  const active = typeof body?.active === 'boolean' ? body.active : !target.active;

  await db.user.update({ where: { id }, data: { active } });
  // deactivating kills existing sessions immediately
  if (!active) await db.session.deleteMany({ where: { userId: id } });

  await audit({
    user: actor, orgId: actor.orgId, action: 'user.status', entity: 'user', entityId: id,
    before: { active: target.active }, after: { active },
  });
  return ok({ id, active });
});
