import type { Metadata } from 'next';
import { ProfileBody } from '@/components/admin/ProfileBody';

export const metadata: Metadata = { title: 'โปรไฟล์ของฉัน · JKP CMS', robots: { index: false } };

export default function ProfilePage() {
  return <ProfileBody />;
}
