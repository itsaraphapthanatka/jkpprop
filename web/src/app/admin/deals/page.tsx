import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import DealBody, { DealProvider, DealTitle, DealActions } from '@/components/admin/DealBody';

export const metadata: Metadata = { title: 'Deals · JKP CMS', robots: { index: false } };

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
    <a href="/admin/leads" style={{ color: 'var(--muted2)' }}>Leads</a> / Negotiation → Deal
  </>
);

export default function AdminDealPage() {
  return (
    <DealProvider>
      <AdminShell
        active="deals"
        eyebrow={eyebrow as unknown as string}
        title={(<DealTitle />) as unknown as string}
        actions={<DealActions />}
        css={dealCss}
      >
        <DealBody />
      </AdminShell>
    </DealProvider>
  );
}
