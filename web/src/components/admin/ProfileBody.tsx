'use client';

/* โปรไฟล์ของฉัน + สมุดรายชื่อทีม
 *
 * สไลด์ 45 · "ไม่มีหน้าที่ใส่ข้อมูลโปรไฟล์ของฉัน ควรตั้งชื่อได้ เบอร์โทร LINE
 * ที่อยู่ปัจจุบัน" และ "ไม่มีหน้าแสดงต่อ ข้อมูลติดต่อและตำแหน่งคนในทีม"
 *
 * เดิมแก้ข้อมูลตัวเองไม่ได้เลย มีแต่หน้าเปลี่ยนรหัสผ่าน ชื่อกับเบอร์ต้องรอให้
 * เจ้าของระบบแก้ให้จากหน้า Users ซึ่งคนอื่นเปิดไม่ได้ และไม่มีที่ไหนดูได้ว่าใน
 * ทีมมีใครบ้าง ตำแหน่งอะไร ติดต่อยังไง
 *
 * สองเรื่องนี้อยู่หน้าเดียวกันเพราะเป็นคำถามเดียวกันคนละด้าน — "ข้อมูลติดต่อของ
 * ฉัน" กับ "ข้อมูลติดต่อของคนอื่น"
 */
import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { apiGet, apiPatch, ApiClientError } from '@/lib/apiClient';
import { role as roleDef, type RoleKey } from '@/lib/rbac';
import Link from 'next/link';

type Me = { id: string; name: string; email: string; role: string; phone: string; line: string; address: string };
type Mate = Me & { me: boolean };

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22,
};
const label: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--muted2)' };
const input: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 13px', borderRadius: 11,
  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
  fontFamily: 'inherit', fontSize: '13.5px', outline: 'none',
};

const roleBadge = (k: string) => {
  const r = roleDef(k as RoleKey);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 21, padding: '0 9px', borderRadius: 9999, background: r.badge.bg, color: r.badge.fg, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {r.label}
    </span>
  );
};

/** ค่าที่ยังไม่ได้กรอก — บอกตรง ๆ ว่ายังไม่มี ดีกว่าเว้นว่างจนดูเหมือนหน้าพัง */
const orDash = (v: string) => (v.trim() ? v : '—');

export function ProfileBody() {
  const [me, setMe] = React.useState<Me | null>(null);
  const [form, setForm] = React.useState({ name: '', phone: '', line: '', address: '' });
  const [team, setTeam] = React.useState<Mate[] | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [err, setErr] = React.useState('');
  const [loadErr, setLoadErr] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const u = await apiGet<Me>('/api/me');
      setMe(u);
      setForm({ name: u.name, phone: u.phone, line: u.line, address: u.address });
    } catch (e) {
      setLoadErr(e instanceof ApiClientError ? e.message : 'อ่านข้อมูลโปรไฟล์ไม่ได้');
    }
    try {
      const r = await apiGet<{ items: Mate[] }>('/api/team');
      setTeam(r.items);
    } catch { setTeam([]); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      const u = await apiPatch<Me>('/api/me', form);
      setMe(u);
      /* รายชื่อทีมโหลดใหม่ด้วย — ชื่อกับเบอร์ที่เพิ่งแก้ต้องเปลี่ยนตามในตาราง
         ข้างล่างทันที ไม่ใช่รอรีเฟรชหน้า */
      setTeam((list) => (list ?? []).map((m) => (m.me ? { ...m, ...u, me: true } : m)));
      setMsg('บันทึกแล้ว');
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    }
    setSaving(false);
  };

  const dirty = !!me && (
    form.name !== me.name || form.phone !== me.phone || form.line !== me.line || form.address !== me.address
  );

  return (
    <AdminShell
      active="settings"
      eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'โปรไฟล์ของฉัน' }]} />}
      title="โปรไฟล์ของฉัน"
    >
      {loadErr && (
        <div style={{ ...card, borderColor: '#C0392B', color: '#C0392B', marginBottom: 16, fontSize: 13 }}>{loadErr}</div>
      )}

      <div id="prof-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* ---- ข้อมูลของฉัน ---- */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ข้อมูลติดต่อของฉัน</div>
          <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.7 }}>
            ชื่อนี้คือชื่อที่คนอื่นเห็นในช่อง “มอบหมาย” และในประวัติการทำงาน
            ส่วนเบอร์กับ LINE ใช้ให้คนในทีมติดต่อกันเอง ไม่ได้ออกไปหน้าเว็บสาธารณะ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="prof-name" style={label}>ชื่อ–นามสกุล</label>
              <input id="prof-name" data-prof-name value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="เช่น กิตติพงษ์ พรหมทอง" style={input} />
            </div>
            <div>
              <label htmlFor="prof-phone" style={label}>เบอร์โทร</label>
              <input id="prof-phone" data-prof-phone value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08x-xxx-xxxx" style={input} />
            </div>
            <div>
              <label htmlFor="prof-line" style={label}>LINE ID</label>
              <input id="prof-line" data-prof-line value={form.line} onChange={(e) => set('line', e.target.value)} placeholder="เช่น @jkp-top" style={input} />
            </div>
            <div>
              <label htmlFor="prof-address" style={label}>ที่อยู่ปัจจุบัน</label>
              <textarea
                id="prof-address"
                data-prof-address
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด"
                style={{ ...input, height: 78, padding: '10px 13px', resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              id="prof-save"
              onClick={save}
              disabled={!dirty || saving}
              style={{ height: 44, padding: '0 22px', borderRadius: 11, border: 0, background: dirty && !saving ? '#0D6C3B' : 'var(--border)', color: dirty && !saving ? '#fff' : 'var(--muted2)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: dirty && !saving ? 'pointer' : 'default' }}
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
            {msg && <span data-prof-msg style={{ fontSize: 12.5, fontWeight: 700, color: '#0D6C3B' }}>{msg}</span>}
            {err && <span data-prof-err style={{ fontSize: 12.5, color: '#C0392B' }}>{err}</span>}
          </div>

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              {me ? <>อีเมล <b style={{ color: 'var(--text)' }}>{me.email}</b> · ตำแหน่ง </> : 'กำลังโหลด…'}
              {me && roleBadge(me.role)}
            </div>
            <Link href="/admin/change-password" style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)' }}>เปลี่ยนรหัสผ่าน →</Link>
          </div>
          {/* อีเมลกับตำแหน่งแก้เองไม่ได้ — ตำแหน่งเป็นเรื่องสิทธิ์ ต้องให้เจ้าของระบบตั้ง */}
          <p style={{ margin: '10px 0 0', fontSize: 11.5, color: 'var(--muted3)', lineHeight: 1.6 }}>
            อีเมลและตำแหน่งแก้เองไม่ได้ — ตำแหน่งเป็นตัวกำหนดสิทธิ์ ต้องให้เจ้าของระบบเปลี่ยนให้ที่หน้า Users
          </p>
        </div>

        {/* ---- คนในทีม ---- */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>คนในทีม</div>
          <p style={{ margin: '6px 0 14px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.7 }}>
            เฉพาะบัญชีที่ยังใช้งานอยู่ · ข้อมูลที่แต่ละคนกรอกไว้เองในหน้านี้
          </p>

          {team === null ? (
            <div style={{ fontSize: 13, color: 'var(--muted3)' }}>กำลังโหลด…</div>
          ) : team.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted3)' }}>ยังไม่มีบัญชีอื่นในระบบ</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {team.map((m) => (
                <div
                  key={m.id}
                  data-team-row={m.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, background: m.me ? 'var(--tint)' : 'var(--bg)', border: '1px solid ' + (m.me ? 'var(--accent)' : 'transparent') }}
                >
                  <span style={{ width: 34, height: 34, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                    {(m.name.trim()[0] || '?').toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b style={{ fontSize: '13.5px', color: 'var(--text)' }}>{m.name}</b>
                      {m.me && <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent)' }}>(คุณ)</span>}
                      {roleBadge(m.role)}
                    </div>
                    <div style={{ marginTop: 4, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.8, overflowWrap: 'anywhere' }}>
                      โทร <b style={{ color: 'var(--text)' }}>{orDash(m.phone)}</b>
                      {' · '}LINE <b style={{ color: 'var(--text)' }}>{orDash(m.line)}</b>
                      <br />
                      {m.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
