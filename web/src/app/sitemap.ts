/* sitemap.xml with hreflang alternates — AGENT.md §9 (SEO/GEO is the point of
   the public site). Published properties are included; admin, the tokenized
   client view and the internal reference pages are not. */
import type { MetadataRoute } from 'next';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';
import { db } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

// read at runtime (this route is force-dynamic) so changing the domain does
// not require rebuilding the image — NEXT_PUBLIC_* would be inlined at build
const SITE = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/* every locale-prefixed public route */
const STATIC_PATHS = [
  '', '/listing', '/about', '/faq', '/contact',
  '/factory-rent', '/factory-sale', '/warehouse-rent', '/warehouse-sale',
  '/port-laem-chabang', '/port-mahachai', '/port-map-ta-phut',
  '/airport-suvarnabhumi', '/airport-donmuang',
  '/bangkok-cbd', '/bangkok-nonthaburi',
];

const alternates = (path: string) => ({
  languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${path}`])),
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = await db.property
    .findMany({ where: { status: 'active' }, select: { publicCode: true, updatedAt: true }, take: 5000 })
    .catch(() => []);

  const pages = STATIC_PATHS.map((path) => ({
    url: `${SITE}/${DEFAULT_LOCALE}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === '' || path === '/listing' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: path === '' ? 1 : 0.8,
    alternates: alternates(path),
  }));

  const properties = published.map((p) => {
    const path = `/property?code=${encodeURIComponent(p.publicCode)}`;
    return {
      url: `${SITE}/${DEFAULT_LOCALE}${path}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: alternates(path),
    };
  });

  return [...pages, ...properties];
}
