import type { ReactNode } from 'react';
import { requireSession } from '@/data/admin/session';
import { AdminShell } from '@/components/shells/admin-shell';

/**
 * Guarded admin area. requireSession() redirects unauthenticated users to
 * /admin/login (FR-SEC-01). Everything under (app) renders inside the shell.
 */
export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const user = await requireSession();
  return <AdminShell user={user}>{children}</AdminShell>;
}
