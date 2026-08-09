import type { Metadata } from 'next';
import { DealPage } from '@/components/admin/DealPage';

export const metadata: Metadata = { title: 'Deal · JKP CMS', robots: { index: false } };

export default async function AdminDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealPage dealId={id} />;
}
