import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ListingShell } from '@/components/listing/ListingShell';
import { propertyType } from '@/lib/propertySchema';

/* Title in the reader's language: this page shipped a hard-coded Thai one to
   every locale, including in search results. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { title: `${getDictionary(locale).titles.factorySale} | JKP Property` };
}



export default function FactorySalePage() {
  return (
    <ListingShell
      preset={{ breadcrumb: 'โรงงานสำหรับขาย', listingMode: 'sale', typeSel: [propertyType('factory').label], filterKey: 'factory-sale' }}
    />
  );
}
