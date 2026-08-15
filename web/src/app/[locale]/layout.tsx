import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { LOCALES, isLocale } from '@/i18n/config';

// read at runtime like the sitemap does, so the domain is not baked into the image
const SITE = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
import { SyncHtmlLang } from '@/i18n/SyncHtmlLang';
import { ConsentGate } from '@/components/site/ConsentGate';
import { getDictionary } from '@/i18n/dictionaries';
import { brandThemeCss } from '@/lib/server/brandTheme';
import type { Metadata } from 'next';

/* Locale segment for the public site (AGENT.md §9). Admin is Thai-only and
   deliberately sits outside this tree.

   The <html lang> attribute is owned by the root layout — only one layout may
   render <html> — so middleware passes the locale down as a header and the
   root layout reads it there. This layout's job is to pin the three valid
   locales and 404 anything else, instead of rendering a page at /jp. */

/* title/description follow the locale — the root layout hardcoded Thai, so an
   /en page announced itself in Thai to search results and social previews. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);

  /* Canonical + hreflang. Nothing declared either, so the three language
     versions of a page competed with each other in search, and /th/property?code=X
     — the URL the sitemap used to advertise — competed with the page it
     redirects to. The path comes from middleware; without it we can still name
     the language versions of the home page. */
  const path = (await headers()).get('x-pathname') ?? '';
  const rest = path.replace(new RegExp(`^/(?:${LOCALES.join('|')})`), '');

  return {
    title: `JKP Property — ${d.hero.headline1} ${d.hero.headline2}`,
    description: d.hero.sub,
    metadataBase: SITE ? new URL(SITE) : undefined,
    alternates: {
      canonical: `${SITE}/${locale}${rest}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${rest}`])),
    },
  };
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  /* Brand colours from /admin/branding, emitted as :root overrides ahead of
     the page so the whole public tree picks them up. Server-rendered, so the
     first paint is already themed — no flash of the default green. */
  const theme = await brandThemeCss().catch(() => '');

  return (
    <>
      {theme && <style dangerouslySetInnerHTML={{ __html: theme }} />}
      <SyncHtmlLang />
      {children}
      {/* here rather than in the page components: /contact — the only page with
          a third-party frame on it — never rendered the old banner at all */}
      <ConsentGate />
    </>
  );
}
