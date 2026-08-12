/* Shortlist detail (§9 /admin/shortlists).
   GET   — items with live availability from each property's status
   PATCH — send to the client (status), reorder, edit per-item notes,
           add/remove properties
   FR-AVL-04: a property can only be sent while its listing is still
   available — the server drops nothing silently, it reports `available`
   per item so the UI can gate the send. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';
import { displayArea } from '@/lib/server/propertyDto';

async function loadScoped(id: string, orgId: string) {
  const s = await db.shortlist.findFirst({
    where: { id, orgId },
    include: { items: { orderBy: { sort: 'asc' } } },
  });
  if (!s) throw new ApiError('NOT_FOUND', 'ไม่พบ shortlist นี้', 404);
  return s;
}

const money = (n: number) => `฿${n.toLocaleString('th-TH')}`;

async function itemsDto(items: { id: string; propertyId: string; note: string | null; sort: number }[]) {
  const props = await db.property.findMany({ where: { id: { in: items.map((i) => i.propertyId) } } });
  const byId = new Map(props.map((p) => [p.id, p]));
  return items.flatMap((it) => {
    const p = byId.get(it.propertyId);
    if (!p) return [];
    const values = (p.values ?? {}) as Record<string, unknown>;
    const area = displayArea(values);
    const rent = Number(values.price_rent ?? NaN);
    const sale = Number(values.price_sale ?? values.price ?? NaN);
    return [{
      id: it.id,
      code: p.publicCode,
      title: p.title,
      size: area !== null ? `${area.toLocaleString('th-TH')} ตร.ม.` : '—',
      price: Number.isFinite(rent) ? `${money(rent)}/ด.` : Number.isFinite(sale) ? money(sale) : '—',
      note: it.note ?? '',
      owner: String(values.lessor_name ?? '—'),
      phone: String(values.lessor_phone ?? '—'),
      // live availability — 'active' means still on the market
      available: p.status === 'active',
      sort: it.sort,
    }];
  });
}

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const s = await loadScoped(id, user.orgId);
  return ok({
    id: s.id, name: s.name, token: s.token, status: s.status,
    url: `/client-shortlist?token=${s.token}`,
    leadId: s.leadId,
    items: await itemsDto(s.items),
  });
});

export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'co_agent', 'ops');
  const { id } = await ctx.params;
  const s = await loadScoped(id, user.orgId);

  const body = (await req.json().catch(() => null)) as
    | { status?: string; order?: string[]; notes?: Record<string, string>; addCodes?: string[]; removeIds?: string[] }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  if (Array.isArray(body.removeIds) && body.removeIds.length) {
    await db.shortlistItem.deleteMany({ where: { shortlistId: id, id: { in: body.removeIds } } });
  }

  if (Array.isArray(body.addCodes) && body.addCodes.length) {
    const props = await db.property.findMany({ where: { orgId: user.orgId, publicCode: { in: body.addCodes } } });
    const existing = new Set(s.items.map((i) => i.propertyId));
    let sort = s.items.length;
    for (const p of props) {
      if (existing.has(p.id)) continue;
      await db.shortlistItem.create({ data: { shortlistId: id, propertyId: p.id, sort: sort++ } });
    }
  }

  if (body.notes && typeof body.notes === 'object') {
    for (const [itemId, note] of Object.entries(body.notes)) {
      await db.shortlistItem.updateMany({ where: { id: itemId, shortlistId: id }, data: { note: String(note).slice(0, 500) } });
    }
  }

  if (Array.isArray(body.order)) {
    for (let i = 0; i < body.order.length; i++) {
      await db.shortlistItem.updateMany({ where: { id: body.order[i], shortlistId: id }, data: { sort: i } });
    }
  }

  if (typeof body.status === 'string') {
    if (!['open', 'sent', 'closed'].includes(body.status)) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);
    // FR-AVL-04: don't send a shortlist that contains an unavailable listing
    if (body.status === 'sent') {
      const items = await itemsDto(await db.shortlistItem.findMany({ where: { shortlistId: id }, orderBy: { sort: 'asc' } }));
      const blocked = items.filter((i) => !i.available);
      if (blocked.length) {
        throw new ApiError('AVAILABILITY_REQUIRED', `ส่งไม่ได้ — มี ${blocked.length} ทรัพย์ที่ไม่ว่างแล้ว (${blocked.map((b) => b.code).join(', ')})`, 400);
      }
      if (!items.length) throw new ApiError('VALIDATION', 'ส่งไม่ได้ — ยังไม่มีทรัพย์ใน shortlist', 400);
    }
    await db.shortlist.update({ where: { id }, data: { status: body.status } });
    // Flow B: sending it to the customer is what makes the lead `shortlisted`
    if (body.status === 'sent') {
      await advanceLead(s.leadId, 'shortlisted', { user, orgId: user.orgId, reason: `shortlist ${id} sent` });
    }
    await audit({
      user, orgId: user.orgId, action: `shortlist.${body.status}`, entity: 'shortlist', entityId: id,
      before: { status: s.status }, after: { status: body.status },
    });
  }

  const fresh = await loadScoped(id, user.orgId);
  return ok({
    id: fresh.id, name: fresh.name, token: fresh.token, status: fresh.status,
    url: `/client-shortlist?token=${fresh.token}`,
    items: await itemsDto(fresh.items),
  });
});
