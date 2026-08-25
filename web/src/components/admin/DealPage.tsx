'use client';

import { AdminShell } from '@/components/admin/AdminShell';
import DealBody, { DealProvider, DealTitle, DealActions } from '@/components/admin/DealBody';
import Link from 'next/link';
import { RecordPicker } from '@/components/admin/RecordPicker';
import { dealCodeOf } from '@/lib/jobCode';

/* Ported from AdminDeal.dc.html. The topbar heading (dynamic status
   badge) and right cluster (Close deal / Unlock) share the deal's
   closed/dialog state with the body, so DealProvider wraps AdminShell
   and the title/actions are client components reading that context.
   AdminShell's `eyebrow`/`title` are typed `string`; the design needs
   rich nodes (a link, a status badge), so they are passed as nodes
   and cast — the only deviation. */

const dealCss = `
@media (max-width:1100px){ #deal-split{grid-template-columns:1fr !important;} }
@media (max-width:480px){
  #deal-actions{ width:100%; }
  #deal-close-btn, #deal-unlock-btn{ width:100%; }
}
`;

const eyebrow = (
  <>
    <Link href="/admin/leads" style={{ color: 'var(--muted2)' }}>Leads</Link> / Negotiation → Deal
  </>
);

export function DealPage({ dealId }: { dealId?: string }) {
  return (
    <DealProvider dealId={dealId}>
      <AdminShell
        active="deals"
        eyebrow={eyebrow as unknown as string}
        title={(<DealTitle />) as unknown as string}
        actions={<><RecordPicker base="deals" endpoint="/api/deals" currentId={dealId} toRow={(d) => {
          /* ข้อ 22 · รายการเลือกดีลก็ต้องอ่านออกว่าเป็นของลูกค้าเจ้าไหน */
          const c = dealCodeOf(d.requirementCode as string | undefined, String(d.id)).code;
          const who = String(d.customer || '').trim();
          return { id: String(d.id), label: who ? `${who} — ${c}` : c, meta: `${d.status}${d.locked ? ' · ล็อก' : ''}` };
        }} /><DealActions /></>}
        css={dealCss}
      >
        <DealBody />
      </AdminShell>
    </DealProvider>
  );
}
