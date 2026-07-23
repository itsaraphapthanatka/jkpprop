import type { Metadata } from 'next';
import { AdminLogin } from '@/components/admin/AdminLogin';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ · JKP CMS', robots: { index: false } };

export default function AdminLoginPage() {
  return <AdminLogin />;
}
