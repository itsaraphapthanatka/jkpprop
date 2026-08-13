/* GET /api/public/shortlists/:token — 🔵 PUBLIC client view (§9).
   No login; returns display data only:
   - internalOnly fields stripped (user=null path in stripInternal)
   - exact coordinates NEVER emitted (AGENT.md §7 map-visibility rule)
   - lessor contact details stripped */
import { ok, handler, ApiError, rateLimit, clientIp } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { stripInternal, displayArea, displayLocation } from '@/lib/server/propertyDto';
import { propertyType } from '@/lib/propertySchema';

const PRIVATE_KEYS = ['location_map', 'lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'];

export const GET = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(`shortlist:${clientIp(req)}`, 30, 60_000);
  const { token } = await ctx.params;

  const s = await db.shortlist.findUnique({
    where: { token },
    include: { items: { orderBy: { sort: 'asc' } } },
  });
  if (!s || s.status === 'closed') throw new ApiError('NOT_FOUND', 'ไม่พบรายการนี้ หรือลิงก์หมดอายุแล้ว', 404);

  const props = await db.property.findMany({ where: { id: { in: s.items.map((i) => i.propertyId) } } });
  const byId = new Map(props.map((p) => [p.id, p]));

  const items = s.items.flatMap((it) => {
    const p = byId.get(it.propertyId);
    if (!p || !['active', 'draft'].includes(p.status)) return []; // unpublished mid-share → drop (SPEC_PACK §6 edge case)
    const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
    for (const k of PRIVATE_KEYS) delete values[k];
    const photos = Array.isArray(values.photos) ? (values.photos as string[]) : [];
    return [{
      code: p.publicCode,
      title: p.title,
      typeLabel: propertyType(p.typeKey).label,
      location: displayLocation(values),
      area: displayArea(values),
      priceRent: typeof values.price_rent === 'number' ? values.price_rent : null,
      priceSale: typeof values.price_sale === 'number' ? values.price_sale : (typeof values.price === 'number' ? values.price : null),
      dealType: String(values.deal_type ?? ''),
      photo: photos[0] ?? null,
      note: it.note ?? null,
      itemId: it.id,
      feedback: it.feedback ?? null,
      feedbackNote: it.feedbackNote ?? null,
    }];
  });

  return ok({ name: s.name, createdAt: s.createdAt.getTime(), items });
});

/* POST /api/public/shortlists/:token — 🔵 PUBLIC: the customer's opinion on one
   property. The client page asked for it and had nowhere to send it, so the
   answer had to be collected again by phone.

   Only the item's own feedback can be written, and only through a token that
   already grants sight of that shortlist — nothing else on the record is
   reachable from here. */
const FEEDBACK = new Set(['interested', 'maybe', 'not_interested']);

export const POST = handler(async (req: Request, ctx: { params: Promise<{ token: string }> }) => {
  rateLimit(`shortlist-feedback:${clientIp(req)}`, 30, 60_000);
  const { token } = await ctx.params;

  const s = await db.shortlist.findUnique({ where: { token }, include: { items: true } });
  if (!s || s.status === 'closed') throw new ApiError('NOT_FOUND', 'ไม่พบรายการนี้ หรือลิงก์หมดอายุแล้ว', 404);

  const body = (await req.json().catch(() => null)) as { itemId?: string; feedback?: string; note?: string } | null;
  const itemId = String(body?.itemId || '');
  const feedback = String(body?.feedback || '');
  if (!s.items.some((i) => i.id === itemId)) throw new ApiError('NOT_FOUND', 'ไม่พบทรัพย์รายการนี้', 404);
  if (!FEEDBACK.has(feedback)) throw new ApiError('VALIDATION', 'กรุณาเลือกความเห็น', 400);

  await db.shortlistItem.update({
    where: { id: itemId },
    data: {
      feedback,
      feedbackNote: String(body?.note || '').trim().slice(0, 500) || null,
      feedbackAt: new Date(),
    },
  });

  return ok({ ok: true });
});
