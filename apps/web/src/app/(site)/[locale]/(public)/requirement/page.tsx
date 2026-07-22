import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@jkp/domain';
import { parseFilters, type RawSearchParams } from '@/data/filters';
import { getTaxonomy } from '@/data/listings';
import { alternates } from '@/lib/seo';
import {
  RequirementWizard,
  type RequirementPrefill,
} from '@/components/requirement/requirement-wizard';

/**
 * Requirement wizard route (FR-INQ-02/03/04) — the highest-quality lead intake
 * path. Server Component: it parses any search-driven prefill from the query
 * string and hands typed initial values to the client wizard. This is an intake
 * tool, not an SEO asset, so it is `noindex` (but follow).
 */

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'requirement' });
  return {
    title: t('title'),
    description: t('intro'),
    alternates: alternates(locale as Locale, '/requirement'),
    // Intake page — never an organic landing target.
    robots: { index: false, follow: true },
  };
}

export default async function RequirementPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const t = await getTranslations({ locale: locale as Locale, namespace: 'requirement' });

  // Carry the visitor's current search intent into the form (FR-SRC-06).
  const prefill: RequirementPrefill = {
    propertyType: filters.propertyType,
    transactionType: filters.transactionType,
    province: filters.province,
    zoneType: filters.zoneType,
    sizeMin: filters.sizeMin,
    sizeMax: filters.sizeMax,
  };

  return (
    <section className="mx-auto max-w-content px-4 py-12 lg:py-16">
      <h1 className="text-3xl font-bold text-content-primary">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-content-secondary">{t('intro')}</p>

      <div className="mt-8">
        <RequirementWizard taxonomy={getTaxonomy()} locale={locale} prefill={prefill} />
      </div>
    </section>
  );
}
