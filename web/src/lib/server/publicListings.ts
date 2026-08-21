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
import { loadGeoLabels } from './geoLabels';

const PRIVATE_KEYS = ['location_map', 'lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'];

export type PublicListing = {
  code: string;
  title: string;
  deal: string;
  /** ประเภทดีลจริง — ป้ายบนการ์ดเลือกได้คำเดียว ทรัพย์ที่ทั้งเช่าและขายจึงถูก
      ตัวกรอง "ขาย" คัดทิ้ง ทั้งที่ขายอยู่จริง */
  dealKey: 'rent' | 'sale' | 'both' | 'none';
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
  /** เขต/อำเภอ และ แขวง/ตำบล แยกกัน — สไลด์ 9 "แยกจังหวัดเขตแขวง"
      เดิมมีแต่ข้อความรวมก้อนเดียว ("บางพลี, สมุทรปราการ") แยกเป็นสามชั้นไม่ได้ */
  district: string;
  subdistrict: string;
  /** พื้นที่สีตามผังเมือง — ค่าดิบ ใช้ทั้งกรองและทำแท็กที่กดได้ */
  zoning: string;
  /** โซน (ปลอดอากร · กนอ. · DG) · คุณสมบัติ · รับน้ำหนักพื้น — ตัวกรองบน
      หน้าแรกเก็บสามอย่างนี้มาตลอด แต่ไม่เคยส่งไปถึงหน้ารายการ */
  zone: string[];
  features: string[];
  loadTon: number | null;
  /** ว่าง/ไม่ว่าง จากข้อมูลที่ทีมกรอก — เก็บมา 129 รายการแล้วแต่หน้าเว็บไม่เคย
      อ่าน ทรัพย์ที่ปล่อยไปแล้วจึงยังโฆษณาว่าว่างอยู่ */
  available: boolean;
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

  /* ว่าง/ไม่ว่าง อยู่ที่ Listing.status — คิวรีเดียวสำหรับทั้งหน้า ไม่ใช่ต่อแถว */
  const taken = new Set(
    (await db.listing.findMany({
      where: { propertyId: { in: found.map((p) => p.id) }, status: 'unavailable' },
      select: { propertyId: true },
    })).map((l) => l.propertyId),
  );

  /* The star Ops ticks on /admin/listings decides what leads the homepage
     strip; recency only breaks the tie. Sort is stable, so within each group
     the newest still comes first. */
  const rows = [...found].sort(
    (a, b) => Number(isFeatured(b.values)) - Number(isFeatured(a.values))
      // ทรัพย์ที่ไม่ว่างยังแสดงอยู่ แต่ไปต่อท้าย ไม่ไปเบียดของที่เช่าได้จริง
      || Number(taken.has(a.id)) - Number(taken.has(b.id)),
  );

  /* Card images are served with a one-year immutable cache, so a browser that
     saw a photo before the logo watermark was switched on would keep showing
     the unstamped copy. ?v=<settings version> makes it a different URL. One
     lookup per org, not per row. */
  const wmv = new Map<string, number>();
  /* ชื่อ EN/ZH ของพื้นที่ที่ทีมตั้งไว้ใน /admin/geography — โหลดครั้งเดียว
     ต่อ org เหมือนกัน ไม่ใช่ต่อรายการ */
  const geo = new Map<string, Awaited<ReturnType<typeof loadGeoLabels>>>();
  for (const orgId of new Set(rows.map((r) => r.orgId))) {
    wmv.set(orgId, await watermarkVersion(orgId));
    geo.set(orgId, await loadGeoLabels(orgId));
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
      title: localTitleFor(p, values, q.locale ?? DEFAULT_LOCALE, geo.get(p.orgId)),
      /* stays Thai on purpose: this is the enum key. Both the badge
         (enumLabel) and the listing page's rent/sale filter match on it. */
      /* ทรัพย์ที่ยังไม่ได้กรอกประเภทประกาศเคยถูกติดป้ายว่า "ขาย" เพราะเงื่อนไข
         มีแค่สองทาง ปล่อยว่างไว้ดีกว่าติดป้ายผิด */
      deal: isRent ? 'ให้เช่า' : isSale ? 'ขาย' : '',
      dealKey: (isRent && isSale ? 'both' : isRent ? 'rent' : isSale ? 'sale' : 'none') as PublicListing['dealKey'],
      loc: displayLocation(values, q.locale ?? DEFAULT_LOCALE, geo.get(p.orgId))
        || provinceLabel(province, q.locale ?? DEFAULT_LOCALE, geo.get(p.orgId)) || '—',
      price,
      priceValue: shown?.baht ?? 0,
      area,
      areaLabel: area !== null ? `${area.toLocaleString('en-US')} ${d.common.sqm}` : '',
      typeKey: p.typeKey,
      img: photos[0] ? withVersion(photos[0], wmv.get(p.orgId) ?? 0) : null,
      photos: String(photos.length),
      province,
      district: String(values.district ?? values.amphoe ?? ''),
      subdistrict: String(values.subdistrict ?? values.tambon ?? ''),
      zoning: String(values.zoning_color ?? ''),
      zone: Array.isArray(values.zone) ? (values.zone as unknown[]).map(String) : [],
      features: Array.isArray(values.features) ? (values.features as unknown[]).map(String) : [],
      /* เก็บเป็นข้อความ เช่น "3 ตัน/ตร.ม." — ตัวกรองอยากได้ตัวเลขต่ำสุด */
      loadTon: (() => {
        const m = /(\d+(?:\.\d+)?)/.exec(String(values.floor_loading ?? ''));
        return m ? Number(m[1]) : null;
      })(),
      available: !taken.has(p.id),
    }];
  }).slice(0, limit);
}
