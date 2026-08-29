import type { Metadata } from 'next';
import { ResetPassword } from '@/components/admin/ResetPassword';

export const metadata: Metadata = { title: 'ตั้งรหัสผ่านใหม่ · JKP CMS', robots: { index: false } };

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
