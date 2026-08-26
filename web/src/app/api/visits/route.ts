/* Visits (§9 /admin/visits) — schedule + list property visits.
   Soft warning at > 8 stops per session (SPEC_PACK FR-VIS-04) is the UI's
   job; the API caps at 20 as a hard sanity bound. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';
import { visitDtos, VISIT_INCLUDE } from '@/lib/server/visitDto';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.visit.findMany({
    where: { orgId: user.orgId },
    orderBy: { date: 'desc' },
    include: VISIT_INCLUDE,
    take: 200,
  });
  return ok({ items: await visitDtos(user.orgId, rows) });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'co_agent', 'ops');

  const body = (await req.json().catch(() => null)) as { leadId?: string; requirementId?: string; date?: string; codes?: string[]; note?: string } | null;
  const date = body?.date ? new Date(body.date) : null;
  if (!date || isNaN(date.getTime())) throw new ApiError('VALIDATION', 'กรุณาระบุวันนัดชม', 400);
  const codes = Array.isArray(body?.codes) ? body.codes.map(String).slice(0, 20) : [];
  if (!codes.length) throw new ApiError('VALIDATION', 'เลือกทรัพย์ที่จะเข้าชมอย่างน้อย 1 รายการ', 400);

  const props = await db.property.findMany({ where: { orgId: user.orgId, publicCode: { in: codes } } });
  if (!props.length) throw new ApiError('VALIDATION', 'ไม่พบทรัพย์ตามรหัสที่ส่งมา', 400);

  /* ใบงานต้นทาง — ประทับตอนนี้ครั้งเดียว ไม่ใช่เดาใหม่ทุกครั้งที่เปิดหน้า
     ถ้าเรียกมาจาก shortlist จะส่ง requirementId มาให้ · ถ้าไม่ส่ง ยังยอมเดาได้
     กรณีเดียวคือลูกค้ารายนั้นมีใบงานใบเดียว ซึ่งไม่มีอะไรให้เลือกผิด */
  const leadId = typeof body?.leadId === 'string' ? body.leadId : null;
  let requirementId: string | null = null;
  if (typeof body?.requirementId === 'string' && body.requirementId) {
    const r = await db.requirement.findFirst({ where: { id: body.requirementId, orgId: user.orgId }, select: { id: true } });
    if (!r) throw new ApiError('VALIDATION', 'ไม่พบใบงานที่อ้างถึง', 400);
    requirementId = r.id;
  } else if (leadId) {
    const rs = await db.requirement.findMany({ where: { orgId: user.orgId, leadId }, select: { id: true }, take: 2 });
    if (rs.length === 1) requirementId = rs[0].id;
  }

  const visit = await db.visit.create({
    data: {
      orgId: user.orgId,
      leadId,
      requirementId,
      date,
      note: String(body?.note || '').slice(0, 1000) || null,
      stops: { create: props.map((p, i) => ({ propertyId: p.id, sort: i })) },
    },
  });
  // Flow C: booking the viewing is what makes the lead `visit_scheduled`
  await advanceLead(visit.leadId, 'visit_scheduled', { user, orgId: user.orgId, reason: `visit ${visit.id}` });
  await audit({ user, orgId: user.orgId, action: 'visit.create', entity: 'visit', entityId: visit.id, after: { codes, date: date.toISOString() } });
  return ok({ id: visit.id }, { status: 201 });
});
