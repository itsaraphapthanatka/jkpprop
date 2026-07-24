import type { Metadata } from 'next';
import { FieldBuilderBody } from '@/components/admin/FieldBuilderBody';

export const metadata: Metadata = { title: 'Field Builder · JKP CMS', robots: { index: false } };

/* AdminShell + the topbar cluster (field-scope dropdown + save) live inside
   FieldBuilderBody so they can share the interactive state (mirrors the
   pattern used by GeographyBody). */

export default function AdminFieldBuilderPage() {
  return <FieldBuilderBody />;
}
