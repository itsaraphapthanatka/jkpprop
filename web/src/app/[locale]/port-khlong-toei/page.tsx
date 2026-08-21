import type { Metadata } from 'next';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ListingShell } from '@/components/listing/ListingShell';

/* สไลด์ 7 · "เพิ่ม ท่าเรือคลองเตย" — ตัวเลือกท่าเรือมีแหลมฉบัง มหาชัย
   มาบตาพุด แต่ไม่มีคลองเตย ทั้งที่เป็นท่าเรือที่ใกล้คลังในกรุงเทพฯ ที่สุด */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { title: `${getDictionary(locale).titles.portKhlongToei} | JKP Property` };
}

export default function PortKhlongToeiPage() {
  return <ListingShell preset={{ province: 'กรุงเทพมหานคร', breadcrumb: 'ท่าเรือคลองเตย' }} />;
}
