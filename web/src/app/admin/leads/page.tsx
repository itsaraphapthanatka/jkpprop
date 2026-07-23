import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { LeadsBody } from '@/components/admin/LeadsBody';

export const metadata: Metadata = { title: 'Leads · JKP CMS', robots: { index: false } };

/* Ported from AdminLeads.dc.html. Topbar right cluster differs from the
   default (search only, no bell / "เพิ่มทรัพย์"), so `actions` is passed. */

const leadCss = `
@media (max-width:1100px){ #lead-split{grid-template-columns:1fr !important;} }
`;

export default function AdminLeadsPage() {
  return (
    <AdminShell
      active="leads"
      eyebrow="Dashboard / งานขาย"
      title="Leads"
      css={leadCss}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 220 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>
            <input placeholder="ค้นหาชื่อ/บริษัท/อีเมล" style={{ border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
          </div>
        </div>
      }
    >
      <LeadsBody />
    </AdminShell>
  );
}
