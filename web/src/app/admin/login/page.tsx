import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminLogin } from '@/components/admin/AdminLogin';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ · JKP CMS', robots: { index: false } };

// AdminLogin reads ?next= via useSearchParams → needs a Suspense boundary
export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}
