/* Deals (§9 /admin/deals) — GET list + POST create. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.deal.findMany({ where: { orgId: user.orgId }, orderBy: { updatedAt: 'desc' }, take: 200 });
  return ok({
    items: rows.map((d) => ({
      id: d.id, title: d.title, leadId: d.leadId, propertyId: d.propertyId,
      amount: d.amount, status: d.status, locked: d.locked,
      closedAt: d.closedAt?.getTime() ?? null, note: d.note, updatedAt: d.updatedAt.getTime(),
    })),
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent');

  const body = (await req.json().catch(() => null)) as { title?: string; leadId?: string; propertyCode?: string; amount?: number } | null;
  const title = String(body?.title || '').trim();
  if (!title) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อดีล', 400);

  let propertyId: string | null = null;
  if (body?.propertyCode) {
    const p = await db.property.findFirst({ where: { orgId: user.orgId, publicCode: String(body.propertyCode) } });
    propertyId = p?.id ?? null;
  }

  const deal = await db.deal.create({
    data: {
      orgId: user.orgId,
      title: title.slice(0, 300),
      leadId: typeof body?.leadId === 'string' ? body.leadId : null,
      propertyId,
      amount: Number.isFinite(body?.amount) ? Math.max(0, Math.round(body!.amount!)) : 0,
    },
  });
  // Flow D: opening a deal is what makes the lead `negotiating`
  await advanceLead(deal.leadId, 'negotiating', { user, orgId: user.orgId, reason: `deal ${deal.id}` });
  await audit({ user, orgId: user.orgId, action: 'deal.create', entity: 'deal', entityId: deal.id, after: { title: deal.title, amount: deal.amount } });
  return ok({ id: deal.id }, { status: 201 });
});
