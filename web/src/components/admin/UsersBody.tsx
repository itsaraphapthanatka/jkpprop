'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { apiGet, apiPut, apiPost, apiPatch, ApiClientError } from '@/lib/apiClient';
import {
  ROLES, role as roleOf, PRIVILEGES, MATRIX, scopeLabel, privAllowed, initialPrivs,
  type RoleKey, type Scope, type PrivKey, type Cell,
} from '@/lib/rbac';

/* Users & Roles. Two views: the user list (assign role + data scope +
   per-user privileges) and the permission matrix. The rules themselves live
   in lib/rbac.ts so this file only renders them. */

const statusStyle = (bg: string, fg: string): React.CSSProperties => ({ height: 22, padding: '0 11px', borderRadius: 9999, background: bg, color: fg, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' });
const STATUS_ON = statusStyle('#E8F3EC', '#0D6C3B');
const STATUS_OFF = statusStyle('#F0EEE9', '#7A7974');

type UserRow = {
  name: string; email: string; initial: string; avBg: string; avFg: string;
  role: RoleKey; scope: Scope; privs: PrivKey[]; expires?: string;
  lastLogin: string; active: boolean;
};

/* No seeded people here on purpose. This page listed seven invented staff —
   kittipong@jkp.co, araya@jkp.co, a co-agent expiring in 2026 — and only
   replaced them once GET /api/users answered, which it does for an owner and
   nobody else. Every other role, and any hiccup, showed a staff directory of
   people who do not exist, with roles and privileges beside their names. */

/* ---- matrix cell rendering ---- */
const CELL: Record<Cell, { node: React.ReactNode; title: string }> = {
  yes: { node: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>, title: 'ทำได้' },
  scope: { node: <span style={{ fontSize: 10, color: '#034956', fontWeight: 700 }}>ตามขอบเขต</span>, title: 'ทำได้ตามขอบเขตข้อมูลที่ตั้งไว้' },
  read: { node: <span style={{ fontSize: 10, color: '#7A7974', fontWeight: 700 }}>อ่าน</span>, title: 'อ่านอย่างเดียว' },
  priv: { node: <span style={{ fontSize: 10, color: '#9A741C', fontWeight: 700 }}>สิทธิ์พิเศษ</span>, title: 'ต้องเปิดสิทธิ์พิเศษให้รายคนก่อน' },
  no: { node: <span style={{ color: '#D4D1CA', fontSize: 15 }}>—</span>, title: 'ไม่ได้' },
};

const thL: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const thC: React.CSSProperties = { ...thL, textAlign: 'center' };
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 7 };

const USERS_CSS = `
.users-row:hover{background:var(--tint);}
.users-edit:hover{border-color:#0D6C3B !important;color:#0D6C3B !important;}
@media (max-width:640px){
  #users-actions{width:100%;flex-wrap:wrap;row-gap:8px;}
  #admin-main > main{ padding:16px 14px 44px !important; }
}
@media (max-width:480px){
  #users-invite{flex:1 1 100% !important;justify-content:center;}
}
`;

/* GET /api/users row */
type ApiUser = { id: string; name: string; email: string; role: RoleKey; scope: Scope; privileges: PrivKey[]; expiresAt: string; active: boolean };

const AV_COLORS: [string, string][] = [['#273c33', '#2DFB91'], ['#E8F3EC', '#0D6C3B'], ['#EEF4F3', '#034956'], ['#FBF3E1', '#9A741C'], ['#EAF3F6', '#1E5AA8'], ['#F0ECF9', '#7A3FB0'], ['#F0EEE9', '#5F5A52']];

export function UsersBody() {
  const [view, setView] = React.useState<'users' | 'roles'>('users');
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadErr, setLoadErr] = React.useState('');
  const [editing, setEditing] = React.useState<string | null>(null); // email
  const [draft, setDraft] = React.useState<{ role: RoleKey; scope: Scope; privs: PrivKey[]; expires: string }>({ role: 'agent', scope: 'own', privs: [], expires: '' });
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteRole, setInviteRole] = React.useState<RoleKey>('agent');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteExpires, setInviteExpires] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [idByEmail, setIdByEmail] = React.useState<Record<string, string>>({});

  /* real users — GET /api/users (owner-only; other roles keep the demo rows) */
  const reload = React.useCallback(async () => {
    try {
      const r = await apiGet<{ items: ApiUser[] }>('/api/users');
      if (!Array.isArray(r.items)) return;
      setIdByEmail(Object.fromEntries(r.items.map((u) => [u.email, u.id])));
      setUsers(r.items.map((u, i) => {
        const [avBg, avFg] = AV_COLORS[i % AV_COLORS.length];
        return {
          name: u.name, email: u.email, initial: (u.name.trim()[0] || '?').toUpperCase(),
          avBg, avFg,
          role: u.role, scope: u.scope, privs: u.privileges,
          expires: u.expiresAt || undefined,
          lastLogin: '—', active: u.active,
        };
      }));
    } catch (e) {
      /* เดิมตกไปแสดงรายชื่อพนักงานสมมุติ — หน้าที่บอกว่าใครมีสิทธิ์ทำอะไรได้
         ต้องบอกว่าอ่านไม่ได้ ดีกว่าบอกชื่อคนที่ไม่มีตัวตน */
      setLoadErr(e instanceof ApiClientError ? e.message : 'อ่านรายชื่อผู้ใช้ไม่ได้');
    } finally { setLoaded(true); }
  }, []);
  React.useEffect(() => { void reload(); }, [reload]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const cur = users.find((u) => u.email === editing) || null;
  const draftRole = roleOf(draft.role);

  const openEdit = (u: UserRow) => {
    setDraft({ role: u.role, scope: u.scope, privs: [...u.privs], expires: u.expires || '' });
    setEditing(u.email);
  };
  // switching role resets scope + privileges to that role's sane defaults
  const pickRole = (k: RoleKey) => {
    const r = roleOf(k);
    setDraft((d) => ({ ...d, role: k, scope: r.defaultScope, privs: initialPrivs(k), expires: r.external ? d.expires : '' }));
  };
  const togglePriv = (p: PrivKey) => {
    if (!privAllowed(draft.role, p)) return;
    setDraft((d) => ({ ...d, privs: d.privs.includes(p) ? d.privs.filter((x) => x !== p) : [...d.privs, p] }));
  };
  /* PUT the permissions — the server re-validates FORBIDDEN_PRIVS, the scope
     lock and the co-agent expiry, so a rejection here is authoritative. */
  const saveEdit = async () => {
    if (!editing || saving) return;
    const id = idByEmail[editing];
    if (id) {
      setSaving(true);
      try {
        await apiPut(`/api/users/${id}/permissions`, {
          role: draft.role,
          scope: draft.scope,
          privileges: draft.privs,
          expiresAt: roleOf(draft.role).external ? draft.expires : '',
        });
      } catch (e) {
        window.alert(e instanceof ApiClientError ? e.message : 'บันทึกสิทธิ์ไม่สำเร็จ');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setUsers((list) => list.map((u) => (u.email === editing
      ? { ...u, role: draft.role, scope: draft.scope, privs: draft.privs, expires: roleOf(draft.role).external ? draft.expires || undefined : undefined }
      : u)));
    setEditing(null);
  };

  /* deactivating also kills that user's sessions server-side */
  const toggleActive = async (u: UserRow) => {
    const id = idByEmail[u.email];
    const next = !u.active;
    setUsers((list) => list.map((x) => (x.email === u.email ? { ...x, active: next } : x)));
    if (!id) return;
    try {
      await apiPatch(`/api/users/${id}/status`, { active: next });
    } catch (e) {
      setUsers((list) => list.map((x) => (x.email === u.email ? { ...x, active: u.active } : x)));
      window.alert(e instanceof ApiClientError ? e.message : 'เปลี่ยนสถานะไม่สำเร็จ');
    }
  };

  /* v1 has no mail transport — the API returns a one-time temp password
     for the owner to hand over in person (see /api/users/invite). */
  const sendInvite = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const r = await apiPost<{ tempPassword: string; email: string }>('/api/users/invite', {
        email: inviteEmail.trim(),
        role: inviteRole,
        expiresAt: roleOf(inviteRole).external ? inviteExpires : '',
      });
      window.alert(`สร้างบัญชี ${r.email} แล้ว\nรหัสผ่านชั่วคราว: ${r.tempPassword}\n(แสดงครั้งเดียว — กรุณาส่งให้ผู้ใช้และให้เปลี่ยนทันที)`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteExpires('');
      await reload();
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'เชิญผู้ใช้ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const summary = [
    { label: 'ผู้ใช้ทั้งหมด', value: String(users.length), color: 'var(--text)' },
    { label: 'ใช้งานอยู่', value: String(users.filter((u) => u.active).length), color: '#0D6C3B' },
    { label: 'บทบาท (roles)', value: String(ROLES.length), color: '#034956' },
    { label: 'เห็นข้อมูลทั้งหมด', value: String(users.filter((u) => u.scope === 'all').length), color: '#9A741C' },
  ];

  const viewTabs = ([['users', 'ผู้ใช้'], ['roles', 'สิทธิ์ (Roles)']] as const).map(([k, label]) => ({
    key: k, label, select: () => setView(k),
    style: { height: 32, padding: '0 16px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', border: 0, fontFamily: 'inherit', background: view === k ? '#273c33' : 'transparent', color: view === k ? '#fff' : 'var(--muted)' } as React.CSSProperties,
  }));

  const actions = (
    <div id="users-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {viewTabs.map((v) => <button type="button" key={v.key} onClick={v.select} style={v.style}>{v.label}</button>)}
      </div>
      <button type="button" id="users-invite" onClick={() => { setInviteRole('agent'); setInviteOpen(true); }} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', border: 0, fontFamily: 'inherit' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>เชิญผู้ใช้
      </button>
    </div>
  );

  return (
    <AdminShell active="settings" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'ผู้ใช้' }]} />} title="Users & Roles" actions={actions} css={USERS_CSS}>
      {/* ---------- USERS ---------- */}
      {view === 'users' && (
        <>
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            {summary.map((s) => (
              <div key={s.label} style={{ flex: 1, minWidth: 150, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
                <div style={{ marginTop: 4, fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }} className="a-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={thL}>ผู้ใช้</th>
                    <th style={thL}>บทบาท</th>
                    <th style={thL}>ขอบเขตข้อมูล</th>
                    <th style={thL}>สิทธิ์พิเศษ</th>
                    <th style={thC}>สถานะ</th>
                    <th style={{ padding: '12px 16px', width: 120 }} />
                  </tr>
                </thead>
                <tbody>
                  {loaded && !users.length && (
                    <tr><td colSpan={7} style={{ padding: '30px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted3)', lineHeight: 1.7 }}>
                      {loadErr
                        ? <>{loadErr} — หน้านี้เปิดได้เฉพาะเจ้าของระบบ (owner)</>
                        : <>ยังไม่มีผู้ใช้ในระบบ — กด “เชิญผู้ใช้” เพื่อเพิ่มคนแรก</>}
                    </td></tr>
                  )}
                  {users.map((u) => {
                    const r = roleOf(u.role);
                    return (
                      <tr key={u.email} className="users-row" style={{ borderTop: '1px solid var(--border)', transition: 'background .15s' }}>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 9999, background: u.avBg, color: u.avFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{u.initial}</div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{u.name}</div>
                              <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ height: 21, padding: '0 9px', borderRadius: 6, background: r.badge.bg, color: r.badge.fg, fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>{r.label}</span>
                          {u.expires && <div style={{ marginTop: 3, fontSize: 10.5, color: '#9A741C', fontWeight: 700 }}>หมดอายุ {u.expires}</div>}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px', fontWeight: 700, color: u.scope === 'all' ? '#9A741C' : 'var(--muted)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{u.scope === 'all' ? <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" /></> : <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>}</svg>
                            {scopeLabel(u.scope)}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          {u.privs.length === 0
                            ? <span style={{ fontSize: 12, color: 'var(--muted3)' }}>—</span>
                            : <span title={u.privs.map((p) => PRIVILEGES.find((x) => x.key === p)?.label).join(' · ')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 21, padding: '0 9px', borderRadius: 9999, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                                {u.privs.length} สิทธิ์
                              </span>}
                        </td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleActive(u)}
                            title={u.active ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                            style={{ ...(u.active ? STATUS_ON : STATUS_OFF), border: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {u.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                          </button>
                        </td>
                        <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                          <button type="button" className="users-edit" onClick={() => openEdit(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 13px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                            ตั้งค่าสิทธิ์
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---------- ROLES MATRIX ---------- */}
      {view === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>สิทธิ์ตามบทบาท (RBAC {ROLES.length} บทบาท)</div>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: 'var(--muted2)', maxWidth: '70ch' }}>
              บังคับที่ <b>API layer</b> ไม่ใช่แค่ซ่อน UI · สิทธิ์จริงของแต่ละคน = <b>บทบาท</b> + <b>ขอบเขตข้อมูล</b> + <b>สิทธิ์พิเศษ</b> ที่เปิดให้รายคน
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
              {(['yes', 'scope', 'read', 'priv', 'no'] as Cell[]).map((c) => (
                <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{CELL[c].node}<span>{CELL[c].title}</span></span>
              ))}
            </div>
          </div>

          {/* role cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
            {ROLES.map((r) => (
              <div key={r.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ height: 21, padding: '0 9px', borderRadius: 6, background: r.badge.bg, color: r.badge.fg, fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>{r.label}</span>
                  {r.external && <span style={{ fontSize: 10, fontWeight: 700, color: '#9A741C' }}>ภายนอก</span>}
                </div>
                <div style={{ marginTop: 7, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.55 }}>{r.desc}</div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--rule,var(--border))', fontSize: 11, color: 'var(--muted3)' }}>
                  เทียบสากล: {r.intl}<br />ขอบเขตเริ่มต้น: <b>{scopeLabel(r.defaultScope)}</b>{r.scopeLocked ? ' (แก้ไม่ได้)' : ''}
                </div>
              </div>
            ))}
          </div>

          {/* matrix per group */}
          {MATRIX.map((g) => (
            <div key={g.group} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 4, height: 15, borderRadius: 3, background: '#0D6C3B' }} />
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{g.group}</h4>
              </div>
              <div className="a-scroll" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: 'var(--muted2)', position: 'sticky', left: 0, background: 'var(--surface)', minWidth: 210 }}>การกระทำ</th>
                      {ROLES.map((r) => <th key={r.key} style={{ padding: '10px 6px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text)', minWidth: 86 }}>{r.short}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((m) => (
                      <tr key={m.action} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '11px 12px', position: 'sticky', left: 0, background: 'var(--surface)' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{m.action}</div>
                          {m.note && <div style={{ marginTop: 2, fontSize: 10.5, color: 'var(--muted3)' }}>{m.note}</div>}
                        </td>
                        {ROLES.map((r) => {
                          const c = m.cells[r.key];
                          return <td key={r.key} title={CELL[c].title} style={{ padding: '11px 6px', textAlign: 'center' }}>{CELL[c].node}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- PER-USER PERMISSION DIALOG ---------- */}
      {cur && (
        <div id="perm-overlay" onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div id="perm-modal" onClick={stop} style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ตั้งค่าสิทธิ์ · {cur.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{cur.email}</div>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="ปิด" style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* role */}
              <div>
                <label style={fieldLabel}>บทบาท</label>
                <div id="perm-roles" role="radiogroup" aria-label="บทบาท" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
                  {ROLES.map((r) => {
                    const on = draft.role === r.key;
                    return (
                      <button type="button" key={r.key} onClick={() => pickRole(r.key)} aria-pressed={on} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.05)' : 'var(--surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 15, height: 15, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--muted3)') }}>{on && <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#0D6C3B' }} />}</span>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: on ? '#0D6C3B' : 'var(--text)' }}>{r.label}</span>
                        </div>
                        <div style={{ marginTop: 4, marginLeft: 22, fontSize: 10.5, color: 'var(--muted3)', lineHeight: 1.45 }}>{r.intl}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 7, fontSize: 11, color: 'var(--muted3)' }}>{draftRole.desc}</div>
              </div>

              {/* scope */}
              <div>
                <label style={fieldLabel}>ขอบเขตข้อมูล — เห็นข้อมูลของใครบ้าง</label>
                <div id="perm-scope" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['own', 'all'] as Scope[]).map((s) => {
                    const on = draft.scope === s;
                    const locked = !!draftRole.scopeLocked;
                    return (
                      <button type="button" key={s} disabled={locked} onClick={() => setDraft((d) => ({ ...d, scope: s }))} aria-pressed={on} style={{ flex: '1 1 auto', minWidth: 150, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, fontSize: '12.5px', fontWeight: 700, cursor: locked ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: locked && !on ? 0.45 : 1, border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}>
                        {scopeLabel(s)}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: draftRole.scopeLocked ? '#9A741C' : 'var(--muted3)', lineHeight: 1.5 }}>
                  {draftRole.scopeLocked
                    ? `บทบาทนี้ล็อกไว้ที่ "${scopeLabel(draftRole.defaultScope)}" เปลี่ยนไม่ได้`
                    : draft.scope === 'own'
                      ? 'เห็นเฉพาะ lead / ดีล / นัดชม ที่ตัวเองเป็นเจ้าของหรือได้รับมอบหมาย'
                      : 'เห็นข้อมูลลูกค้าและดีลของทุกคนในบริษัท'}
                </div>
              </div>

              {/* expiry for external */}
              {draftRole.external && (
                <div>
                  <label style={fieldLabel}>วันหมดอายุการเข้าถึง <span style={{ color: '#C0392B' }}>*</span></label>
                  <input id="perm-expires" type="date" value={draft.expires} onChange={(e) => setDraft((d) => ({ ...d, expires: e.target.value }))} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                  <div style={{ marginTop: 6, fontSize: 11, color: '#9A741C' }}>บุคคลภายนอก — ระบบจะตัดสิทธิ์อัตโนมัติเมื่อถึงวันที่กำหนด</div>
                </div>
              )}

              {/* privileges */}
              <div>
                <label style={fieldLabel}>สิทธิ์พิเศษ (เปิดให้เป็นรายคน)</label>
                <div id="perm-privs" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PRIVILEGES.map((p) => {
                    const allowed = privAllowed(draft.role, p.key);
                    const on = draft.privs.includes(p.key);
                    return (
                      <button type="button" key={p.key} role="checkbox" aria-checked={on} aria-label={p.label} disabled={!allowed} onClick={() => togglePriv(p.key)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', padding: '10px 12px', borderRadius: 11, cursor: allowed ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: allowed ? 1 : 0.45, border: '1px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.04)' : 'var(--bg)' }}>
                        <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? '#0D6C3B' : 'transparent' }}>
                          {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{p.label}</span>
                          <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, color: 'var(--muted3)', lineHeight: 1.5 }}>{allowed ? p.desc : `บทบาท "${draftRole.label}" ให้สิทธิ์นี้ไม่ได้`}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setEditing(null)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>ยกเลิก</button>
              <button type="button" id="perm-save" onClick={saveEdit} style={{ height: 42, padding: '0 24px', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>บันทึกสิทธิ์</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- INVITE ---------- */}
      {inviteOpen && (
        <div onClick={() => setInviteOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 810, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>เชิญผู้ใช้ใหม่</div>
              <button type="button" onClick={() => setInviteOpen(false)} aria-label="ปิด" style={{ width: 30, height: 30, borderRadius: 9999, background: 'var(--tint)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <label style={{ ...fieldLabel, marginTop: 18 }}>อีเมล</label>
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@jkp.co" style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--bg)', outline: 'none', fontFamily: 'inherit' }} />
            {roleOf(inviteRole).external && (
              <>
                <label style={{ ...fieldLabel, marginTop: 16 }}>วันหมดอายุ (บังคับสำหรับบุคคลภายนอก)</label>
                <input type="date" value={inviteExpires} onChange={(e) => setInviteExpires(e.target.value)} style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--bg)', outline: 'none', fontFamily: 'inherit' }} />
              </>
            )}
            <label style={{ ...fieldLabel, marginTop: 16 }}>บทบาท (เลือก 1)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLES.map((r) => {
                const on = inviteRole === r.key;
                return <button type="button" key={r.key} onClick={() => setInviteRole(r.key)} aria-pressed={on} style={{ height: 34, padding: '0 13px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'transparent', color: on ? '#0D6C3B' : 'var(--text)' }}>{r.label}</button>;
              })}
            </div>
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 11, background: 'var(--bg)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.55 }}>
              ขอบเขตเริ่มต้น: <b>{scopeLabel(roleOf(inviteRole).defaultScope)}</b> · สิทธิ์พิเศษเริ่มต้น: <b>{initialPrivs(inviteRole).length}</b> รายการ — ปรับได้ภายหลังที่ปุ่ม “ตั้งค่าสิทธิ์”
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setInviteOpen(false)} style={{ height: 44, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>ยกเลิก</button>
              <button type="button" onClick={sendInvite} disabled={saving} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>{saving ? 'กำลังส่ง…' : 'ส่งคำเชิญ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
