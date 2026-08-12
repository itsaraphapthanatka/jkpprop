/* Visits (§9 /admin/visits) — schedule + list property visits.
   Soft warning at > 8 stops per session (SPEC_PACK FR-VIS-04) is the UI's
   job; the API caps at 20 as a hard sanity bound. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.visit.findMany({
    where: { orgId: user.orgId },
    orderBy: { date: 'desc' },
    include: { stops: { orderBy: { sort: 'asc' } } },
    take: 200,
  });
  const propIds = [...new Set(rows.flatMap((v) => v.stops.map((s) => s.propertyId)))];
  const props = propIds.length
    ? await db.property.findMany({ where: { id: { in: propIds } }, select: { id: true, publicCode: true, title: true } })
    : [];
  const byId = new Map(props.map((p) => [p.id, p]));
  return ok({
    items: rows.map((v) => ({
      id: v.id,
      leadId: v.leadId,
      date: v.date.getTime(),
      status: v.status,
      note: v.note,
      stops: v.stops.map((s) => ({ code: byId.get(s.propertyId)?.publicCode ?? '', title: byId.get(s.propertyId)?.title ?? '', result: s.result })),
    })),
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'co_agent', 'ops');

  const body = (await req.json().catch(() => null)) as { leadId?: string; date?: string; codes?: string[]; note?: string } | null;
  const date = body?.date ? new Date(body.date) : null;
  if (!date || isNaN(date.getTime())) throw new ApiError('VALIDATION', 'กรุณาระบุวันนัดชม', 400);
  const codes = Array.isArray(body?.codes) ? body.codes.map(String).slice(0, 20) : [];
  if (!codes.length) throw new ApiError('VALIDATION', 'เลือกทรัพย์ที่จะเข้าชมอย่างน้อย 1 รายการ', 400);

  const props = await db.property.findMany({ where: { orgId: user.orgId, publicCode: { in: codes } } });
  if (!props.length) throw new ApiError('VALIDATION', 'ไม่พบทรัพย์ตามรหัสที่ส่งมา', 400);

  const visit = await db.visit.create({
    data: {
      orgId: user.orgId,
      leadId: typeof body?.leadId === 'string' ? body.leadId : null,
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
