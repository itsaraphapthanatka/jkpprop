import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { PropertyEditBody } from '@/components/admin/PropertyEditBody';

export const metadata: Metadata = { title: 'Property Edit · JKP CMS', robots: { index: false } };

/* Ported from AdminPropertyEdit.dc.html. The design's topbar right cluster
   differs from the default (autosave note + ยกเลิก + บันทึก instead of
   search/bell/เพิ่มทรัพย์), so it is passed via `actions`. The interactive
   form (tabs + feature toggles) lives in <PropertyEditBody> (client). */

const editCss = `
@media (max-width:640px){ #ed-grid{grid-template-columns:1fr !important;} #ed-media{grid-template-columns:repeat(2,1fr) !important;} }
`;

const actions = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: '11.5px', color: 'var(--muted3)', display: 'flex', alignItems: 'center', gap: 5 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>บันทึกอัตโนมัติ 1 นาทีที่แล้ว
    </span>
    <a href="/admin/property-view" style={{ height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center' }}>ยกเลิก</a>
    <div className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>บันทึก
    </div>
  </div>
);

export default function AdminPropertyEditPage() {
  return (
    <AdminShell active="properties" eyebrow="Properties / JKP-SPK0042 / แก้ไข" title="แก้ไขทรัพย์" actions={actions} css={editCss}>
      <PropertyEditBody />
    </AdminShell>
  );
}
