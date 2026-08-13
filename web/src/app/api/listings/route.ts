/* Listings (§9 /admin/listings) — v1 derives one listing row per property
   (Property ≠ Listing arrives with the full pipeline build; the row shape
   matches ListingsAdminBody's Row so the page can swap straight over). */
import { ok, handler } from '@/lib/server/api';
import { requireUser, scopeWhere } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { displayArea, displayProvince } from '@/lib/server/propertyDto';
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
        location: displayProvince(values) || '—',
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
