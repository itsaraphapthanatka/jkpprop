/* One requirement (Flow B, SPEC_PACK §3.6).
   GET    — detail, with the availability checks recorded so far
   PATCH  — edit the criteria, or move the status: confirm / cancel / reopen
   DELETE — remove one entered by mistake
*/
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';
import { requirementInput, requirementDto, CANCEL_FIELDS } from '@/lib/server/requirements';
import { displayArea, displayLocation, stripInternal } from '@/lib/server/propertyDto';

const INCLUDE = {
  /* สไลด์ 37 · "ชื่อลูกค้าหรือบริษัทอยู่ตรงไหน · รู้ได้อย่างไรว่าทำแผนลูกค้า
     เจ้าไหน" — หน้า REQ มีแต่รหัส REQ-xxxx เบอร์กับผู้รับผิดชอบไม่เคยส่งมา */
  lead: { select: { id: true, name: true, company: true, status: true, phone: true, email: true, respondentType: true, assigneeId: true } },
  _count: { select: { checks: true, shortlists: true } },
} as const;

/* The availability panel used to be three hardcoded rows that always said the
   same thing. Each row is now a real property plus the last answer the team
   got from its landlord, and `available` is computed from the property's own
   status — a listing taken off the market can never read "ว่าง" again. */
async function checksFor(orgId: string, requirementId: string) {
  const checks = await db.availabilityCheck.findMany({
    where: { requirementId },
    orderBy: { checkedAt: 'desc' },
  });
  if (!checks.length) return [];

  const props = await db.property.findMany({
    where: { orgId, id: { in: checks.map((c) => c.propertyId) } },
  });
  const byId = new Map(props.map((p) => [p.id, p]));

  return checks.flatMap((c) => {
    const p = byId.get(c.propertyId);
    if (!p) return [];
    const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
    const area = displayArea(values);
    return [{
      id: c.id,
      propertyId: p.id,
      code: p.publicCode,
      title: p.title,
      area,
      location: displayLocation(values),
      /* two different facts, both shown: what the landlord said, and whether
         the property is still live in our own inventory */
      result: c.result,
      stillActive: p.status === 'active',
      available: c.result === 'available' && p.status === 'active',
      note: c.note,
      /* รูปกับเบอร์เจ้าของ — สไลด์ 37 "นำเบอร์เจ้าของมาจากไหน" และ "ต้องมี
         รูปภาพเพื่อยืนยัน" เดิมแถวนี้มีแต่รหัสกับชื่อ ถ้าจะโทรถามซ้ำต้องไป
         เปิดอีกหน้าหาเบอร์เอาเอง (หน้านี้ต้องล็อกอินอยู่แล้ว) */
      img: (() => {
        const raw = ((p.values ?? {}) as Record<string, unknown>).photos;
        return Array.isArray(raw) && typeof raw[0] === 'string' ? (raw[0] as string) : null;
      })(),
      contactName: String(((p.values ?? {}) as Record<string, unknown>).lessor_name ?? ''),
      contactPhone: String(((p.values ?? {}) as Record<string, unknown>).lessor_phone ?? ''),
      checkedAt: c.checkedAt.getTime(),
    }];
  });
}

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const row = await db.requirement.findFirst({ where: { id, orgId: user.orgId }, include: INCLUDE });
  if (!row) throw new ApiError('NOT_FOUND', 'ไม่พบ requirement นี้', 404);

  const shortlists = await db.shortlist.findMany({
    where: { requirementId: id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return ok({
    ...requirementDto(row),
    checks: await checksFor(user.orgId, id),
    shortlists: shortlists.map((s) => ({
      id: s.id, name: s.name, status: s.status, count: s.items.length,
      url: `/client-shortlist?token=${s.token}`, createdAt: s.createdAt.getTime(),
    })),
    cancelFields: CANCEL_FIELDS,
  });
});

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');
  const { id } = await ctx.params;

  const row = await db.requirement.findFirst({ where: { id, orgId: user.orgId } });
  if (!row) throw new ApiError('NOT_FOUND', 'ไม่พบ requirement นี้', 404);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const action = String(body.action || '');
  let after: Record<string, unknown> = {};

  if (action === 'confirm') {
    if (row.status === 'cancelled') throw new ApiError('VALIDATION', 'requirement นี้ยกเลิกไปแล้ว — กด "เปิดใหม่" ก่อน', 400);
    await db.requirement.update({ where: { id }, data: { status: 'confirmed', confirmedAt: new Date() } });
    // Flow B: confirming is the event that moves the lead on
    await advanceLead(row.leadId, 'requirements_confirmed', { user, orgId: user.orgId, reason: `confirm ${row.code}` });
    after = { status: 'confirmed' };
  } else if (action === 'cancel') {
    /* FR-CRM-07 — a cancellation that does not say which requirement item
       failed teaches the team nothing, so both fields are required. */
    const field = String(body.cancelField || '').trim();
    const reason = String(body.cancelReason || '').trim();
    if (!CANCEL_FIELDS.some((f) => f.key === field)) {
      throw new ApiError('VALIDATION', 'กรุณาเลือกข้อที่เป็นปัญหา', 400, { cancelField: 'กรุณาเลือกข้อที่เป็นปัญหา' });
    }
    if (!reason) {
      throw new ApiError('VALIDATION', 'กรุณาระบุเหตุผลที่ยกเลิก', 400, { cancelReason: 'กรุณาระบุเหตุผลที่ยกเลิก' });
    }
    await db.requirement.update({
      where: { id },
      data: { status: 'cancelled', cancelField: field, cancelReason: reason.slice(0, 500), cancelledAt: new Date() },
    });
    after = { status: 'cancelled', cancelField: field };
  } else if (action === 'reopen') {
    if (row.status !== 'cancelled') throw new ApiError('VALIDATION', 'requirement นี้ไม่ได้ถูกยกเลิก', 400);
    await db.requirement.update({
      where: { id },
      data: { status: row.confirmedAt ? 'confirmed' : 'submitted', cancelField: '', cancelReason: '', cancelledAt: null },
    });
    after = { status: 'reopened' };
  } else {
    // plain edit of the criteria
    await db.requirement.update({ where: { id }, data: requirementInput(body) });
    after = { edited: true };
  }

  await audit({
    user, orgId: user.orgId, action: `requirement.${action || 'update'}`,
    entity: 'requirement', entityId: id,
    before: { status: row.status }, after: { code: row.code, ...after },
  });

  const updated = await db.requirement.findFirst({ where: { id }, include: INCLUDE });
  return ok({ ...requirementDto(updated!), checks: await checksFor(user.orgId, id) });
});

export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager');
  const { id } = await ctx.params;

  const row = await db.requirement.findFirst({ where: { id, orgId: user.orgId } });
  if (!row) throw new ApiError('NOT_FOUND', 'ไม่พบ requirement นี้', 404);

  const sent = await db.shortlist.count({ where: { requirementId: id } });
  if (sent) {
    throw new ApiError(
      'VALIDATION',
      `ลบไม่ได้ — สร้าง shortlist จาก requirement นี้ไปแล้ว ${sent} ชุด ใช้ "ยกเลิก" แทน`,
      400,
    );
  }

  await db.requirement.delete({ where: { id } });
  await audit({
    user, orgId: user.orgId, action: 'requirement.delete', entity: 'requirement', entityId: id,
    before: { code: row.code, status: row.status },
  });
  return ok({ id });
});
