/* POST /api/requirements/:id/shortlist — build a real shortlist from the
   properties that cleared the availability gate.

   The "สร้าง Shortlist" card was a plain link to /admin/shortlists; nothing was
   created. This is the gate the spec puts at the centre of Flow B, so it is
   enforced on the server: only properties whose latest check says available
   AND that are still active in our own inventory may go in (FR-AVL-04). */
import { randomBytes } from 'crypto';
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');
  const { id } = await ctx.params;

  const requirement = await db.requirement.findFirst({
    where: { id, orgId: user.orgId },
    include: { lead: { select: { id: true, name: true, company: true } } },
  });
  if (!requirement) throw new ApiError('NOT_FOUND', 'ไม่พบ requirement นี้', 404);
  if (requirement.status === 'cancelled') {
    throw new ApiError('VALIDATION', 'requirement นี้ยกเลิกไปแล้ว สร้าง shortlist ไม่ได้', 400);
  }
  if (requirement.status === 'submitted') {
    throw new ApiError('VALIDATION', 'ต้องกด "ยืนยัน requirement" ก่อนจึงจะสร้าง shortlist ได้', 400);
  }

  const checks = await db.availabilityCheck.findMany({ where: { requirementId: id } });
  const availableIds = checks.filter((c) => c.result === 'available').map((c) => c.propertyId);
  if (!availableIds.length) {
    throw new ApiError(
      'AVAILABILITY_REQUIRED',
      'ยังไม่มีทรัพย์ที่เช็คแล้วว่าว่าง — เช็คความว่างกับเจ้าของทรัพย์ก่อน (FR-AVL-04)',
      400,
    );
  }

  /* Checked-available is not enough on its own: the property may have been
     archived or hidden since the call. Both conditions, at the moment of
     creation, not at the moment of checking. */
  const props = await db.property.findMany({
    where: { orgId: user.orgId, id: { in: availableIds }, status: 'active' },
  });
  if (!props.length) {
    throw new ApiError(
      'AVAILABILITY_REQUIRED',
      'ทรัพย์ที่เช็คว่าว่างไม่ได้เผยแพร่อยู่แล้ว — เช็คใหม่หรือคัดทรัพย์ตัวอื่น',
      400,
    );
  }

  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const label = requirement.lead?.company || requirement.lead?.name || requirement.code;

  const token = randomBytes(12).toString('base64url');
  const shortlist = await db.shortlist.create({
    data: {
      orgId: user.orgId,
      leadId: requirement.leadId,
      requirementId: requirement.id,
      name: String(body?.name || '').trim().slice(0, 200) || `${requirement.code} · ${label}`,
      token,
      items: { create: props.map((p, i) => ({ propertyId: p.id, sort: i })) },
    },
  });

  await db.requirement.update({ where: { id }, data: { status: 'shortlisted' } });
  await advanceLead(requirement.leadId, 'shortlisted', {
    user, orgId: user.orgId, reason: `shortlist from ${requirement.code}`,
  });

  await audit({
    user, orgId: user.orgId, action: 'requirement.shortlist', entity: 'shortlist', entityId: shortlist.id,
    after: { requirement: requirement.code, codes: props.map((p) => p.publicCode) },
  });

  return ok({
    id: shortlist.id,
    token,
    url: `/client-shortlist?token=${token}`,
    count: props.length,
    /* say what was left behind rather than quietly shipping fewer than the
       team expected */
    skipped: availableIds.length - props.length,
  }, { status: 201 });
});
