import type { Metadata } from 'next';
import { VisitPage } from '@/components/admin/VisitPage';

export const metadata: Metadata = { title: 'Visit · JKP CMS', robots: { index: false } };

export default async function AdminVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VisitPage visitId={id} />;
}
