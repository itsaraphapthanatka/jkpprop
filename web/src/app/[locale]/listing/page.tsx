import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ListingShell } from '@/components/listing/ListingShell';
import { PROVINCES } from '@/lib/thaiProvinces';
import { SIZE_ITEMS, PRICE_ITEMS } from '@/lib/listingFilters';

/* Title in the reader's language: this page shipped a hard-coded Thai one to
   every locale, including in search results. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { title: `${getDictionary(locale).titles.listing} | JKP Property` };
}


/* ?province= — clicking a province on the home map lands here. The area
   landing pages already narrow by province through a preset; the open listing
   page had no way to be told, so the map could only link to everything. */
export default async function ListingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.province) ? sp.province[0] : sp.province;
  // only a province this site actually knows — the value is shown in the crumb
  const province = PROVINCES.find((p) => p.th === (raw ?? '').trim())?.th;
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v)?.trim() || undefined; };

  /* what the search box on the home page sends. Anything the listing page
     cannot honour is dropped here rather than silently ignored downstream. */
  const q = one('q')?.slice(0, 120);
  const deal = one('deal');
  const type = one('type');
  const size = SIZE_ITEMS.includes(one('size') ?? '') ? one('size') : undefined;
  const price = PRICE_ITEMS.includes(one('price') ?? '') ? one('price') : undefined;

  const preset = {
    breadcrumb: province ?? q ?? '',
    ...(province ? { province } : {}),
    ...(q ? { q } : {}),
    ...(deal === 'rent' || deal === 'sale' ? { listingMode: deal as 'rent' | 'sale' } : {}),
    ...(type ? { typeSel: [type] } : {}),
    ...(size ? { sizeSel: size } : {}),
    ...(price ? { priceSel: price } : {}),
  };
  const any = Object.keys(preset).some((k) => k !== 'breadcrumb');
  return <ListingShell preset={any || preset.breadcrumb ? preset : undefined} />;
}
