import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { ShortlistProvider, ShortlistActions, ShortlistMain } from '@/components/admin/ShortlistBody';

export const metadata: Metadata = { title: 'Shortlists · JKP CMS', robots: { index: false } };

/* Ported from AdminShortlist.dc.html. The topbar has a non-default
   right cluster (item count + "ส่งให้ลูกค้า") and a custom eyebrow
   (link) + title (code badge); both are passed through AdminShell.
   ShortlistProvider wraps the shell so the topbar actions and the
   main body share the send-dialog / add-remove state. */

const slCss = `
@media (max-width:1100px){ #sl-split{grid-template-columns:1fr !important;} #sl-side{position:static !important;} }
@media (max-width:480px){
  .sl-item-thumb{display:none !important;}
  .sl-item-row{gap:8px !important;}
}
`;

const eyebrowNode = (
  <>
    <a href="/admin/requirements" style={{ color: 'var(--muted2)' }}>REQ-1042</a> / Shortlist
  </>
);

const titleNode = (
  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    SL-208 <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#9A741C', background: '#FBF3E1', padding: '2px 8px', borderRadius: 6 }}>draft</code>
  </span>
);

export default function AdminShortlistsPage() {
  return (
    <ShortlistProvider>
      <AdminShell
        active="shortlists"
        eyebrow={eyebrowNode as unknown as string}
        title={titleNode as unknown as string}
        actions={<ShortlistActions />}
        css={slCss}
      >
        <ShortlistMain />
      </AdminShell>
    </ShortlistProvider>
  );
}
