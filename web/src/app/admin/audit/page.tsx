import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuditBody, AuditExport } from '@/components/admin/AuditBody';

export const metadata: Metadata = { title: 'Audit · JKP CMS', robots: { index: false } };

export default function AdminAuditPage() {
  return (
    <AdminShell active="settings" eyebrow="Settings / ความปลอดภัย" title="Audit Logs" actions={<AuditExport />}>
      <AuditBody />
    </AdminShell>
  );
}
