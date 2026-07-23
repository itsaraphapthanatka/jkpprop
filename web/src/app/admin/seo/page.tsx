import type { Metadata } from 'next';
import { SEOBody } from '@/components/admin/SEOBody';

export const metadata: Metadata = { title: 'SEO / GEO · JKP CMS', robots: { index: false } };

export default function AdminSEOPage() {
  return <SEOBody />;
}
