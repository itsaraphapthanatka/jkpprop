import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ListingShell } from '@/components/listing/ListingShell';
import { PROVINCES } from '@/lib/thaiProvinces';
import { SIZE_ITEMS, PRICE_ITEMS } from '@/lib/listingFilters';
import { ZONE_COLORS } from '@/lib/propertySchema';
import { readFilterParams } from '@/lib/publicFilters';

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
  /* ?zone= — แท็กพื้นที่สีบนหน้ารายละเอียดลิงก์มาที่นี่ (สไลด์ 12
     "กดแล้วไม่ไปตามแท็ค") รับเฉพาะสีที่ระบบรู้จัก */
  const zoneColor = ZONE_COLORS.includes(one('zone') ?? '') ? one('zone') : undefined;
  const more = readFilterParams(sp);
  const price = PRICE_ITEMS.includes(one('price') ?? '') ? one('price') : undefined;

  /* ?saved=1 — the heart in the masthead lands here. The codes live in the
     reader's browser, so the filtering happens client-side; this only opens
     the page with that filter already on. */
  const saved = one('saved') === '1';

  const preset = {
    breadcrumb: province ?? zoneColor ?? q ?? '',
    ...(saved ? { onlyFavs: true } : {}),
    ...(province ? { province } : {}),
    ...(q ? { q } : {}),
    ...(deal === 'rent' || deal === 'sale' ? { listingMode: deal as 'rent' | 'sale' } : {}),
    ...(type ? { typeSel: [type] } : {}),
    ...(size ? { sizeSel: size } : {}),
    ...(price ? { priceSel: price } : {}),
    ...(zoneColor ? { zoningSel: [zoneColor] } : {}),
    /* แผงตัวกรองบนหน้าแรกส่งมาครบทุกหมวดแล้ว หน้านี้ต้องรับให้ครบด้วย */
    ...(more.areas.length ? { areaSel: more.areas } : {}),
    ...(more.colors.length && !zoneColor ? { zoningSel: more.colors } : {}),
    ...(more.zones.length ? { estateSel: more.zones } : {}),
    ...(more.features.length ? { featureSel: more.features } : {}),
    ...(more.load !== null ? { loadSel: more.load } : {}),
  };
  const any = Object.keys(preset).some((k) => k !== 'breadcrumb');
  return <ListingShell preset={any || preset.breadcrumb ? preset : undefined} />;
}
