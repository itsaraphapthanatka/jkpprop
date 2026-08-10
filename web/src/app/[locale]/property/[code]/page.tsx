import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PropertyHeader } from '@/components/property/PropertyHeader';
import { PropertyDetail } from '@/components/property/PropertyDetail';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Floating } from '@/components/home/Floating';
import { db } from '@/lib/server/db';
import { stripInternal, displayArea, displayLocation } from '@/lib/server/propertyDto';
import { propertyType } from '@/lib/propertySchema';
import { enumLabel } from '@/i18n/enums';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { buildSpecs } from '@/lib/server/propertySpecs';
import { loadPublicListings } from '@/lib/server/publicListings';

/* Public property detail. Read straight from the database in the server
   component — no client fetch, so the page is indexable.

   Privacy rules (AGENT.md §7, FR-LST-02): exact coordinates, lessor contact
   details and internalOnly fields never leave the server. */
const PRIVATE_KEYS = ['location_map', 'lessor_name', 'lessor_phone', 'lessor_company', 'lessor_status'];

/* the record's own updatedAt — the page used to print a fixed "18 ก.ค. 2026" */
const fmtDate = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(d);

async function load(code: string) {
  const p = await db.property.findFirst({ where: { publicCode: decodeURIComponent(code), status: 'active' } });
  if (!p) return null;
  const values = stripInternal(p.typeKey, (p.values ?? {}) as Record<string, unknown>, null);
  for (const k of PRIVATE_KEYS) delete values[k];
  return { p, values };
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const found = await load(code).catch(() => null);
  if (!found) return { title: 'ไม่พบทรัพย์ · JKP Property' };
  const area = displayArea(found.values);
  return {
    title: `${found.p.title} · ${found.p.publicCode} · JKP Property`,
    description: [found.p.title, displayLocation(found.values), area ? `${area.toLocaleString('th-TH')} ตร.ม.` : '']
      .filter(Boolean).join(' · '),
  };
}

export default async function PropertyByCodePage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale: raw, code } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const found = await load(code);
  if (!found) notFound();

  const { p, values } = found;

  /* other published properties of the same type — the "similar" row used to
     be three invented records baked into the component */
  const related = (await loadPublicListings({ locale, type: p.typeKey, limit: 4 }).catch(() => []))
    .filter((r) => r.code !== p.publicCode)
    .slice(0, 3)
    .map((r) => ({ code: r.code, deal: r.deal, title: r.title, loc: r.loc, price: r.price, img: r.img }));

  const zoningRaw = String(values.zoning_color ?? '').trim();
  const photos = Array.isArray(values.photos) ? (values.photos as string[]) : [];

  const property = {
    code: p.publicCode,
    title: p.title,
    typeLabel: enumLabel(propertyType(p.typeKey).label, locale),
    location: displayLocation(values),
    area: displayArea(values),
    dealType: enumLabel(String(values.deal_type ?? ''), locale),
    priceRent: typeof values.price_rent === 'number' ? values.price_rent : null,
    priceSale: typeof values.price_sale === 'number' ? values.price_sale : (typeof values.price === 'number' ? values.price : null),
    updatedAt: fmtDate(p.updatedAt, locale),
    specs: buildSpecs(values, locale),
    zoning: zoningRaw ? enumLabel(zoningRaw, locale) : null,
    photos,
    related,
  };

  return (
    <div style={{ width: '100%', background: '#000000', position: 'relative' }}>
      <div
        id="page-sheet"
        style={{ position: 'relative', zIndex: 2, background: 'var(--bg)', minHeight: '100vh', boxShadow: '0 50px 90px rgba(0,0,0,.4)' }}
      >
        <PropertyHeader />
        <PropertyDetail property={property} />
      </div>
      <SiteFooter />
      <Floating />
    </div>
  );
}
