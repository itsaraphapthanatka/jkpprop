import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { FieldBuilderBody } from '@/components/admin/FieldBuilderBody';

export const metadata: Metadata = { title: 'Field Builder · JKP CMS', robots: { index: false } };

/* Ported from AdminFieldBuilder.dc.html. Topbar right cluster differs
   from the default (field-scope dropdown + save button), so `actions`
   is passed. Interactive toggle state lives in <FieldBuilderBody>. */

const fbCss = `
@media (max-width:1100px){ #fb-split{grid-template-columns:1fr !important;} #fb-preview{position:static !important;} }
.fb-save:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(13,108,59,.35);}
.fb-edit:hover{background:var(--border);}
.fb-type:hover{border-color:#7A3FB0;transform:translateY(-2px);}
`;

const topbarActions = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      ฟิลด์ของ: โรงงาน
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
    </div>
    <div className="fb-save" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
      บันทึก
    </div>
  </div>
);

export default function AdminFieldBuilderPage() {
  return (
    <AdminShell active="cms" eyebrow="Settings / Field Builder" title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>Field Builder <span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: '#F0ECF9', color: '#7A3FB0', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center' }}>No-code</span></span>} actions={topbarActions} css={fbCss}>
      <FieldBuilderBody />
    </AdminShell>
  );
}
