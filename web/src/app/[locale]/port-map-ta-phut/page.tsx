import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ListingShell } from '@/components/listing/ListingShell';

/* Title in the reader's language: this page shipped a hard-coded Thai one to
   every locale, including in search results. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { title: `${getDictionary(locale).titles.portMapTaPhut} | JKP Property` };
}



export default function PortMapTaPhutPage() {
  return <ListingShell preset={{ province: 'ระยอง', breadcrumb: 'ท่าเรือมาบตาพุด' }} />;
}
