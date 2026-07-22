import type { ReactNode } from 'react';
import { PublicPageShell } from '@/components/shells/public-page-shell';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicPageShell>{children}</PublicPageShell>;
}
