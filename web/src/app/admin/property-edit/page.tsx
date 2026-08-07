import type { Metadata } from 'next';
import { PropertyEditBody } from '@/components/admin/PropertyEditBody';

export const metadata: Metadata = { title: 'Property Edit · JKP CMS', robots: { index: false } };

/* Ported from AdminPropertyEdit.dc.html. The topbar "บันทึก" button must share
   state with the form, so the body renders <AdminShell> itself (same pattern
   as Geography/Listings). Open with ?code=JKP-SPK0042 to edit a record. */

export default function AdminPropertyEditPage() {
  return <PropertyEditBody />;
}
