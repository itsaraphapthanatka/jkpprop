import type { Metadata } from 'next';
import { VisitPage } from '@/components/admin/VisitPage';

export const metadata: Metadata = { title: 'Visits · JKP CMS', robots: { index: false } };

/* No id in the URL → the newest plan. Use the topbar picker or
   /admin/visits/<id> to open a specific one. */
export default function AdminVisitsIndexPage() {
  return <VisitPage />;
}
