'use client';

/* ผู้ดูแลทรัพย์ และการโอนสิทธิ์
 *
 * สไลด์ 46 · "เจ้าของสามารถโอนสิทธิ์ Property ได้ · เตรียมไว้คนลาออก"
 *
 * คอลัมน์ ownerId มีมาตั้งแต่แรกและตั้งให้คนสร้างตอนสร้าง แต่หน้าไหนก็ไม่เคย
 * แสดงและไม่เคยมีทางแก้ — ทรัพย์รู้ว่าใครเป็นเจ้าของแต่ไม่มีใครเห็น และวันที่
 * คนดูแลลาออก ทรัพย์จะค้างอยู่กับบัญชีที่ปิดไปแล้ว
 *
 * ทุกคนเห็นว่าใครดูแลอยู่ · เฉพาะเจ้าของระบบที่โอนได้ ตามที่สไลด์เขียน
 */
import * as React from 'react';
import Link from 'next/link';
import { apiGet, apiPatch, ApiClientError } from '@/lib/apiClient';

type Person = { id: string; name: string; role: string };

export function OwnerTransfer({ propertyId, ownerId, ownerName }: {
  propertyId: string;
  ownerId: string | null;
  ownerName: string;
}) {
  const [me, setMe] = React.useState<{ role: string } | null>(null);
  const [people, setPeople] = React.useState<Person[] | null>(null);
  const [pick, setPick] = React.useState('');
  const [current, setCurrent] = React.useState(ownerName);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    apiGet<{ role: string }>('/api/me/permissions').then(setMe).catch(() => setMe(null));
  }, []);

  const canTransfer = me?.role === 'owner';

  React.useEffect(() => {
    if (!canTransfer) return;
    apiGet<{ items: Person[] }>('/api/users/assignable')
      .then((r) => setPeople(r.items.filter((u) => u.id !== ownerId)))
      .catch(() => setPeople([]));
  }, [canTransfer, ownerId]);

  const transfer = async () => {
    if (!pick || busy) return;
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await apiPatch(`/api/properties/${propertyId}`, { ownerId: pick });
      setCurrent(people?.find((p) => p.id === pick)?.name ?? '—');
      setPick('');
      setMsg('โอนแล้ว');
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : 'โอนไม่สำเร็จ');
    }
    setBusy(false);
  };

  return (
    <div data-owner-card>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>ผู้ดูแลทรัพย์</div>
      <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
        คนที่สร้างและดูแลทรัพย์นี้ —{' '}
        <b data-owner-name style={{ color: 'var(--text)' }}>{current || 'ยังไม่ระบุ'}</b>
      </div>

      {canTransfer && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="pv-owner" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted2)' }}>โอนให้คนอื่นดูแล</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              id="pv-owner"
              data-owner-pick
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              disabled={!people?.length}
              style={{ flex: 1, minWidth: 0, height: 38, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '12.5px' }}
            >
              <option value="">{people?.length ? 'เลือกผู้รับโอน…' : 'ไม่มีคนอื่นให้โอน'}</option>
              {(people ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button
              type="button"
              data-owner-go
              onClick={transfer}
              disabled={!pick || busy}
              style={{ height: 38, padding: '0 14px', borderRadius: 10, border: 0, background: pick && !busy ? '#0D6C3B' : 'var(--border)', color: pick && !busy ? '#fff' : 'var(--muted2)', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: pick && !busy ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
            >
              {busy ? 'กำลังโอน…' : 'โอนสิทธิ์'}
            </button>
          </div>
          {msg && <span data-owner-msg style={{ fontSize: 11.5, color: '#0D6C3B', fontWeight: 700 }}>{msg}</span>}
          {err && <span data-owner-err style={{ fontSize: 11.5, color: '#C0392B' }}>{err}</span>}
          {/* คนลาออกทีเดียวมีทรัพย์เป็นร้อย โอนทีละใบไม่ไหว */}
          <Link href="/admin/users" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent)' }}>โอนทรัพย์ทั้งหมดของคนหนึ่ง (หน้า Users) →</Link>
        </div>
      )}
    </div>
  );
}
