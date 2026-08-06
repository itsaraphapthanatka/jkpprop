import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { SocialStatusBody } from '@/components/admin/SocialStatusBody';

export const metadata: Metadata = { title: 'Social Status · JKP CMS', robots: { index: false } };

/* Tracks which channels each listing has been posted to, and holds the
   ready-to-paste post text for each one. */
const pageCss = `
.soc-row:hover{background:var(--tint);}
.soc-open:hover{border-color:#0D6C3B !important;color:#0D6C3B !important;}
@media (max-width:640px){
  #admin-main > main{ padding:16px 14px 44px !important; }
}
@media (max-width:480px){
  #soc-manage{flex:1 1 100% !important;justify-content:center;}
}
`;

export default function AdminSocialStatusPage() {
  return (
    <AdminShell active="social" eyebrow="Dashboard / ทรัพย์" title="Social Status" css={pageCss}>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        ติดตามว่าแต่ละประกาศลงช่องทางไหนไปแล้วบ้าง · กด <b>ดูหมายเหตุ</b> เพื่อคัดลอกข้อความไปโพสต์ แล้วติ๊กช่องทางพร้อมวันที่และลิงก์
      </p>
      <SocialStatusBody />
    </AdminShell>
  );
}
