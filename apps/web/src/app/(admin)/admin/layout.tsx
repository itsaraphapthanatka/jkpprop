import '@jkp/tokens/css';
import '../../globals.css';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { AdminShell } from '@/components/shells/admin-shell';

export const metadata: Metadata = {
  title: 'JKP Admin',
  robots: { index: false, follow: false },
};

/**
 * Admin root layout (second root layout via route group — no locale prefix,
 * single language). Dark-ready: add data-theme="dark" to <html> to flip the
 * whole admin tree to the dark token set (D5).
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
