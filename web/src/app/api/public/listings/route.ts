/* GET /api/public/listings — 🔵 PUBLIC listing feed for the website.
   Only `active` properties; display-ready strings so the ported markup can
   render them unchanged. Never emits coordinates, lessor contacts, or
   internalOnly fields (AGENT.md §7 + FRONTEND_API_SPEC §3).

   Query: ?deal=rent|sale ?type=factory|warehouse ?province=… ?limit=… */
import { ok, handler } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { stripInternal, displayArea, displayLocation, displayProvince } from '@/lib/server/propertyDto';

const PRIVATE_KEYS = ['location_map', 'lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'];

const baht = (n: number) =>
  n >= 1_000_000 ? `฿ ${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)} ล้าน` : `฿ ${n.toLocaleString('th-TH')}`;

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const deal = url.searchParams.get('deal') || '';
  const type = url.searchParams.get('type') || '';
  const province = url.searchParams.get('province') || '';
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get('limit') || 24)));

  const rows = await db.property.findMany({
    where: { status: 'active', ...(type ? { typeKey: type } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  const items = rows.flatMap((p) => {
    const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
    for (const k of PRIVATE_KEYS) delete values[k];

    const dealType = String(values.deal_type ?? '');
    const isSale = dealType.includes('ขาย');
    const isRent = dealType.includes('เช่า');
    if (deal === 'rent' && !isRent) return [];
    if (deal === 'sale' && !isSale) return [];
    if (province && !displayProvince(values).includes(province)) return [];

    const rent = Number(values.price_rent ?? NaN);
    const sale = Number(values.price_sale ?? values.price ?? NaN);
    const photos = Array.isArray(values.photos) ? (values.photos as string[]) : [];
    const area = displayArea(values);

    // "both" reads as rent on the card — the detail page shows both prices
    const price = isRent && Number.isFinite(rent)
      ? `${baht(rent)} / เดือน`
      : Number.isFinite(sale) ? baht(sale)
        : Number.isFinite(rent) ? `${baht(rent)} / เดือน` : 'ติดต่อสอบถาม';

    return [{
      code: p.publicCode,
      title: p.title,
      deal: isRent ? 'ให้เช่า' : 'ขาย',
      loc: displayLocation(values) || displayProvince(values) || '—',
      price,
      area,
      areaLabel: area !== null ? `${area.toLocaleString('th-TH')} ตร.ม.` : '',
      typeKey: p.typeKey,
      img: photos[0] ?? null,
      photos: String(photos.length),
    }];
  }).slice(0, limit);

  return ok({ items, total: items.length });
});
