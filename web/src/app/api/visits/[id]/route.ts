/* PATCH /api/visits/:id — availability gate + completion + per-stop outcome.
   FR-AVL-04: the route sheet stays locked until the gate is confirmed. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';
import { visitDtos, VISIT_INCLUDE } from '@/lib/server/visitDto';

/* GET /api/visits/:id — แผนใบเดียว ขอด้วย id ตรง ๆ
 *
 * หน้ารายละเอียดเคยขอรายการทั้งหมดมาแล้วค้นหาตัวเองในนั้น แต่รายการถูกตัดไว้
 * ที่ 200 แถว แผนที่หลุดอันดับจึงเปิดไม่ได้เลย — หน้าจอขึ้นว่า "ยังไม่มีแผน
 * เข้าชม" ทั้งที่แถวยังอยู่ครบ และแถบเลือกด้านบนก็ยังลิสต์มันออกมาให้กด
 * ตอนนี้ production มี 16 แผนจึงยังไม่มีใครเจอ แต่มันรออยู่
 */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const row = await db.visit.findFirst({ where: { id, orgId: user.orgId }, include: VISIT_INCLUDE });
  if (!row) throw new ApiError('NOT_FOUND', 'ไม่พบแผนการเข้าชมนี้', 404);
  const [item] = await visitDtos(user.orgId, [row]);
  return ok(item);
});

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'co_agent', 'ops');
  const { id } = await ctx.params;

  const visit = await db.visit.findFirst({ where: { id, orgId: user.orgId }, include: { stops: true } });
  if (!visit) throw new ApiError('NOT_FOUND', 'ไม่พบแผนการเข้าชมนี้', 404);

  const body = (await req.json().catch(() => null)) as
    | { gateConfirmed?: boolean; status?: string; note?: string; outcomes?: Record<string, string>; cancelReason?: string; requirementId?: string | null }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const data: Prisma.VisitUpdateInput = {};
  /* ผูกใบงานให้แผนเก่าที่ระบบเดาให้ไม่ได้ · ลูกค้าคนเดียวเปิดหลายใบ การเดาจึงมี
     สิทธิ์ผิด และรหัสที่ผิดแย่กว่ารหัสที่ว่าง — จึงเปิดให้คนที่รู้มาชี้เอง */
  if (body.requirementId !== undefined) {
    if (body.requirementId === null || body.requirementId === '') {
      data.requirement = { disconnect: true };
    } else {
      const r = await db.requirement.findFirst({ where: { id: String(body.requirementId), orgId: user.orgId }, select: { id: true } });
      if (!r) throw new ApiError('VALIDATION', 'ไม่พบใบงานที่อ้างถึง', 400);
      data.requirement = { connect: { id: r.id } };
    }
  }
  if (typeof body.gateConfirmed === 'boolean') data.gateConfirmed = body.gateConfirmed;
  if (typeof body.note === 'string') data.note = body.note.slice(0, 2000);
  if (typeof body.status === 'string') {
    if (!['scheduled', 'done', 'cancelled'].includes(body.status)) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);
    /* This gate is FR-VIS-07: the customer confirming their criteria have not
       changed. It answered with the availability gate's code and wording, so
       whoever hit it went off to check whether the properties were still free
       instead of ringing the customer. */
    if (body.status === 'done' && !(body.gateConfirmed ?? visit.gateConfirmed)) {
      throw new ApiError('GATE_REQUIRED', 'ต้องยืนยันเกณฑ์กับลูกค้าก่อน (FR-VIS-07) — กด "เกณฑ์เดิม — จัดนัดต่อ" ที่หัวแผน หรือกลับไปแก้ requirement ถ้าลูกค้าเปลี่ยนเกณฑ์', 400);
    }
    /* สไลด์ 40 · "ยกเลิกต้องระบุข้อความด้วย" — นัดที่หายไปโดยไม่มีเหตุผล
       ทำให้ทีมที่มารับช่วงต่อไม่รู้ว่าลูกค้าเลื่อน ยกเลิก หรือทรัพย์ถูกปล่อยไปแล้ว */
    if (body.status === 'cancelled') {
      const reason = String(body.cancelReason || '').trim();
      if (!reason) {
        throw new ApiError('VALIDATION', 'ยกเลิกนัดต้องระบุเหตุผล', 400, { cancelReason: 'กรุณาระบุเหตุผลที่ยกเลิก' });
      }
      const stamp = new Date().toISOString().slice(0, 10);
      data.note = [visit.note, `[ยกเลิก ${stamp}] ${reason.slice(0, 500)}`].filter(Boolean).join('\n');
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
  return ok({ id, status: updated.status, gateConfirmed: updated.gateConfirmed, requirementId: updated.requirementId });
});
