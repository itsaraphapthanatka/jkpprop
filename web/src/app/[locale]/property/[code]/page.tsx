import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PropertyHeader } from '@/components/property/PropertyHeader';
import { PropertyDetail } from '@/components/property/PropertyDetail';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Floating } from '@/components/home/Floating';
import { db } from '@/lib/server/db';
import { stripInternal, displayArea, displayLocation } from '@/lib/server/propertyDto';
import { localDescription, localTitle } from '@/lib/server/propertyI18n';
import { propertyType } from '@/lib/propertySchema';
import { enumLabel } from '@/i18n/enums';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { buildSpecs } from '@/lib/server/propertySpecs';
import { loadFieldOverride, stripDisabled } from '@/lib/server/fieldOverride';
import { loadPublicListings } from '@/lib/server/publicListings';
import { loadCompany } from '@/lib/server/company';
import { listCmsPages } from '@/lib/server/cmsPages';

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
  /* what this org's Field Builder says about the type — a field switched off
     there must not reach the page, whatever is stored on the record */
  const schema = await loadFieldOverride(p.orgId, p.typeKey);
  return { p, values: stripDisabled(values, schema.disabled), schema };
}

/* The search-result snippet, which is the whole point of rendering this on the
   server — it was written in Thai for all three locales. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }): Promise<Metadata> {
  const { locale: raw, code } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const d = getDictionary(locale);
  const found = await load(code).catch(() => null);
  if (!found) return { title: `${d.listing.emptyTitle} · JKP Property` };
  const area = displayArea(found.values);
  const title = localTitle(found.p, locale);
  return {
    title: `${title} · ${found.p.publicCode} · JKP Property`,
    /* the property's own description in this language when the team wrote one;
       the derived line only stands in while it has none */
    description: localDescription(found.p, locale)
      || [title, displayLocation(found.values, locale), area ? `${area.toLocaleString('en-US')} ${d.common.sqm}` : '']
        .filter(Boolean).join(' · '),
  };
}

export default async function PropertyByCodePage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale: raw, code } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const company = await loadCompany(locale);
  const pages = await listCmsPages(locale).catch(() => []);
  const found = await load(code);
  if (!found) notFound();

  const { p, values } = found;

  /* other published properties of the same type — the "similar" row used to
     be three invented records baked into the component */
  const related = (await loadPublicListings({ locale, type: p.typeKey, limit: 4 }).catch(() => []))
    .filter((r) => r.code !== p.publicCode)
    .slice(0, 3)
    .map((r) => ({
      code: r.code, deal: r.deal, title: r.title, loc: r.loc, price: r.price, img: r.img,
      // the card shows these too; the old related card simply left them out
      photos: r.photos, type: propertyType(r.typeKey).label, area: r.areaLabel,
    }));

  const zoningRaw = String(values.zoning_color ?? '').trim();
  const photos = Array.isArray(values.photos) ? (values.photos as string[]) : [];

  const property = {
    code: p.publicCode,
    title: localTitle(p, locale),
    description: localDescription(p, locale),
    typeLabel: enumLabel(propertyType(p.typeKey).label, locale),
    location: displayLocation(values, locale),
    area: displayArea(values),
    dealType: enumLabel(String(values.deal_type ?? ''), locale),
    priceRent: typeof values.price_rent === 'number' ? values.price_rent : null,
    priceSale: typeof values.price_sale === 'number' ? values.price_sale : (typeof values.price === 'number' ? values.price : null),
    updatedAt: fmtDate(p.updatedAt, locale),
    specs: buildSpecs(values, locale, found.schema),
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
      <SiteFooter company={company} pages={pages} />
      <Floating />
    </div>
  );
}
