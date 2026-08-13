/* Deals (§9 /admin/deals) — GET list + POST create. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.deal.findMany({ where: { orgId: user.orgId }, orderBy: { updatedAt: 'desc' }, take: 200 });

  /* which property and which customer — the screen showed a fixed
     "โกดังพร้อมสำนักงาน 2,700 ตร.ม. · JKP-SPK0042 · บ. ไทยโลจิสติกส์" card
     above whatever deal was open */
  const propIds = [...new Set(rows.map((d) => d.propertyId).filter(Boolean) as string[])];
  const leadIds = [...new Set(rows.map((d) => d.leadId).filter(Boolean) as string[])];
  const [props, leads] = await Promise.all([
    propIds.length ? db.property.findMany({ where: { id: { in: propIds } }, select: { id: true, publicCode: true, title: true } }) : [],
    leadIds.length ? db.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true, company: true } }) : [],
  ]);
  const propById = new Map(props.map((p) => [p.id, p]));
  const leadById = new Map(leads.map((l) => [l.id, l]));

  return ok({
    items: rows.map((d) => ({
      id: d.id, title: d.title, leadId: d.leadId, propertyId: d.propertyId,
      propertyCode: d.propertyId ? propById.get(d.propertyId)?.publicCode ?? '' : '',
      propertyTitle: d.propertyId ? propById.get(d.propertyId)?.title ?? '' : '',
      customer: d.leadId ? (leadById.get(d.leadId)?.company || leadById.get(d.leadId)?.name || '') : '',
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
