'use client';

import { AdminShell } from '@/components/admin/AdminShell';
import { ShortlistProvider, ShortlistActions, ShortlistMain, useShortlist } from '@/components/admin/ShortlistBody';
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

/* The header used to read "REQ-1042 / Shortlist" and "SL-208 draft" whatever
   record was open — and the requirement it linked to did not exist. */
const STATUS_CHIP: Record<string, { bg: string; fg: string; label: string }> = {
  open: { bg: '#FBF3E1', fg: '#9A741C', label: 'ร่าง' },
  sent: { bg: '#E8F3EC', fg: '#0D6C3B', label: 'ส่งให้ลูกค้าแล้ว' },
  closed: { bg: '#EFEDE8', fg: '#6B665E', label: 'ปิดแล้ว' },
};

function ShortlistEyebrow() {
  const { requirement } = useShortlist();
  return (
    <>
      {requirement
        ? <Link href={`/admin/requirements/${requirement.id}`} style={{ color: 'var(--muted2)' }}>{requirement.code}</Link>
        : <Link href="/admin/shortlists" style={{ color: 'var(--muted2)' }}>Shortlists</Link>}
      {' / Shortlist'}
    </>
  );
}

function ShortlistTitle() {
  const { name, status } = useShortlist();
  const chip = STATUS_CHIP[status] ?? { bg: 'var(--bg)', fg: 'var(--muted2)', label: status };
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {name || 'Shortlist'}
      {status && (
        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: chip.fg, background: chip.bg, padding: '2px 8px', borderRadius: 6 }}>{chip.label}</code>
      )}
    </span>
  );
}

export function ShortlistPage({ shortlistId }: { shortlistId?: string }) {
  return (
    <ShortlistProvider shortlistId={shortlistId}>
      <AdminShell
        active="shortlists"
        eyebrow={<ShortlistEyebrow /> as unknown as string}
        title={<ShortlistTitle /> as unknown as string}
        actions={<><RecordPicker base="shortlists" endpoint="/api/shortlists" currentId={shortlistId} toRow={(x) => ({
          id: String(x.id),
          label: String(x.name || 'Shortlist'),
          /* รหัสงานนำหน้า เพื่อให้ไล่ตรวจได้ว่าเป็นของงานไหน (25 ส.ค.) */
          meta: [String(x.requirementCode || ''), `${x.count} ทรัพย์`, String(x.status)].filter(Boolean).join(' · '),
        })} /><ShortlistActions /></>}
        css={slCss}
      >
        <ShortlistMain />
      </AdminShell>
    </ShortlistProvider>
  );
}
