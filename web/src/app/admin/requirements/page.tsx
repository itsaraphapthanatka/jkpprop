import type { Metadata } from 'next';
import { RequirementBody } from '@/components/admin/RequirementBody';

export const metadata: Metadata = { title: 'Requirements · JKP CMS', robots: { index: false } };

export default function AdminRequirementsPage() {
  return <RequirementBody />;
}
