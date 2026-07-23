import type { Metadata } from 'next';
import { ListingShell } from '@/components/listing/ListingShell';

export const metadata: Metadata = { title: 'โกดังสำหรับขาย | JKP Property' };

export default function WarehouseSalePage() {
  return (
    <ListingShell
      preset={{ breadcrumb: 'โกดังสำหรับขาย', totalCount: '203', listingMode: 'sale', typeSel: ['โกดัง/คลังสินค้า'], filterKey: 'warehouse-sale' }}
    />
  );
}
