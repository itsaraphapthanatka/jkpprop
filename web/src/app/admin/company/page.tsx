import type { Metadata } from 'next';
import { CompanyBody } from '@/components/admin/CompanyBody';

export const metadata: Metadata = { title: 'ข้อมูลบริษัท · JKP CMS', robots: { index: false } };

export default function AdminCompanyPage() {
  return <CompanyBody />;
}
