'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';

/* Ported from AdminUsers.dc.html — Users & Roles. Interactive: view
   toggle (users / roles matrix) lives in the topbar, an invite modal
   with multi-select role chips, both driven by client state. Because the
   topbar view-tabs + "เชิญผู้ใช้" button share state with the body, this
   client component owns the <AdminShell> wrapper (page.tsx just renders
   it + metadata). */

/* ---- role badges ---- */
const roleBadgeStyle = (bg: string, fg: string): React.CSSProperties => ({
  height: 20,
  padding: '0 8px',
  borderRadius: 6,
  background: bg,
  color: fg,
  fontSize: 10,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
});

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  super_admin: roleBadgeStyle('#273c33', '#fff'),
  listing_mgr: roleBadgeStyle('#EEF4F3', '#034956'),
  sales_agent: roleBadgeStyle('#E8F3EC', '#0D6C3B'),
  ops_coord: roleBadgeStyle('#FBF3E1', '#9A741C'),
  content_editor: roleBadgeStyle('#F0ECF9', '#7A3FB0'),
  translator: roleBadgeStyle('#EAF3F6', '#1E5AA8'),
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super admin',
  listing_mgr: 'Listing mgr',
  sales_agent: 'Sales agent',
  ops_coord: 'Ops coord',
  content_editor: 'Content',
  translator: 'Translator',
};

const rl = (labels: string[]) => labels.map((l) => ({ label: ROLE_LABELS[l], style: ROLE_STYLES[l] }));

/* ---- status pills ---- */
const statusStyle = (bg: string, fg: string): React.CSSProperties => ({
  height: 22,
  padding: '0 11px',
  borderRadius: 9999,
  background: bg,
  color: fg,
  fontSize: 11,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
});

const STATUS_ON = statusStyle('#E8F3EC', '#0D6C3B');
const STATUS_OFF = statusStyle('#F0EEE9', '#7A7974');

/* ---- static data (view-independent) ---- */
const SUMMARY = [
  { label: 'ผู้ใช้ทั้งหมด', value: '12', color: '#28251D' },
  { label: 'ใช้งานอยู่', value: '10', color: '#0D6C3B' },
  { label: 'บทบาท (roles)', value: '6', color: '#034956' },
];

const USERS = [
  { name: 'กิตติพงษ์ พรหมทอง', email: 'kittipong@jkp.co', initial: 'ก', avBg: '#273c33', avFg: '#2DFB91', roles: rl(['super_admin']), lastLogin: 'ออนไลน์', statusText: 'ใช้งาน', statusSty: STATUS_ON },
  { name: 'อารยา สุขสวัสดิ์', email: 'araya@jkp.co', initial: 'อ', avBg: '#E8F3EC', avFg: '#0D6C3B', roles: rl(['sales_agent']), lastLogin: '5 นาทีที่แล้ว', statusText: 'ใช้งาน', statusSty: STATUS_ON },
  { name: 'วีรพล ตั้งมั่น', email: 'weerapol@jkp.co', initial: 'ว', avBg: '#E8F3EC', avFg: '#0D6C3B', roles: rl(['sales_agent', 'ops_coord']), lastLogin: '1 ชม.ที่แล้ว', statusText: 'ใช้งาน', statusSty: STATUS_ON },
  { name: 'สมชาย ทรัพย์เจริญ', email: 'somchai@jkp.co', initial: 'ส', avBg: '#EEF4F3', avFg: '#034956', roles: rl(['listing_mgr']), lastLogin: 'วันนี้ 08:20', statusText: 'ใช้งาน', statusSty: STATUS_ON },
  { name: 'Lin Wei (แปลจีน)', email: 'linwei@jkp.co', initial: 'L', avBg: '#EAF3F6', avFg: '#1E5AA8', roles: rl(['translator']), lastLogin: '2 วันก่อน', statusText: 'ใช้งาน', statusSty: STATUS_ON },
  { name: 'ณัฐพร (คอนเทนต์)', email: 'natthaporn@jkp.co', initial: 'ณ', avBg: '#F0ECF9', avFg: '#7A3FB0', roles: rl(['content_editor']), lastLogin: '1 สัปดาห์ก่อน', statusText: 'ปิดใช้งาน', statusSty: STATUS_OFF },
];

const ROLE_COLS = ['Super', 'Listing', 'Sales', 'Ops', 'Content', 'Translator'];

const yes = { __html: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" stroke-width="2.6"><path d="M20 6L9 17l-5-5"></path></svg>' };
const no = { __html: '<span style="color:#D4D1CA;font-size:15px;">—</span>' };
const trans = { __html: '<span style="font-size:10px;color:#1E5AA8;font-weight:700;">แปล</span>' };
const readC = { __html: '<span style="font-size:10px;color:#7A7974;font-weight:600;">อ่าน</span>' };
const assignedC = { __html: '<span style="font-size:10px;color:#9A741C;font-weight:600;">มอบหมาย</span>' };

const MATRIX: { action: string; cells: { __html: string }[] }[] = [
  { action: 'Property/Listing + publish', cells: [yes, yes, readC, readC, no, no] },
  { action: 'Availability checks', cells: [yes, yes, yes, yes, no, no] },
  { action: 'Leads / Requirements', cells: [yes, no, assignedC, yes, no, no] },
  { action: 'Shortlists', cells: [yes, no, yes, yes, no, no] },
  { action: 'Visits', cells: [yes, no, yes, yes, no, no] },
  { action: 'Negotiations / Deals', cells: [yes, no, assignedC, readC, no, no] },
  { action: 'Deal unlock หลัง close', cells: [yes, no, no, no, no, no] },
  { action: 'Pages / Articles / FAQ', cells: [yes, no, no, no, yes, trans] },
  { action: 'Users / Roles', cells: [yes, no, no, no, no, no] },
];

const INVITE_DEFS: [string, string][] = [
  ['super_admin', 'Super admin'],
  ['listing_mgr', 'Listing mgr'],
  ['sales_agent', 'Sales agent'],
  ['ops_coord', 'Ops coord'],
  ['content_editor', 'Content editor'],
  ['translator', 'Translator'],
];

const thL: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase' };
const thC: React.CSSProperties = { padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase' };

const USERS_CSS = `
.users-row:hover{background:var(--tint);}
.users-kebab:hover{background:var(--border);}
@media (max-width:640px){
  #users-actions{width:100%;flex-wrap:wrap;row-gap:8px;}
}
`;

export function UsersBody() {
  const [view, setView] = React.useState<'users' | 'roles'>('users');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteSel, setInviteSel] = React.useState<Record<string, boolean>>({ sales_agent: true });

  const openInvite = () => setInviteOpen(true);
  const closeInvite = () => setInviteOpen(false);
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  const viewTabs = ([['users', 'ผู้ใช้'], ['roles', 'สิทธิ์ (Roles)']] as const).map(([k, label]) => ({
    key: k,
    label,
    select: () => setView(k),
    style: {
      height: 32,
      padding: '0 16px',
      borderRadius: 9999,
      fontSize: '12.5px',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      background: view === k ? '#273c33' : 'transparent',
      color: view === k ? '#fff' : 'var(--muted)',
    } as React.CSSProperties,
  }));

  const inviteRoles = INVITE_DEFS.map(([k, label]) => {
    const on = !!inviteSel[k];
    return {
      key: k,
      label,
      toggle: () => setInviteSel({ ...inviteSel, [k]: !on }),
      style: {
        height: 34,
        padding: '0 14px',
        borderRadius: 9999,
        fontSize: '12.5px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
        background: on ? 'rgba(13,108,59,.06)' : 'transparent',
        color: on ? '#0D6C3B' : 'var(--text)',
      } as React.CSSProperties,
    };
  });

  const actions = (
    <div id="users-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {viewTabs.map((v) => (
          <div key={v.key} onClick={v.select} style={v.style}>{v.label}</div>
        ))}
      </div>
      <div onClick={openInvite} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>เชิญผู้ใช้
      </div>
    </div>
  );

  return (
    <AdminShell active="settings" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'ผู้ใช้' }]} />} title="Users & Roles" actions={actions} css={USERS_CSS}>
      {/* USERS VIEW */}
      {view === 'users' && (
        <>
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            {SUMMARY.map((s) => (
              <div key={s.label} style={{ flex: 1, minWidth: 150, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
                <div style={{ marginTop: 4, fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', flex: 1 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                <input placeholder="ค้นหาชื่อ / อีเมล" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: '12.5px', color: 'var(--text)', flex: 1, minWidth: 0 }} />
              </div>
              <div style={{ height: 38, padding: '0 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>ทุก role<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg></div>
            </div>
            <div style={{ overflowX: 'auto' }} className="a-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={thL}>ผู้ใช้</th>
                    <th style={thL}>Roles</th>
                    <th style={thL}>เข้าใช้ล่าสุด</th>
                    <th style={thC}>สถานะ</th>
                    <th style={{ padding: '12px 16px', width: 44 }} />
                  </tr>
                </thead>
                <tbody>
                  {USERS.map((u) => (
                    <tr key={u.email} className="users-row" style={{ borderTop: '1px solid var(--border)', transition: 'background .15s' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 9999, background: u.avBg, color: u.avFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{u.initial}</div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {u.roles.map((r) => (
                            <span key={r.label} style={r.style}>{r.label}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--muted)' }}>{u.lastLogin}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}><span style={u.statusSty}>{u.statusText}</span></td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <div className="users-kebab" style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)', cursor: 'pointer' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ROLES MATRIX VIEW */}
      {view === 'roles' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>สิทธิ์ตาม Role (RBAC 6 บทบาท)</div>
          </div>
          <p style={{ margin: '0 0 18px', fontSize: '12.5px', color: 'var(--muted2)' }}>enforce ที่ API layer ไม่ใช่แค่ซ่อน UI · ✓ = ทำได้ · ◐ = เฉพาะที่ได้รับมอบหมาย/อ่าน</p>
          <div id="matrix-wrap" className="a-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: 'var(--muted2)', position: 'sticky', left: 0, background: 'var(--surface)' }}>การกระทำ</th>
                  {ROLE_COLS.map((rc) => (
                    <th key={rc} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text)', minWidth: 88 }}>{rc}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((m) => (
                  <tr key={m.action} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', position: 'sticky', left: 0, background: 'var(--surface)' }}>{m.action}</td>
                    {m.cells.map((c, i) => (
                      <td key={i} style={{ padding: '12px 8px', textAlign: 'center' }}><span dangerouslySetInnerHTML={c} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {inviteOpen && (
        <div onClick={closeInvite} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stopProp} style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>เชิญผู้ใช้ใหม่</div>
              <div onClick={closeInvite} style={{ width: 30, height: 30, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </div>
            </div>
            <label style={{ display: 'block', marginTop: 18, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>อีเมล</label>
            <input placeholder="name@jkp.co" style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--bg)', outline: 'none' }} />
            <label style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>กำหนด Role (เลือกได้หลายอัน)</label>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {inviteRoles.map((r) => (
                <div key={r.key} onClick={r.toggle} style={r.style}>{r.label}</div>
              ))}
            </div>
            <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div onClick={closeInvite} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div style={{ height: 44, padding: '0 24px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>ส่งคำเชิญ
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
