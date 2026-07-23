import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'ทรัพย์ใกล้สนามบินสุวรรณภูมิ | JKP Property' };

export default function AirportSuvarnabhumiPage() {
  return <ListingShell preset={{ breadcrumb: 'สนามบินสุวรรณภูมิ', totalCount: '640' }} />;
}
