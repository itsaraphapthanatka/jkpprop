/* GET /api/public/properties/:code — 🔵 PUBLIC detail payload.

   Map-visibility rule (AGENT.md §7 / SPEC_PACK FR-LST-02): exact lat/lng is
   NEVER emitted publicly. The response carries only the district/province
   label; an approximate map is the page's job, not the API's. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { stripInternal, displayArea, displayLocation } from '@/lib/server/propertyDto';
import { propertyType } from '@/lib/propertySchema';

const PRIVATE_KEYS = ['location_map', 'lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'];

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code } = await ctx.params;
  const p = await db.property.findFirst({ where: { publicCode: code, status: 'active' } });
  if (!p) throw new ApiError('NOT_FOUND', 'ไม่พบทรัพย์นี้', 404);

  const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
  for (const k of PRIVATE_KEYS) delete values[k];

  const photos = Array.isArray(values.photos) ? (values.photos as string[]) : [];
  return ok({
    code: p.publicCode,
    title: p.title,
    typeKey: p.typeKey,
    typeLabel: propertyType(p.typeKey).label,
    location: displayLocation(values),
    area: displayArea(values),
    dealType: String(values.deal_type ?? ''),
    priceRent: typeof values.price_rent === 'number' ? values.price_rent : null,
    priceSale: typeof values.price_sale === 'number' ? values.price_sale : (typeof values.price === 'number' ? values.price : null),
    photos,
    values, // remaining spec fields for the detail table
    updatedAt: p.updatedAt.getTime(),
  });
});
