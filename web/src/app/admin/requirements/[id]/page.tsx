import type { Metadata } from 'next';
import { RequirementBody } from '@/components/admin/RequirementBody';

export const metadata: Metadata = { title: 'Requirement · JKP CMS', robots: { index: false } };

export default async function AdminRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RequirementBody id={id} />;
}
