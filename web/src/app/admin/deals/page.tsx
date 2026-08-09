import type { Metadata } from 'next';
import { DealPage } from '@/components/admin/DealPage';

export const metadata: Metadata = { title: 'Deals · JKP CMS', robots: { index: false } };

/* No id in the URL → the most recently updated deal. Use the picker in the
   topbar (or /admin/deals/<id>) to open a specific one. */
export default function AdminDealsIndexPage() {
  return <DealPage />;
}
