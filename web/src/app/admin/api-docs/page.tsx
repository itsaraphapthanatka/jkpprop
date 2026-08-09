import type { Metadata } from 'next';
import { ApiDocsBody } from '@/components/admin/ApiDocsBody';

export const metadata: Metadata = { title: 'API Reference · JKP CMS', robots: { index: false } };

export default function AdminApiDocsPage() {
  return <ApiDocsBody />;
}
