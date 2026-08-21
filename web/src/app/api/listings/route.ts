/* Listings (§9 /admin/listings) — v1 derives one listing row per property
   (Property ≠ Listing arrives with the full pipeline build; the row shape
   matches ListingsAdminBody's Row so the page can swap straight over). */
import { ok, handler } from '@/lib/server/api';
import { requireUser, scopeWhere } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { displayArea, displayProvince, displayFullLocation } from '@/lib/server/propertyDto';
import { isFeatured } from '@/lib/server/publicListings';

const fmtPrice = (values: Record<string, unknown>): { text: string; dealK: string; deal: string } => {
  const deal = String(values.deal_type ?? '');
  const rent = Number(values.price_rent ?? NaN);
  const sale = Number(values.price_sale ?? values.price ?? NaN);
  const both = deal.includes('/') || deal.includes('และ');
  const dealK = both ? 'both' : deal.includes('ขาย') ? 'sale' : 'rent';
  const money = (n: number) => (n >= 1_000_000 ? `฿${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : `฿${n.toLocaleString('th-TH')}`);
  let text = '—';
  if (dealK === 'rent' && Number.isFinite(rent)) text = `${money(rent)}/ด.`;
  else if (Number.isFinite(sale)) text = money(sale);
  else if (Number.isFinite(rent)) text = `${money(rent)}/ด.`;
  return { text, dealK, deal: both ? 'ทั้งสอง' : dealK === 'sale' ? 'ขาย' : 'เช่า' };
};

const STATUS_OUT: Record<string, string> = { active: 'published', draft: 'draft', hidden: 'hidden', archived: 'hidden' };

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.property.findMany({
    where: { orgId: user.orgId, ...scopeWhere(user, 'ownerId') },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });
  /* ว่าง/ไม่ว่าง อยู่คนละตาราง — หน้านี้มีป้าย "ไม่ว่าง" อยู่แล้วแต่ไม่เคยมี
     ทางได้ค่านั้นมา เพราะ status ที่ส่งออกอ่านจาก Property เท่านั้น */
  const taken = new Set(
    (await db.listing.findMany({
      where: { propertyId: { in: rows.map((r) => r.id) }, status: 'unavailable' },
      select: { propertyId: true },
    })).map((l) => l.propertyId),
  );
  return ok({
    items: rows.map((p) => {
      const values = (p.values ?? {}) as Record<string, unknown>;
      const price = fmtPrice(values);
      return {
        id: p.id,
        title: p.title,
        code: p.publicCode,
        // the admin table used to guess the type from words in the title
        typeKey: p.typeKey,
        area: displayArea(values),
        // สไลด์ 22 · แขวง เขต จังหวัด — เดิมหน้านี้แสดงแค่จังหวัด
        location: displayFullLocation(values) || displayProvince(values) || '—',
        /* ช่องที่เมนูค้นหาชุดร่วมต้องใช้ (สไลด์ 22) */
        zoning: String(values.zoning_color ?? ''),
        dealLabel: String(values.deal_type ?? ''),
        sizeSqm: [values.building_area_total, values.building_area, values.usable_area]
          .find((v) => typeof v === 'number') as number | undefined ?? null,
        priceValue: [values.price_rent, values.price_sale, values.price]
          .find((v) => typeof v === 'number') as number | undefined ?? null,
        available: !taken.has(p.id),
        pic: String(values.pic ?? ''),
        /* รูปหน้าปก — ตารางเดิมไม่มีรูปเลย ทุกแถวหน้าตาเหมือนกันหมด */
        img: (() => {
          const ph = values.photos;
          return Array.isArray(ph) && typeof ph[0] === 'string' ? (ph[0] as string) : null;
        })(),
        deal: price.deal,
        dealK: price.dealK,
        price: price.text,
        status: STATUS_OUT[p.status] ?? 'draft',
        featured: isFeatured(p.values),
        updatedAt: p.updatedAt.getTime(),
      };
    }),
  });
});
