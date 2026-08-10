import { redirect } from 'next/navigation';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';

/* /property with no code identifies no property.
 *
 * It used to render <PropertyDetail /> with no record, which fell through to
 * the component's demo defaults — a complete, invented listing (a 2,700 sqm
 * factory in Bang Na at ฿405,000/month) served at a stable public URL and
 * returning 200 to crawlers. The property index is what a visitor here
 * actually wants. */
export default async function PropertyIndexRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  redirect(`/${locale}/listing`);
}
