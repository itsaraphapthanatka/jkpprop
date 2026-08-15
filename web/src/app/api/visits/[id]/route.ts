/* PATCH /api/visits/:id — availability gate + completion + per-stop outcome.
   FR-AVL-04: the route sheet stays locked until the gate is confirmed. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'co_agent', 'ops');
  const { id } = await ctx.params;

  const visit = await db.visit.findFirst({ where: { id, orgId: user.orgId }, include: { stops: true } });
  if (!visit) throw new ApiError('NOT_FOUND', 'ไม่พบแผนการเข้าชมนี้', 404);

  const body = (await req.json().catch(() => null)) as
    | { gateConfirmed?: boolean; status?: string; note?: string; outcomes?: Record<string, string> }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const data: Prisma.VisitUpdateInput = {};
  if (typeof body.gateConfirmed === 'boolean') data.gateConfirmed = body.gateConfirmed;
  if (typeof body.note === 'string') data.note = body.note.slice(0, 2000);
  if (typeof body.status === 'string') {
    if (!['scheduled', 'done', 'cancelled'].includes(body.status)) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);
    /* This gate is FR-VIS-07: the customer confirming their criteria have not
       changed. It answered with the availability gate's code and wording, so
       whoever hit it went off to check whether the properties were still free
       instead of ringing the customer. */
    if (body.status === 'done' && !(body.gateConfirmed ?? visit.gateConfirmed)) {
      throw new ApiError('GATE_REQUIRED', 'ต้องยืนยันเกณฑ์กับลูกค้าก่อน (FR-VIS-07) — กด "ยืนยันไม่เปลี่ยน" ที่หัวแผน หรือกลับไปแก้ requirement ถ้าลูกค้าเปลี่ยนเกณฑ์', 400);
    }
    data.status = body.status;
  }

  if (body.outcomes && typeof body.outcomes === 'object') {
    for (const [stopId, result] of Object.entries(body.outcomes)) {
      await db.visitStop.updateMany({ where: { id: stopId, visitId: id }, data: { result: String(result).slice(0, 200) } });
    }
  }

  const updated = await db.visit.update({ where: { id }, data });
  await audit({
    user, orgId: user.orgId, action: 'visit.update', entity: 'visit', entityId: id,
    before: { status: visit.status, gateConfirmed: visit.gateConfirmed },
    after: { status: updated.status, gateConfirmed: updated.gateConfirmed },
  });
  return ok({ id, status: updated.status, gateConfirmed: updated.gateConfirmed });
});
