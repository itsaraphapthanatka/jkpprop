import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, HTML_LANG, isLocale } from '@/i18n/config';
import './globals.css';

export const metadata: Metadata = {
  title: 'JKP Property — นายหน้าโรงงานและโกดังอุตสาหกรรม',
  description:
    'รวมรายการโรงงานและโกดังให้เช่า–ขายทั่วประเทศ ที่ผ่านการตรวจสอบและคัดกรองโดยทีมงานมืออาชีพ',
};

/* Only one layout may render <html>, and admin/api sit outside [locale], so
   the locale arrives as a header set by middleware rather than as a param. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const raw = (await headers()).get('x-locale') ?? DEFAULT_LOCALE;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return (
    <html lang={HTML_LANG[locale]}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
