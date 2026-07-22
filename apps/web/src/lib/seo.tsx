import type { Metadata } from 'next';
import { LOCALES, type Locale } from '@jkp/domain';
import { localize, type ListingDetail } from '@/data/types';
import { SITE_URL } from './site';

/** Renders a JSON-LD <script>. Data must derive from the same model as the UI. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here (no user HTML injected).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** canonical + hreflang alternates for a locale-less path (e.g. '/listing/jkp-x'). */
export function alternates(locale: Locale, path: string): Metadata['alternates'] {
  const clean = path === '/' ? '' : path;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `${SITE_URL}/${l}${clean}`;
  languages['x-default'] = `${SITE_URL}/th${clean}`;
  return { canonical: `${SITE_URL}/${locale}${clean}`, languages };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JKP Property',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    areaServed: 'TH',
    knowsLanguage: ['th', 'en', 'zh'],
  };
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'JKP Property',
    url: SITE_URL,
    inLanguage: ['th', 'en', 'zh'],
  };
}

/** BreadcrumbList mirroring the visible breadcrumb (name + absolute url). */
export function breadcrumbJsonLd(items: { name: string; path: string }[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}/${locale}${item.path === '/' ? '' : item.path}`,
    })),
  };
}

/** Product/Offer schema for a listing detail (FR-GEO-02). */
export function listingJsonLd(detail: ListingDetail, locale: Locale): Record<string, unknown> {
  const url = `${SITE_URL}/${locale}/listing/${detail.slug}`;
  const offers: Record<string, unknown>[] = [];
  if (detail.rentPrice != null) {
    offers.push({
      '@type': 'Offer',
      priceCurrency: 'THB',
      price: detail.rentPrice,
      availability: detail.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      category: 'Rent',
      url,
    });
  }
  if (detail.salePrice != null) {
    offers.push({
      '@type': 'Offer',
      priceCurrency: 'THB',
      price: detail.salePrice,
      availability: detail.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      category: 'Sale',
      url,
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localize(detail.title, locale),
    sku: detail.publicCode,
    description: localize(detail.description, locale),
    image: detail.gallery.length ? detail.gallery : [detail.coverImage],
    category: detail.propertyType,
    url,
    ...(offers.length ? { offers } : {}),
  };
}
