import type { Metadata } from 'next';
import { PageBuilderBody } from '@/components/admin/PageBuilderBody';

export const metadata: Metadata = { title: 'Page Builder · JKP CMS', robots: { index: false } };

/* Ported from AdminPageBuilder.dc.html. The page is interactive and its
   topbar right cluster (page tabs + "เผยแพร่") shares state with the body,
   so the client component <PageBuilderBody> renders <AdminShell> itself. */

export default function AdminPageBuilderPage() {
  return <PageBuilderBody />;
}
