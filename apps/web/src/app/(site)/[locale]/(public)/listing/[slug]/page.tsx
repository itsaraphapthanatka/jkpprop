import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';
import { Badge, Breadcrumbs, DefinitionList, KeyValueGrid, cn } from '@jkp/ui';
import { formatDate, formatArea, formatNumber, type Locale } from '@jkp/domain';
import { getListingBySlug, getRelatedListings } from '@/data/listings';
import { localize } from '@/data/types';
import { alternates, breadcrumbJsonLd, JsonLd, listingJsonLd } from '@/lib/seo';
import { PriceDisplay } from '@/components/listing/price-display';
import { MapCard } from '@/components/listing/map-card';
import { ListingCard } from '@/components/listing/listing-card';
import { Gallery } from '@/components/listing/gallery';
import { InquiryForm } from '@/components/listing/inquiry-form';

/**
 * Canonical listing detail route (D1): /[locale]/listing/[slug].
 * Server Component — location text and specs render in the first HTML for SEO,
 * location privacy is enforced by the data layer (FR-LST-02: coords are nulled
 * unless mapVisibility === 'exact'), and a missing/unpublished slug is a real
 * 404 via notFound().
 */

type PageParams = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    const t = await getTranslations({ locale: l, namespace: 'detail' });
    return { title: t('notFoundTitle') };
  }

  const title = localize(listing.title, l);
  const description = localize(listing.description, l);

  return {
    title,
    description,
    alternates: alternates(l, `/listing/${slug}`),
    openGraph: {
      title,
      description,
      images: listing.gallery,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale: localeParam, slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const locale = localeParam as Locale;
  const [tDetail, tCard, tListing, tFeatures] = await Promise.all([
    getTranslations({ locale, namespace: 'detail' }),
    getTranslations({ locale, namespace: 'card' }),
    getTranslations({ locale, namespace: 'listing' }),
    getTranslations({ locale, namespace: 'features' }),
  ]);

  const title = localize(listing.title, locale);
  const description = localize(listing.description, locale);

  const txnLabel =
    listing.transactionType === 'rent'
      ? tCard('forRent')
      : listing.transactionType === 'sale'
        ? tCard('forSale')
        : tCard('forBoth');

  // ---- Breadcrumbs (visible trail + matching JSON-LD) ----
  const crumbs = [
    { name: tListing('breadcrumbHome'), path: '/' },
    { name: tListing('breadcrumbListing'), path: '/listing' },
    { name: localize(listing.province, locale), path: `/listing?province=${listing.provinceSlug}` },
    { name: title, path: `/listing/${slug}` },
  ];
  const breadcrumbItems = crumbs.map((c, i) => ({
    label: c.name,
    href: i === crumbs.length - 1 ? undefined : `/${locale}${c.path === '/' ? '' : c.path}`,
  }));

  // ---- Specs formatting (units are i18n; empty values are dropped downstream) ----
  const specs = listing.specs;
  const areaWithUnit = (v: number | null) => {
    const f = formatArea(v, locale);
    return f ? `${f} ${tDetail('unitSqm')}` : null;
  };
  const heightVal =
    specs.clearHeightM != null ? `${formatNumber(specs.clearHeightM, locale)} ${tDetail('unitM')}` : null;
  const floorLoadVal =
    specs.floorLoadingTonPerSqm != null
      ? `${formatNumber(specs.floorLoadingTonPerSqm, locale)} ${tDetail('unitTon')}`
      : null;
  const powerVal =
    specs.powerKva != null ? `${formatNumber(specs.powerKva, locale)} ${tDetail('unitKva')}` : null;

  const quickSpecs = [
    { label: tDetail('specUsable'), value: areaWithUnit(specs.usableAreaSqm) },
    { label: tDetail('specHeight'), value: heightVal },
    { label: tDetail('specFloorLoad'), value: floorLoadVal },
    { label: tDetail('specPower'), value: powerVal },
    { label: tDetail('specLand'), value: areaWithUnit(specs.landAreaSqm) },
  ];
  const fullSpecs = [
    { term: tDetail('specLand'), definition: areaWithUnit(specs.landAreaSqm) },
    { term: tDetail('specBuiltUp'), definition: areaWithUnit(specs.builtUpAreaSqm) },
    { term: tDetail('specUsable'), definition: areaWithUnit(specs.usableAreaSqm) },
    { term: tDetail('specOffice'), definition: areaWithUnit(specs.officeAreaSqm) },
    { term: tDetail('specHeight'), definition: heightVal },
    { term: tDetail('specFloorLoad'), definition: floorLoadVal },
    { term: tDetail('specPower'), definition: powerVal },
  ];

  const mapNote =
    listing.mapVisibility === 'exact' ? tDetail('mapNoteExact') : tDetail('mapNoteArea');

  const related = await getRelatedListings(listing, 3);

  const sectionHeading = 'text-lg font-bold text-content-primary';

  return (
    <div className="mx-auto max-w-wide px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />
      <JsonLd data={breadcrumbJsonLd(crumbs, locale)} />
      <JsonLd data={listingJsonLd(listing, locale)} />

      <div className="mt-6 flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-x-8 lg:gap-y-10">
        {/* Left column, top: gallery + title + specs (sections 2–5) */}
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-1">
          {/* (2) Gallery */}
          <Gallery images={listing.gallery} alt={title} />

          {/* (3) Title block */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{txnLabel}</Badge>
              {!listing.available ? <Badge variant="danger">{tCard('unavailable')}</Badge> : null}
              <span className="font-mono text-sm text-content-muted">{listing.publicCode}</span>
            </div>
            <h1 className="text-2xl font-bold text-content-primary sm:text-3xl">{title}</h1>
            <PriceDisplay
              rentPrice={listing.rentPrice}
              salePrice={listing.salePrice}
              transactionType={listing.transactionType}
              size="lg"
            />
            <p className="text-sm text-content-muted">
              {tDetail('updatedAt')}: {formatDate(listing.updatedAt, locale)}
            </p>
            {description ? (
              <p className="whitespace-pre-line pt-1 text-content-secondary">{description}</p>
            ) : null}
          </div>

          {/* (4) Quick specs */}
          <section>
            <h2 className={cn(sectionHeading, 'mb-3')}>{tDetail('quickSpecs')}</h2>
            <KeyValueGrid items={quickSpecs} />
          </section>

          {/* (5) Full specs */}
          <section>
            <h2 className={cn(sectionHeading, 'mb-3')}>{tDetail('specsTitle')}</h2>
            <DefinitionList items={fullSpecs} />
          </section>
        </div>

        {/* (8) Inquiry sidebar — right column on desktop (sticky), after specs on mobile */}
        <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="lg:sticky lg:top-20">
            <InquiryForm publicCode={listing.publicCode} listingId={listing.id} title={title} />
          </div>
        </aside>

        {/* Left column, bottom: features + location + disclaimer + related (6,7,9,10) */}
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
          {/* (6) Features */}
          {listing.features.length > 0 ? (
            <section>
              <h2 className={cn(sectionHeading, 'mb-3')}>{tDetail('featuresTitle')}</h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {listing.features.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-content-secondary">
                    <Check className="size-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                    {tFeatures(key)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* (7) Location — never renders coords when visibility !== 'exact' */}
          <section>
            <h2 className={cn(sectionHeading, 'mb-3')}>{tDetail('locationTitle')}</h2>
            <MapCard
              locationLabel={localize(listing.locationLabel, locale)}
              mapVisibility={listing.mapVisibility}
              note={mapNote}
            />
          </section>

          {/* (9) Availability disclaimer */}
          <section className="rounded-md border border-line-subtle bg-surface-alt p-4">
            <p className="text-sm text-content-muted">{tDetail('disclaimer')}</p>
            {listing.availabilityNote ? (
              <p className="mt-1 text-sm text-content-secondary">
                {localize(listing.availabilityNote, locale)}
              </p>
            ) : null}
          </section>

          {/* (10) Related listings */}
          {related.length > 0 ? (
            <section>
              <h2 className={cn(sectionHeading, 'mb-4')}>{tDetail('relatedTitle')}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((r) => (
                  <ListingCard key={r.id} listing={r} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
