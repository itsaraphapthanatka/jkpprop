import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'ทรัพย์ในกรุงเทพฯ | JKP Property' };

export default function BangkokCBDPage() {
  return <ListingShell preset={{ breadcrumb: 'กรุงเทพฯ', totalCount: '820' }} />;
}
