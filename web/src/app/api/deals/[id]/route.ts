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
    | { status?: string; amount?: number; note?: string; unlock?: boolean; reason?: string; leaseEndDate?: string; leaseTenant?: string }
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

  if (deal.locked) {
    throw new ApiError('DEAL_LOCKED', 'ดีลนี้ปิดแล้ว — ต้องปลดล็อกก่อนแก้ไข (เฉพาะผู้มีสิทธิ์)', 403);
  }

  const data: Prisma.DealUpdateInput = {};
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
