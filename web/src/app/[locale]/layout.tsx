import { notFound } from 'next/navigation';
import { LOCALES, isLocale } from '@/i18n/config';
import { SyncHtmlLang } from '@/i18n/SyncHtmlLang';

/* Locale segment for the public site (AGENT.md §9). Admin is Thai-only and
   deliberately sits outside this tree.

   The <html lang> attribute is owned by the root layout — only one layout may
   render <html> — so middleware passes the locale down as a header and the
   root layout reads it there. This layout's job is to pin the three valid
   locales and 404 anything else, instead of rendering a page at /jp. */

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
  return (
    <>
      <SyncHtmlLang />
      {children}
    </>
  );
}
