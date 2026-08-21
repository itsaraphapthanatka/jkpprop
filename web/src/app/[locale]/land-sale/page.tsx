import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ListingShell } from '@/components/listing/ListingShell';
import { propertyType } from '@/lib/propertySchema';

/* สไลด์ 1 · "เพิ่มโชว์รูม และ อาคารพาณิชย์ · ที่ดิน" — เมนูบนสุดมีแต่โรงงานกับ
   โกดัง ทั้งที่ระบบคีย์ทรัพย์ได้สี่ประเภทมาตั้งแต่แรก หน้านี้เป็นปลายทางของเมนู
   ที่เพิ่มเข้ามา ใช้โครงเดียวกับหน้าโรงงาน/โกดังทุกอย่าง */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { title: `${getDictionary(locale).titles.landSale} | JKP Property` };
}

export default function LandSalePage() {
  return (
    <ListingShell
      preset={{ breadcrumb: 'ที่ดินสำหรับขาย', listingMode: 'sale', typeSel: [propertyType('land').label], filterKey: 'land-sale' }}
    />
  );
}
