import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaBody } from '@/components/admin/MediaBody';
import Link from 'next/link';
import { UploadButton } from '@/components/admin/UploadButton';

export const metadata: Metadata = { title: 'Media · JKP CMS', robots: { index: false } };

/* Ported from AdminMedia.dc.html — Media Manager. Topbar right cluster
   differs from the default (จัดการ Section link + อัปโหลด button), so a
   custom `actions` node is passed. Interactive grid lives in MediaBody. */

const mediaCss = `
@media (max-width:1100px){ #media-layout{grid-template-columns:1fr !important;} #media-folders{position:static !important;top:auto !important;} }
@media (max-width:640px){ #media-grid{grid-template-columns:repeat(2,1fr) !important;} #media-actions{flex-wrap:wrap !important;width:100% !important;row-gap:8px !important;} }
`;

const mediaActions = (
  <div id="media-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <Link href="/admin/sections" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 9v11" /></svg>จัดการ Section
    </Link>
    <UploadButton />
  </div>
);

export default function AdminMediaPage() {
  return (
    <AdminShell active="media" eyebrow="เนื้อหา / Media" title="Media Manager" actions={mediaActions} css={mediaCss}>
      <MediaBody />
    </AdminShell>
  );
}
