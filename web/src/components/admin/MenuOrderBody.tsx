'use client';

/* จัดลำดับเมนูประเภททรัพย์บนแถบบนสุด
 *
 * ลูกค้าขอ "ตัว setup เรียงลำดับเมนูที่หลังบ้าน" (สไลด์ 5) — ลำดับเคยเขียน
 * ตายตัวอยู่ในโค้ด อยากสลับต้องรอรอบ deploy
 *
 * ใช้ปุ่มขึ้น/ลง ไม่ใช่การลาก เพราะรายการมีสี่อันและปุ่มกดได้ด้วยคีย์บอร์ด
 * ตั้งแต่แรกโดยไม่ต้องเขียนอะไรเพิ่ม — การลากบนมือถือก็พลาดง่ายกว่า
 */
import * as React from 'react';
import { apiGet, apiPut, ApiClientError } from '@/lib/apiClient';
import { TYPE_MENUS, orderMenus } from '@/lib/navMenus';
import { useDict } from '@/i18n/useDict';
import { AdminShell } from './AdminShell';

export function MenuOrderBody() {
  const d = useDict();
  const [keys, setKeys] = React.useState<string[]>(TYPE_MENUS.map((m) => m.key));
  const [saved, setSaved] = React.useState<string[]>(TYPE_MENUS.map((m) => m.key));
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    apiGet<{ order: string[] }>('/api/nav-menu')
      .then((r) => {
        const next = orderMenus(r.order ?? []).map((m) => m.key);
        setKeys(next);
        setSaved(next);
      })
      .catch(() => { /* ใช้ลำดับตั้งต้น */ });
  }, []);

  const label = (key: string) => {
    const m = TYPE_MENUS.find((x) => x.key === key);
    return m ? m.label(d) : key;
  };
  const dirty = keys.join('|') !== saved.join('|');

  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= keys.length) return;
    setKeys((cur) => {
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await apiPut('/api/nav-menu', { order: keys });
      setSaved(keys);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : 'บันทึกลำดับเมนูไม่สำเร็จ');
    }
    setBusy(false);
  };

  const btn = (on: boolean): React.CSSProperties => ({
    width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)',
    background: 'var(--surface)', color: on ? 'var(--text)' : 'var(--muted3)',
    cursor: on ? 'pointer' : 'default', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: 'inherit', flexShrink: 0,
  });

  return (
    <AdminShell active="settings" eyebrow="Settings / เมนู" title="ลำดับเมนู">
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>ลำดับเมนูบนแถบบนสุด</div>
        <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.7 }}>
          ลำดับนี้ใช้กับแถบบนของทุกหน้าบนเว็บ — หน้าแรก หน้ารายการ หน้าทรัพย์ และหน้าเนื้อหา
          ทั้งบนจอใหญ่และในลิ้นชักมือถือ
        </p>

        <div id="nav-order" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {keys.map((key, i) => (
            <div
              key={key}
              data-nav-item={key}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg)' }}
            >
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--muted3)', width: 18 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{label(key)}</span>
              <button type="button" data-nav-up={key} aria-label={`ย้าย ${label(key)} ขึ้น`} disabled={i === 0} onClick={() => move(i, -1)} style={btn(i > 0)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button type="button" data-nav-down={key} aria-label={`ย้าย ${label(key)} ลง`} disabled={i === keys.length - 1} onClick={() => move(i, 1)} style={btn(i < keys.length - 1)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>
          ))}
        </div>

        {err && <div data-nav-err style={{ marginTop: 12, fontSize: 12.5, color: '#C0392B' }}>{err}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
          <button
            type="button" id="nav-save" onClick={save} disabled={!dirty || busy}
            style={{ height: 40, padding: '0 20px', borderRadius: 9999, border: 0, background: dirty && !busy ? '#0D6C3B' : 'var(--border)', color: dirty && !busy ? '#fff' : 'var(--muted3)', fontSize: 13, fontWeight: 700, cursor: dirty && !busy ? 'pointer' : 'default', fontFamily: 'inherit' }}
          >
            {busy ? 'กำลังบันทึก…' : done ? 'บันทึกแล้ว' : 'บันทึกลำดับ'}
          </button>
          {dirty && (
            <button type="button" onClick={() => setKeys(saved)} style={{ height: 40, padding: '0 16px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ย้อนกลับ
            </button>
          )}
        </div>
      </div>
    </div>
    </AdminShell>
  );
}
