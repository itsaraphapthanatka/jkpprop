import type { Metadata } from 'next';
import { RequirementsListBody } from '@/components/admin/RequirementsListBody';

export const metadata: Metadata = { title: 'Requirements · JKP CMS', robots: { index: false } };

export default function AdminRequirementsPage() {
  return <RequirementsListBody />;
}
