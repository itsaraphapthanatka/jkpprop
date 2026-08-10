import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'ทรัพย์ใกล้ท่าเรือมาบตาพุด | JKP Property' };

export default function PortMapTaPhutPage() {
  return <ListingShell preset={{ province: 'ระยอง', breadcrumb: 'ท่าเรือมาบตาพุด' }} />;
}
