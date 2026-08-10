import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'โรงงานให้เช่า | JKP Property' };

export default function FactoryRentPage() {
  return (
    <ListingShell
      preset={{ breadcrumb: 'โรงงานให้เช่า', listingMode: 'rent', typeSel: ['โรงงาน'], filterKey: 'factory-rent' }}
    />
  );
}
