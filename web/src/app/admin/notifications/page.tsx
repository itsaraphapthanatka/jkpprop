import type { Metadata } from 'next';
import { NotifySettingsBody } from '@/components/admin/NotifySettingsBody';

export const metadata: Metadata = { title: 'การแจ้งเตือนสัญญาเช่า · JKP CMS', robots: { index: false } };

export default function AdminNotificationsPage() {
  return <NotifySettingsBody />;
}
