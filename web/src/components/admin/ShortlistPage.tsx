'use client';

import { AdminShell } from '@/components/admin/AdminShell';
import { ShortlistProvider, ShortlistActions, ShortlistMain } from '@/components/admin/ShortlistBody';
import Link from 'next/link';
import { RecordPicker } from '@/components/admin/RecordPicker';

/* Ported from AdminShortlist.dc.html. The topbar has a non-default
   right cluster (item count + "ส่งให้ลูกค้า") and a custom eyebrow
   (link) + title (code badge); both are passed through AdminShell.
   ShortlistProvider wraps the shell so the topbar actions and the
   main body share the send-dialog / add-remove state. */

const slCss = `
#sl-split > div{ min-width:0; }
@media (max-width:1100px){ #sl-split{grid-template-columns:1fr !important;} #sl-side{position:static !important;} }
@media (max-width:640px){ #admin-main > main{ padding:16px 14px 44px !important; } }
@media (max-width:480px){
  .sl-item-thumb{display:none !important;}
  .sl-item-row{gap:8px !important;}
}
`;

const eyebrowNode = (
  <>
    <Link href="/admin/requirements" style={{ color: 'var(--muted2)' }}>REQ-1042</Link> / Shortlist
  </>
);

const titleNode = (
  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    SL-208 <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#9A741C', background: '#FBF3E1', padding: '2px 8px', borderRadius: 6 }}>draft</code>
  </span>
);

export function ShortlistPage({ shortlistId }: { shortlistId?: string }) {
  return (
    <ShortlistProvider shortlistId={shortlistId}>
      <AdminShell
        active="shortlists"
        eyebrow={eyebrowNode as unknown as string}
        title={titleNode as unknown as string}
        actions={<><RecordPicker base="shortlists" endpoint="/api/shortlists" currentId={shortlistId} toRow={(x) => ({ id: String(x.id), label: String(x.name || 'Shortlist'), meta: `${x.count} ทรัพย์ · ${x.status}` })} /><ShortlistActions /></>}
        css={slCss}
      >
        <ShortlistMain />
      </AdminShell>
    </ShortlistProvider>
  );
}
