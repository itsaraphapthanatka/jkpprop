import type { Metadata } from 'next';
import { ShortlistPage } from '@/components/admin/ShortlistPage';

export const metadata: Metadata = { title: 'Shortlists · JKP CMS', robots: { index: false } };

/* No id in the URL → the newest shortlist. Use the topbar picker or
   /admin/shortlists/<id> to open a specific one. */
export default function AdminShortlistsIndexPage() {
  return <ShortlistPage />;
}
