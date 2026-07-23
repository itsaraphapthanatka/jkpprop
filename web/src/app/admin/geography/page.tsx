import type { Metadata } from 'next';
import { GeographyBody } from '@/components/admin/GeographyBody';

export const metadata: Metadata = { title: 'Geography · JKP CMS', robots: { index: false } };

/* AdminGeography.dc.html is interactive (view/province/district/zone state
   drives both the topbar tabs+add button and the body), so the entire page —
   including <AdminShell> — is rendered inside the client component
   GeographyBody. This server component only supplies metadata. */

export default function AdminGeographyPage() {
  return <GeographyBody />;
}
