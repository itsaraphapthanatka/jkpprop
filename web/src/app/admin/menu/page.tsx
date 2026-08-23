import type { Metadata } from 'next';
import { MenuOrderBody } from '@/components/admin/MenuOrderBody';

export const metadata: Metadata = { title: 'ลำดับเมนู · JKP CMS', robots: { index: false } };

export default function AdminMenuOrderPage() {
  return <MenuOrderBody />;
}
