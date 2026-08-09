/* PATCH /api/leads/:id — status change + assignment (§6.1).
   Lead pipeline is forward-only (SPEC_PACK §4): moving a lead backwards is
   rejected except by owner/manager (correction path). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { leadDto } from '@/lib/server/leadDto';
import type { Prisma } from '@prisma/client';

const PIPELINE = ['new', 'qualified', 'profile_received', 'requirements_confirmed', 'shortlisted', 'visit_scheduled', 'negotiating', 'won', 'lost'];

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  if (user.scope === 'own' && lead.assigneeId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะ lead ที่ได้รับมอบหมาย', 403);
  }

  const body = (await req.json().catch(() => null)) as { status?: string; assigneeId?: string | null } | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const data: Prisma.LeadUncheckedUpdateInput = {};
  if (typeof body.status === 'string') {
    if (!PIPELINE.includes(body.status)) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);
    const from = PIPELINE.indexOf(lead.status);
    const to = PIPELINE.indexOf(body.status);
    const isManager = user.role === 'owner' || user.role === 'manager';
    if (to < from && !isManager) {
      throw new ApiError('PIPELINE_FORWARD_ONLY', 'สถานะ lead เดินหน้าอย่างเดียว — ถอยกลับได้เฉพาะผู้จัดการขึ้นไป', 400);
    }
    data.status = body.status;
  }
  if (body.assigneeId !== undefined) {
    if (body.assigneeId) {
      const agent = await db.user.findFirst({ where: { id: body.assigneeId, orgId: user.orgId } });
      if (!agent) throw new ApiError('VALIDATION', 'ไม่พบผู้ใช้ที่มอบหมาย', 400);
    }
    data.assigneeId = body.assigneeId;
  }

  const before = { status: lead.status, assigneeId: lead.assigneeId };
  const updated = await db.lead.update({ where: { id }, data });
  await audit({
    user, orgId: user.orgId, action: 'lead.update', entity: 'lead', entityId: id,
    before, after: { status: updated.status, assigneeId: updated.assigneeId },
  });
  return ok(leadDto(updated, user));
});
