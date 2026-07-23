import type { Metadata } from 'next';
import { ForgotPassword } from '@/components/admin/ForgotPassword';

export const metadata: Metadata = { title: 'ลืมรหัสผ่าน · JKP CMS', robots: { index: false } };

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
