import type { Metadata } from 'next';
import { MailSettingsBody } from '@/components/admin/MailSettingsBody';

export const metadata: Metadata = { title: 'อีเมล · JKP CMS', robots: { index: false } };

export default function MailSettingsPage() {
  return <MailSettingsBody />;
}
