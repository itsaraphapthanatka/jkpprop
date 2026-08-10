/* The published inventory feed, in one place.
 *
 * Both /api/public/listings and the server components that render the
 * homepage and the listing pages read through here. They used to disagree:
 * the pages shipped a hardcoded copy of the design prototype's demo cards
 * and only swapped in real data after hydration, so the server-rendered
 * HTML — the version search engines index — advertised nine properties that
 * did not exist and linked to codes that 404.
 *
 * Privacy: coordinates, lessor contact details and internalOnly fields never
 * reach this DTO (AGENT.md §7, FR-LST-02).
 */
import { db } from './db';
import { stripInternal, displayArea, displayLocation, displayProvince } from './propertyDto';

const PRIVATE_KEYS = ['location_map', 'lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'];

export type PublicListing = {
  code: string;
  title: string;
  deal: string;
  loc: string;
  price: string;
  area: number | null;
  areaLabel: string;
  typeKey: string;
  img: string | null;
  photos: string;
  /** province on its own, so the listing page can build its zone filter from
      real inventory instead of a hardcoded list */
  province: string;
};

export type ListingQuery = {
  deal?: string;
  type?: string;
  province?: string;
  limit?: number;
};

const baht = (n: number) =>
  n >= 1_000_000 ? `฿ ${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)} ล้าน` : `฿ ${n.toLocaleString('th-TH')}`;

export async function loadPublicListings(q: ListingQuery = {}): Promise<PublicListing[]> {
  const limit = Math.min(60, Math.max(1, Number(q.limit ?? 24)));

  const rows = await db.property.findMany({
    where: { status: 'active', ...(q.type ? { typeKey: q.type } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  return rows.flatMap((p) => {
    const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
    for (const k of PRIVATE_KEYS) delete values[k];

    const dealType = String(values.deal_type ?? '');
    const isSale = dealType.includes('ขาย');
    const isRent = dealType.includes('เช่า');
    if (q.deal === 'rent' && !isRent) return [];
    if (q.deal === 'sale' && !isSale) return [];

    const province = displayProvince(values);
    if (q.province && !province.includes(q.province)) return [];

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
      loc: displayLocation(values) || province || '—',
      price,
      area,
      areaLabel: area !== null ? `${area.toLocaleString('th-TH')} ตร.ม.` : '',
      typeKey: p.typeKey,
      img: photos[0] ?? null,
      photos: String(photos.length),
      province,
    }];
  }).slice(0, limit);
}
