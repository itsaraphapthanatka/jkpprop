import '@jkp/tokens/css';
import '../../globals.css';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing, type AppLocale } from '@/i18n/routing';

export const metadata: Metadata = {
  title: { default: 'JKP Property', template: '%s · JKP Property' },
  description: 'นายหน้าโรงงานและโกดังอุตสาหกรรม เช่า–ขาย ทั่วพื้นที่อุตสาหกรรมหลักของไทย',
};

/** Pre-render all locales (SSG). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
