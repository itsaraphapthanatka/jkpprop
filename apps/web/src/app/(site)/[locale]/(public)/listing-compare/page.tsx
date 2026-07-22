import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  formatArea,
  formatMoney,
  formatNumber,
  type Locale,
  type TransactionType,
} from '@jkp/domain';
import {
  buttonVariants,
  cn,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@jkp/ui';
import { Link } from '@/i18n/navigation';
import type { RawSearchParams } from '@/data/filters';
import { getListingsByIds, getTaxonomy } from '@/data/listings';
import { localize, type ListingDetail } from '@/data/types';

const DASH = '—';

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  // Utility comparison view — never indexed.
  return { title: t('compare.compareBtn'), robots: { index: false, follow: true } };
}

function parseIds(sp: RawSearchParams): string[] {
  const raw = sp.ids;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function ListingComparePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ids = parseIds(sp);
  const listings = ids.length ? await getListingsByIds(ids) : [];

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations();

  if (listings.length === 0) {
    return (
      <section className="mx-auto max-w-wide px-4 py-16">
        <EmptyState
          variant="data"
          title={t('compare.compareBtn')}
          actions={
            <Link href="/listing" className={cn(buttonVariants({ variant: 'primary' }))}>
              {t('nav.listings')}
            </Link>
          }
        />
      </section>
    );
  }

  const taxonomy = getTaxonomy();
  const propertyTypeLabel = new Map(
    taxonomy.propertyTypes.map((o) => [o.value, localize(o.label, locale)] as const),
  );
  const zoneTypeLabel = new Map(
    taxonomy.zoneTypes.map((o) => [o.value, localize(o.label, locale)] as const),
  );

  const txnLabel = (type: TransactionType): string =>
    type === 'rent' ? t('card.forRent') : type === 'sale' ? t('card.forSale') : t('card.forBoth');

  const area = (sqm: number | null): string => {
    if (sqm == null) return DASH;
    const v = formatArea(sqm, locale);
    return v ? `${v} ${t('detail.unitSqm')}` : DASH;
  };

  const measure = (value: number | null, unit: string): string =>
    value == null ? DASH : `${formatNumber(value, locale)} ${unit}`;

  const rows: { key: string; label: string; render: (d: ListingDetail) => ReactNode }[] = [
    {
      key: 'code',
      label: t('detail.code'),
      render: (d) => <span className="font-mono text-content-primary">{d.publicCode}</span>,
    },
    {
      key: 'type',
      label: t('filters.type'),
      render: (d) => propertyTypeLabel.get(d.propertyType) ?? d.propertyType,
    },
    {
      key: 'transaction',
      label: t('filters.transaction'),
      render: (d) => txnLabel(d.transactionType),
    },
    {
      key: 'rent',
      label: t('price.rentLabel'),
      render: (d) => {
        const m = formatMoney(d.rentPrice, { locale });
        return m ? `${m}${t('price.perMonth')}` : t('price.contact');
      },
    },
    {
      key: 'sale',
      label: t('price.saleLabel'),
      render: (d) => formatMoney(d.salePrice, { locale }) ?? t('price.contact'),
    },
    { key: 'usable', label: t('detail.specUsable'), render: (d) => area(d.usableAreaSqm) },
    { key: 'land', label: t('detail.specLand'), render: (d) => area(d.landAreaSqm) },
    {
      key: 'height',
      label: t('detail.specHeight'),
      render: (d) => measure(d.specs.clearHeightM, t('detail.unitM')),
    },
    {
      key: 'floorLoad',
      label: t('detail.specFloorLoad'),
      render: (d) => measure(d.specs.floorLoadingTonPerSqm, t('detail.unitTon')),
    },
    {
      key: 'power',
      label: t('detail.specPower'),
      render: (d) => measure(d.specs.powerKva, t('detail.unitKva')),
    },
    {
      key: 'location',
      label: t('detail.locationTitle'),
      render: (d) => localize(d.locationLabel, locale),
    },
    {
      key: 'zone',
      label: t('filters.zone'),
      render: (d) => (d.zoneType ? (zoneTypeLabel.get(d.zoneType) ?? d.zoneType) : DASH),
    },
  ];

  return (
    <section className="mx-auto max-w-wide px-4 py-8 lg:py-12">
      <h1 className="text-3xl font-bold text-content-primary">{t('compare.compareBtn')}</h1>

      <div className="mt-6 rounded-lg border border-line bg-surface-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40 min-w-[10rem]" aria-hidden="true" />
              {listings.map((d) => (
                <TableHead key={d.id} scope="col" className="min-w-[12rem] align-top py-3">
                  <Link
                    href={`/listing/${d.slug}`}
                    className="font-semibold text-content-primary transition-colors hover:text-accent focus-visible:shadow-focus"
                  >
                    {localize(d.title, locale)}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableHead scope="row" className="font-medium text-content-secondary">
                  {row.label}
                </TableHead>
                {listings.map((d) => (
                  <TableCell key={d.id}>{row.render(d)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
