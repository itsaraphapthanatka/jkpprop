import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'โรงงานสำหรับขาย | JKP Property' };

export default function FactorySalePage() {
  return (
    <ListingShell
      preset={{ breadcrumb: 'โรงงานสำหรับขาย', totalCount: '316', listingMode: 'sale', typeSel: ['โรงงาน'], filterKey: 'factory-sale' }}
    />
  );
}
