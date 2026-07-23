import '@jkp/tokens/css';
import '../../globals.css';

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@jkp/ui';

export const metadata: Metadata = {
  title: { default: 'JKP Admin', template: '%s · JKP Admin' },
  robots: { index: false, follow: false },
};

/**
 * Admin root layout (route-group root, no locale prefix). Provides <html>/<body>
 * only — the dark shell + auth guard live in the nested (app) layout so the
 * /admin/login page can render without them.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
