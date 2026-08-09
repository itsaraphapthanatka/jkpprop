import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChangePassword } from '@/components/admin/ChangePassword';

export const metadata: Metadata = { title: 'เปลี่ยนรหัสผ่าน · JKP CMS', robots: { index: false } };

// reads ?forced=1 via useSearchParams → needs a Suspense boundary
export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePassword />
    </Suspense>
  );
}
