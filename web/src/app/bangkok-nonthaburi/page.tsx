import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'ทรัพย์ในนนทบุรี | JKP Property' };

export default function BangkokNonthaburiPage() {
  return <ListingShell preset={{ breadcrumb: 'นนทบุรี', totalCount: '330' }} />;
}
