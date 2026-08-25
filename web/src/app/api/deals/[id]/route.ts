/* PATCH /api/deals/:id — close / edit / unlock a deal.
   - closing (won|lost) locks the financials (SPEC_PACK FR-DEA-05)
   - editing a locked deal requires the 'deal_unlock' privilege + a reason,
     and is ALWAYS audit-logged (§12.2 #6) */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, hasPriv } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';
import { leaseFromDeal } from '@/lib/server/leases';
import type { Prisma } from '@prisma/client';

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const deal = await db.deal.findFirst({ where: { id, orgId: user.orgId } });
  if (!deal) throw new ApiError('NOT_FOUND', 'ไม่พบดีลนี้', 404);

  const body = (await req.json().catch(() => null)) as
    | { status?: string; amount?: number; note?: string; unlock?: boolean; reason?: string; leaseEndDate?: string; leaseTenant?: string; requirementId?: string | null }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  // explicit unlock action — deal_unlock priv + reason, heavily audited
  if (body.unlock) {
    if (!hasPriv(user, 'deal_unlock')) {
      throw new ApiError('FORBIDDEN', 'ต้องมีสิทธิ์ "ปลดล็อกดีลที่ปิดแล้ว" จึงจะแก้ไขได้', 403);
    }
    const reason = String(body.reason || '').trim();
    if (!reason) throw new ApiError('VALIDATION', 'กรุณาระบุเหตุผลในการปลดล็อกดีล', 400);
    const updated = await db.deal.update({ where: { id }, data: { locked: false, status: 'negotiating', closedAt: null } });
    await audit({
      user, orgId: user.orgId, action: 'deal.unlock', entity: 'deal', entityId: id,
      before: { status: deal.status, locked: true }, after: { status: updated.status, locked: false, reason },
    });
    return ok({ id, locked: false });
  }

  const data: Prisma.DealUpdateInput = {};

  /* ผูกใบงานให้ดีลเก่าที่ระบบเดาให้ไม่ได้ — รหัสดีลยืมรหัสของใบงานมาแสดง
     ทำก่อนด่านล็อก เพราะดีลที่ปิดไปแล้วคือกองที่ลูกค้าอยากไล่ตรวจที่สุด และการ
     ล็อก (FR-DEA-05) มีไว้แช่ตัวเงิน ไม่ใช่ห้ามเติมว่าดีลนี้มาจากงานไหน
     · เติมได้เฉพาะช่องที่ยังว่าง — ดีลที่ผูกไว้แล้วต้องปลดล็อกก่อนถึงย้ายได้
       ไม่งั้นสายงานที่ตรวจไปแล้วถูกเขียนทับเงียบ ๆ */
  if (body.requirementId !== undefined) {
    const wanted = body.requirementId === null || body.requirementId === '' ? null : String(body.requirementId);
    const isFillingBlank = !deal.requirementId && !!wanted;
    if (deal.locked && !isFillingBlank) {
      throw new ApiError('DEAL_LOCKED', 'ดีลนี้ปิดแล้ว — ย้ายใบงานต้องปลดล็อกก่อน (เฉพาะผู้มีสิทธิ์)', 403);
    }
    if (wanted) {
      const r = await db.requirement.findFirst({ where: { id: wanted, orgId: user.orgId }, select: { id: true } });
      if (!r) throw new ApiError('VALIDATION', 'ไม่พบใบงานที่อ้างถึง', 400);
      data.requirement = { connect: { id: r.id } };
    } else {
      data.requirement = { disconnect: true };
    }
    await audit({
      user, orgId: user.orgId, action: 'deal.link_requirement', entity: 'deal', entityId: id,
      before: { requirementId: deal.requirementId }, after: { requirementId: wanted },
    });
  }

  if (deal.locked) {
    /* ผูกใบงานอย่างเดียวบนดีลที่ปิดแล้ว — บันทึกแล้วจบตรงนี้ ไม่ต้องแตะตัวเงิน */
    if (data.requirement && Object.keys(data).length === 1) {
      const updated = await db.deal.update({ where: { id }, data });
      return ok({ id, requirementId: updated.requirementId });
    }
    throw new ApiError('DEAL_LOCKED', 'ดีลนี้ปิดแล้ว — ต้องปลดล็อกก่อนแก้ไข (เฉพาะผู้มีสิทธิ์)', 403);
  }

  if (typeof body.amount === 'number' && Number.isFinite(body.amount)) data.amount = Math.max(0, Math.round(body.amount));
  if (typeof body.note === 'string') data.note = body.note.slice(0, 2000);
  if (typeof body.status === 'string') {
    if (!['negotiating', 'won', 'lost'].includes(body.status)) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);
    data.status = body.status;
    if (body.status === 'won' || body.status === 'lost') {
      data.locked = true;
      data.closedAt = new Date();
    }
  }

  const updated = await db.deal.update({ where: { id }, data });
  // Flow D: closing the deal is what settles the lead as won or lost
  if (updated.status === 'won' || updated.status === 'lost') {
    await advanceLead(updated.leadId, updated.status, { user, orgId: user.orgId, reason: `deal ${id} ${updated.status}` });
  }

  /* A won rental is a lease from that day on, and the expiry bell only knows
     what the lease book says — so the deal writes it rather than leaving the
     team to key the same tenant and property in twice. `leaseEndDate` comes
     from the close dialog; without one there is nothing to count down to and
     no lease is written. */
  let lease: { id: string; endDate: string } | null = null;
  if (updated.status === 'won' && typeof body.leaseEndDate === 'string' && body.leaseEndDate.trim()) {
    lease = await leaseFromDeal(updated, String(body.leaseEndDate), String(body.leaseTenant ?? ''), user);
  }
  await audit({
    user, orgId: user.orgId, action: 'deal.update', entity: 'deal', entityId: id,
    before: { status: deal.status, amount: deal.amount }, after: { status: updated.status, amount: updated.amount },
  });
  return ok({ id, status: updated.status, locked: updated.locked, lease });
});
