/* Visits (§9 /admin/visits) — schedule + list property visits.
   Soft warning at > 8 stops per session (SPEC_PACK FR-VIS-04) is the UI's
   job; the API caps at 20 as a hard sanity bound. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';
import { displayLocation } from '@/lib/server/propertyDto';

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
    ? await db.property.findMany({ where: { id: { in: propIds } }, select: { id: true, publicCode: true, title: true, values: true } })
    : [];
  const byId = new Map(props.map((p) => [p.id, p]));

  /* "แก้ criteria" sent everyone to the queue to hunt for the right card. The
     visit knows its lead, and the lead's requirement is the card they want. */
  const leadIds = [...new Set(rows.map((v) => v.leadId).filter(Boolean) as string[])];
  /* สไลด์ 41 · "ชื่อลูกค้าหรือบริษัทอยู่ตรงไหน · รู้ได้อย่างไรว่าทำแผนลูกค้า
     เจ้าไหน" — แผนเข้าชมรู้ว่าเป็นของ lead ไหน แต่ไม่เคยส่งชื่อออกมา */
  const leadRows = leadIds.length
    ? await db.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true, company: true, phone: true } })
    : [];
  const leadById = new Map(leadRows.map((l) => [l.id, l]));
  const reqs = leadIds.length
    ? await db.requirement.findMany({
      where: { orgId: user.orgId, leadId: { in: leadIds } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, leadId: true },
    })
    : [];
  const reqByLead = new Map<string, string>();
  for (const r of reqs) if (!reqByLead.has(r.leadId)) reqByLead.set(r.leadId, r.id);

  return ok({
    items: rows.map((v) => ({
      id: v.id,
      leadId: v.leadId,
      customer: v.leadId ? (leadById.get(v.leadId)?.company || leadById.get(v.leadId)?.name || '') : '',
      customerContact: v.leadId ? (leadById.get(v.leadId)?.name ?? '') : '',
      customerPhone: v.leadId ? (leadById.get(v.leadId)?.phone ?? '') : '',
      requirementId: v.leadId ? reqByLead.get(v.leadId) ?? null : null,
      date: v.date.getTime(),
      status: v.status,
      /* ด่านยืนยันเกณฑ์ถูกเก็บลงฐานข้อมูลตั้งแต่แรก แต่ไม่เคยส่งกลับมา หน้าจอ
         จึงขึ้นว่า "ยังไม่ยืนยัน" ใหม่ทุกครั้งที่โหลด — ทีมต้องกดยืนยันซ้ำ
         ทุกรอบ และปุ่มที่ล็อกตามด่านนี้ (เด็ค Web 2026 ข้อ 21) ก็จะไม่มีวันปลด */
      gateConfirmed: v.gateConfirmed,
      note: v.note,
      /* the stop's own id: without it the screen could show outcomes but had
         no way to save one, so it invented the whole list instead */
      /* สไลด์ 41 · "ปุ่มหาย — ไปที่ประกาศ · โทรศัพท์ · โลเคชั่น" และ "ต้องมี
         รูปภาพเพื่อยืนยัน" — แต่ละจุดแวะมีแค่รหัสกับชื่อทำเล คนที่ออกไปพา
         ลูกค้าดูจึงเปิดประกาศไม่ได้ โทรหาเจ้าของไม่ได้ และนำทางไม่ได้
         (หน้านี้ต้องล็อกอิน เบอร์เจ้าของจึงส่งมาได้) */
      stops: v.stops.map((s) => {
        const prop = byId.get(s.propertyId);
        const vals = (prop?.values ?? {}) as Record<string, unknown>;
        const photos = Array.isArray(vals.photos) ? (vals.photos as string[]) : [];
        const pin = vals.location_map as { lat?: unknown; lng?: unknown } | undefined;
        return {
          id: s.id,
          code: prop?.publicCode ?? '',
          title: prop?.title ?? '',
          location: displayLocation(vals),
          result: s.result,
          img: photos[0] ?? null,
          contactName: String(vals.lessor_name ?? ''),
          contactPhone: String(vals.lessor_phone ?? ''),
          mapUrl: typeof pin?.lat === 'number' && typeof pin?.lng === 'number'
            ? `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`
            : displayLocation(vals)
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation(vals))}`
              : '',
        };
      }),
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
