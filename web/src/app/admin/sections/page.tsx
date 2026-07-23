import type { Metadata } from 'next';
import { SectionsBody } from '@/components/admin/SectionsBody';

export const metadata: Metadata = { title: 'Sections · JKP CMS', robots: { index: false } };

/* Ported from AdminSections.dc.html — CMS section manager. The topbar page
   tabs are interactive and share state with the section list + edit panel,
   so SectionsBody (client) owns all state and renders AdminShell itself
   (active="cms"), including the custom interactive topbar `actions`. */

export default function AdminSectionsPage() {
  return <SectionsBody />;
}
