import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'ทรัพย์ใกล้สนามบินดอนเมือง | JKP Property' };

export default function AirportDonmuangPage() {
  return <ListingShell preset={{ breadcrumb: 'สนามบินดอนเมือง', totalCount: '640' }} />;
}
