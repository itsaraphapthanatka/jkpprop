import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@jkp/domain';
import { Breadcrumbs, EmptyState, buttonVariants, cn } from '@jkp/ui';
import { Link } from '@/i18n/navigation';
import {
  hasActiveFilters,
  parseFilters,
  requirementPrefillQuery,
  type RawSearchParams,
} from '@/data/filters';
import { getTaxonomy, searchListings } from '@/data/listings';
import { alternates, breadcrumbJsonLd, JsonLd } from '@/lib/seo';
import { ListingCard } from '@/components/listing/listing-card';
import { CompareBar, CompareProvider } from '@/components/listing/compare';
import { FilterSidebar, MobileFilterDrawer } from '@/components/listing/filter-sidebar';
import { SortDropdown } from '@/components/listing/sort-dropdown';
import { ListingPagination } from '@/components/listing/listing-pagination';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const t = await getTranslations('listing');

  // Base listing page is indexable; filtered/paged states are noindex (SEO policy).
  const noindex = hasActiveFilters(filters) || filters.page > 1;

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: alternates(locale as Locale, '/listing'),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ListingSearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const [result, taxonomy] = await Promise.all([
    searchListings(filters),
    Promise.resolve(getTaxonomy()),
  ]);

  const t = await getTranslations('listing');
  const tc = await getTranslations('common');

  const prefill = requirementPrefillQuery(filters);
  const requirementHref = prefill ? `/requirement?${prefill}` : '/requirement';

  return (
    <section className="mx-auto max-w-wide px-4 py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbHome'), href: `/${locale}` },
          { label: t('breadcrumbListing') },
        ]}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: t('breadcrumbHome'), path: '/' },
            { name: t('breadcrumbListing'), path: '/listing' },
          ],
          locale as Locale,
        )}
      />

      <h1 className="mt-4 text-3xl font-bold text-content-primary">{t('title')}</h1>

      {/* Toolbar: result count + sort + mobile filters trigger */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-content-secondary">{t('resultsCount', { count: result.total })}</p>
        <div className="flex items-center gap-3">
          <MobileFilterDrawer filters={filters} taxonomy={taxonomy} />
          <SortDropdown current={filters.sort} />
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <FilterSidebar filters={filters} taxonomy={taxonomy} />
        </aside>

        <div>
          {result.total === 0 ? (
            <EmptyState
              variant="search"
              title={t('emptyTitle')}
              description={t('emptyText')}
              actions={
                <>
                  <Link href="/listing" className={cn(buttonVariants({ variant: 'outline' }))}>
                    {tc('clearFilters')}
                  </Link>
                  <Link
                    href={requirementHref}
                    className={cn(buttonVariants({ variant: 'primary' }))}
                  >
                    {tc('submitRequirement')}
                  </Link>
                </>
              }
            />
          ) : (
            <CompareProvider>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((l) => (
                  <ListingCard key={l.id} listing={l} context={filters.transactionType} showCompare />
                ))}
              </div>

              {result.totalPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <ListingPagination page={result.page} totalPages={result.totalPages} />
                </div>
              )}

              <CompareBar />
            </CompareProvider>
          )}
        </div>
      </div>
    </section>
  );
}
