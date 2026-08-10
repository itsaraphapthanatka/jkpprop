import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'โกดังให้เช่า | JKP Property' };

export default function WarehouseRentPage() {
  return (
    <ListingShell
      preset={{ breadcrumb: 'โกดังสำหรับเช่า', listingMode: 'rent', typeSel: ['โกดัง/คลังสินค้า'], filterKey: 'warehouse-rent' }}
    />
  );
}
