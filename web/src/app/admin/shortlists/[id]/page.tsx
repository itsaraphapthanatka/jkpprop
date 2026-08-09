import type { Metadata } from 'next';
import { ShortlistPage } from '@/components/admin/ShortlistPage';

export const metadata: Metadata = { title: 'Shortlist · JKP CMS', robots: { index: false } };

export default async function AdminShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShortlistPage shortlistId={id} />;
}
