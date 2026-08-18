'use client';

import { AdminShell } from '@/components/admin/AdminShell';
import { VisitActions, VisitBody, VisitTitle, setPinnedVisit } from '@/components/admin/VisitBody';
import { RecordPicker } from '@/components/admin/RecordPicker';
import Link from 'next/link';

/* Ported from AdminVisit.dc.html — visit-plan detail (VP-064). Interactive,
   so the <main> content and the stateful topbar right cluster live in the
   client component VisitBody.tsx. */

const visitCss = `
@media (max-width:1100px){ #visit-split{grid-template-columns:1fr !important;} #visit-side{position:static !important;} }
@media (max-width:640px){
  #visit-plan-meta{grid-template-columns:1fr !important;}
  #admin-main > main{ padding:16px 14px 44px !important; }
  #visit-actions{ width:100%; flex-wrap:wrap; row-gap:8px; }
  #visit-actions > div{ flex:1 1 auto; justify-content:center; }
  #visit-gate-row{ flex-wrap:wrap; }
  #visit-gate-btns{ flex:1 1 100% !important; margin-top:12px; }
  #visit-gate-btns > *{ flex:1 1 auto; justify-content:center; }
}
`;

/* Topbar eyebrow (breadcrumb) + title (with a status code badge) contain rich
   markup; AdminShell types them as string, so cast the nodes through unknown. */
const eyebrowNode = (
  <><Link href="/admin/shortlists" style={{ color: 'var(--muted2)' }}>Shortlists</Link> / แผนเข้าชม</>
);

export function VisitPage({ visitId }: { visitId?: string }) {
  // pin before VisitBody/VisitActions run their shared fetch
  setPinnedVisit(visitId);
  return (
    <AdminShell
      active="visits"
      eyebrow={eyebrowNode as unknown as string}
      title={<VisitTitle /> as unknown as string}
      actions={<><RecordPicker base="visits" endpoint="/api/visits" currentId={visitId} toRow={(v) => ({ id: String(v.id), label: `นัดชม ${new Date(Number(v.date)).toLocaleDateString('th-TH')}`, meta: `${(v.stops as unknown[] | undefined)?.length ?? 0} ทรัพย์ · ${v.status}` })} /><VisitActions /></>}
      css={visitCss}
    >
      <VisitBody />
    </AdminShell>
  );
}
