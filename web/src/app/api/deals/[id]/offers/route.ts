/* POST /api/deals/:id/offers — append to the negotiation timeline (§9).
   Blocked once the deal is closed; reopening needs deal_unlock. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

const SIDES = ['ฝั่งลูกค้า', 'ฝั่งเจ้าของ', 'ตกลง'];

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const deal = await db.deal.findFirst({ where: { id, orgId: user.orgId } });
  if (!deal) throw new ApiError('NOT_FOUND', 'ไม่พบดีลนี้', 404);
  const offers = await db.dealOffer.findMany({ where: { dealId: id }, orderBy: { createdAt: 'asc' } });
  return ok({ items: offers.map((o) => ({ id: o.id, side: o.side, amount: o.amount, terms: o.terms, createdAt: o.createdAt.getTime() })) });
});

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent');
  const { id } = await ctx.params;

  const deal = await db.deal.findFirst({ where: { id, orgId: user.orgId } });
  if (!deal) throw new ApiError('NOT_FOUND', 'ไม่พบดีลนี้', 404);
  if (deal.locked) throw new ApiError('DEAL_LOCKED', 'ดีลนี้ปิดแล้ว — ต้องปลดล็อกก่อนบันทึกข้อเสนอ', 403);

  const body = (await req.json().catch(() => null)) as { side?: string; amount?: string; terms?: string } | null;
  const amount = String(body?.amount || '').trim();
  if (!amount) throw new ApiError('VALIDATION', 'กรุณากรอกจำนวนเงินที่เสนอ', 400, { amount: 'กรุณากรอกจำนวนเงิน' });
  const side = SIDES.includes(String(body?.side)) ? String(body!.side) : SIDES[0];

  const offer = await db.dealOffer.create({
    data: { dealId: id, side, amount: amount.slice(0, 80), terms: String(body?.terms || '').slice(0, 500) },
  });
  await audit({ user, orgId: user.orgId, action: 'deal.offer', entity: 'deal', entityId: id, after: { side, amount } });
  return ok({ id: offer.id, side, amount: offer.amount, terms: offer.terms, createdAt: offer.createdAt.getTime() }, { status: 201 });
});
