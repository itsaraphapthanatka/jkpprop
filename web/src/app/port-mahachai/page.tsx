import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'ทรัพย์ใกล้ท่าเรือมหาชัย | JKP Property' };

export default function PortMahachaiPage() {
  return <ListingShell preset={{ breadcrumb: 'ท่าเรือมหาชัย', totalCount: '340' }} />;
}
