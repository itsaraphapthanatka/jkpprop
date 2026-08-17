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
import { getDictionary, type Dictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { stripInternal, displayArea, displayLocation, displayProvince } from './propertyDto';
import { localTitleFor } from './propertyI18n';
import { provinceLabel, canonicalProvince, sameProvince } from '@/i18n/places';
import { watermarkVersion, withVersion } from './photoUrl';

const PRIVATE_KEYS = ['location_map', 'lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'];

export type PublicListing = {
  code: string;
  title: string;
  deal: string;
  loc: string;
  price: string;
  /** the same figure in baht, so sorting and the price filter never have to
      read it back out of `price` — that text is translated */
  priceValue: number;
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
  locale?: Locale;
  deal?: string;
  type?: string;
  province?: string;
  limit?: number;
};

/* Every card label is built here, so anything written in Thai below ships to
   /en and /zh unchanged. `perMonth` was already read from the dictionary; the
   unit, the "price on request" fallback, the rent/sale badge and the word for
   a million were not, so an English card read "฿ 4.5 ล้าน · 2,700 ตร.ม." */
const money = (n: number, d: Dictionary) =>
  n >= 1_000_000
    ? `฿ ${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)} ${d.common.million}`
    : `฿ ${n.toLocaleString('en-US')}`;

/* "แนะนำ" is stored on the property itself, not a column — v1 has one listing
   per property, so there is nowhere else to hang it yet. */
export const isFeatured = (values: unknown): boolean =>
  !!values && typeof values === 'object' && (values as Record<string, unknown>).featured === true;

export async function loadPublicListings(q: ListingQuery = {}): Promise<PublicListing[]> {
  const d = getDictionary(q.locale ?? DEFAULT_LOCALE);
  const perMonth = d.common.perMonth;
/* เพดานเดิมคือ 60 ตั้งไว้ตอนที่ทั้งระบบมีทรัพย์ 3 รายการ พอทีมนำเข้าของจริง
   393 รายการ หน้ารายการก็เห็นแค่ 60 รายการแรก อีก 336 รายการหายไปเงียบ ๆ
   ทั้งจากหน้าเว็บและจากตัวกรอง */
  const limit = Math.min(500, Math.max(1, Number(q.limit ?? 24)));

  const found = await db.property.findMany({
    where: { status: 'active', ...(q.type ? { typeKey: q.type } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  });

  /* The star Ops ticks on /admin/listings decides what leads the homepage
     strip; recency only breaks the tie. Sort is stable, so within each group
     the newest still comes first. */
  const rows = [...found].sort(
    (a, b) => Number(isFeatured(b.values)) - Number(isFeatured(a.values)),
  );

  /* Card images are served with a one-year immutable cache, so a browser that
     saw a photo before the logo watermark was switched on would keep showing
     the unstamped copy. ?v=<settings version> makes it a different URL. One
     lookup per org, not per row. */
  const wmv = new Map<string, number>();
  for (const orgId of new Set(rows.map((r) => r.orgId))) {
    wmv.set(orgId, await watermarkVersion(orgId));
  }

  return rows.flatMap((p) => {
    const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
    for (const k of PRIVATE_KEYS) delete values[k];

    const dealType = String(values.deal_type ?? '');
    const isSale = dealType.includes('ขาย');
    const isRent = dealType.includes('เช่า');
    if (q.deal === 'rent' && !isRent) return [];
    if (q.deal === 'sale' && !isSale) return [];

    /* ชื่อจังหวัดเทียบด้วยรูปมาตรฐาน ไม่ใช่เทียบข้อความดิบ — ข้อมูลเขียน
       "กรุงเทพ" ส่วนลิงก์จากแผนที่ส่ง "กรุงเทพมหานคร" มา */
    const province = canonicalProvince(displayProvince(values));
    if (q.province && !sameProvince(province, q.province)) return [];

    const rent = Number(values.price_rent ?? NaN);
    const sale = Number(values.price_sale ?? values.price ?? NaN);
    const photos = Array.isArray(values.photos) ? (values.photos as string[]) : [];
    const area = displayArea(values);

    // "both" reads as rent on the card — the detail page shows both prices
    const shown =
      isRent && Number.isFinite(rent) ? { baht: rent, monthly: true }
        : Number.isFinite(sale) ? { baht: sale, monthly: false }
          : Number.isFinite(rent) ? { baht: rent, monthly: true }
            : null;
    const price = shown
      ? shown.monthly ? `${money(shown.baht, d)} ${perMonth}` : money(shown.baht, d)
      : d.common.priceOnRequest;

    return [{
      code: p.publicCode,
      // the Thai title is the record's own; en/zh come from the translation tab
      title: localTitleFor(p, values, q.locale ?? DEFAULT_LOCALE),
      /* stays Thai on purpose: this is the enum key. Both the badge
         (enumLabel) and the listing page's rent/sale filter match on it. */
      deal: isRent ? 'ให้เช่า' : 'ขาย',
      loc: displayLocation(values, q.locale ?? DEFAULT_LOCALE) || provinceLabel(province, q.locale ?? DEFAULT_LOCALE) || '—',
      price,
      priceValue: shown?.baht ?? 0,
      area,
      areaLabel: area !== null ? `${area.toLocaleString('en-US')} ${d.common.sqm}` : '',
      typeKey: p.typeKey,
      img: photos[0] ? withVersion(photos[0], wmv.get(p.orgId) ?? 0) : null,
      photos: String(photos.length),
      province,
    }];
  }).slice(0, limit);
}
