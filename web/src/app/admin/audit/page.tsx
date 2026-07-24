import type { Metadata } from 'next';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { AuditBody, AuditExport } from '@/components/admin/AuditBody';

export const metadata: Metadata = { title: 'Audit · JKP CMS', robots: { index: false } };

export default function AdminAuditPage() {
  return (
    <AdminShell active="settings" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'ความปลอดภัย' }]} />} title="Audit Logs" actions={<AuditExport />}>
      <AuditBody />
    </AdminShell>
  );
}
