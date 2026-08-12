import { notFound } from 'next/navigation';
import { LOCALES, isLocale } from '@/i18n/config';
import { SyncHtmlLang } from '@/i18n/SyncHtmlLang';
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
  return { title: `JKP Property — ${d.hero.headline1} ${d.hero.headline2}`, description: d.hero.sub };
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
    </>
  );
}
