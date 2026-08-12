'use client';

import * as React from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiGet, ApiClientError } from '@/lib/apiClient';

/* The Requirements queue.
 *
 * There was no list screen at all — /admin/requirements went straight to a
 * hardcoded detail mock-up of one imaginary enquiry, so there was no way to see
 * how many were waiting or open a particular one. */

type Row = {
  id: string; code: string; status: string; statusLabel: string;
  leadName: string; company: string;
  dealIntent: string; typeKey: string; usage: string;
  areaMin: number | null; areaMax: number | null;
  budgetMin: number | null; budgetMax: number | null;
  moveIn: number | null;
  needsRor4: boolean;
  locations: { name: string }[];
  checkCount: number; shortlistCount: number;
  createdAt: number;
};

const FILTERS = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'submitted', label: 'รอตรวจสอบ' },
  { key: 'confirmed', label: 'ยืนยันแล้ว' },
  { key: 'shortlisted', label: 'ส่ง shortlist แล้ว' },
  { key: 'cancelled', label: 'ยกเลิก' },
];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  submitted: { bg: '#FBF3E1', fg: '#9A741C' },
  confirmed: { bg: '#E8F3EC', fg: '#0D6C3B' },
  shortlisted: { bg: '#E7F0FB', fg: '#1F5FA8' },
  cancelled: { bg: '#FBEEEC', fg: '#A32A2A' },
};

const pill = (bg: string, fg: string): React.CSSProperties => ({
  height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg,
  fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0,
});

const nf = new Intl.NumberFormat('en-US');
const fmtRange = (a: number | null, b: number | null, unit: string) => {
  if (a === null && b === null) return '—';
  if (a !== null && b !== null) return `${nf.format(a)} – ${nf.format(b)} ${unit}`;
  return `${nf.format((a ?? b)!)} ${unit}`;
};
const fmtDate = (ms: number) =>
  new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms));

const listCss = `
@media (max-width:900px){ #req-list-head{display:none !important;} .req-row{grid-template-columns:1fr !important;row-gap:8px;} }
.req-row:hover{background:var(--tint);}
`;

export function RequirementsListBody() {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [status, setStatus] = React.useState('');
  const [q, setQ] = React.useState('');
  const [err, setErr] = React.useState('');

  const load = React.useCallback((s: string, query: string) => {
    const qs = new URLSearchParams();
    if (s) qs.set('status', s);
    if (query.trim()) qs.set('q', query.trim());
    apiGet<{ items: Row[]; counts: Record<string, number> }>(`/api/requirements?${qs}`)
      .then((r) => { setRows(r.items ?? []); setCounts(r.counts ?? {}); setErr(''); })
      .catch((e) => { setRows([]); setErr(e instanceof ApiClientError ? e.message : 'โหลดรายการไม่สำเร็จ'); });
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(status, q), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [status, q, load]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <AdminShell active="requirements" eyebrow="งานขาย / Requirements" title="Requirements" css={listCss}>
      {/* filter chips — counted from the table, not written in */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const on = status === f.key;
          const n = f.key ? counts[f.key] ?? 0 : total;
          return (
            <div
              key={f.key || 'all'}
              data-filter={f.key || 'all'}
              onClick={() => setStatus(f.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 15px', borderRadius: 9999, cursor: 'pointer', fontSize: 13, fontWeight: on ? 700 : 600, background: on ? '#273c33' : 'var(--surface)', color: on ? '#fff' : 'var(--muted)', border: '1px solid ' + (on ? '#273c33' : 'var(--border)') }}
            >
              {f.label}
              <span style={{ height: 19, minWidth: 19, padding: '0 6px', borderRadius: 9999, background: on ? 'rgba(255,255,255,.18)' : 'var(--bg)', color: on ? '#fff' : 'var(--muted2)', fontSize: '10.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
            </div>
          );
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginLeft: 'auto', minWidth: 220 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            id="req-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหารหัส / ชื่อ / บริษัท"
            style={{ border: 0, outline: 'none', background: 'transparent', fontSize: '12.5px', color: 'var(--text)', flex: 1, minWidth: 0 }}
          />
        </div>
      </div>

      {err && (
        <div style={{ padding: '12px 14px', borderRadius: 11, background: '#FDECEC', color: '#A32A2A', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{err}</div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div id="req-list-head" style={{ display: 'grid', gridTemplateColumns: '150px 1fr 170px 190px 120px 110px', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', fontSize: 11, fontWeight: 800, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          <span>รหัส</span><span>ลูกค้า</span><span>ขนาด</span><span>งบ</span><span>สถานะ</span><span>เช็คว่าง</span>
        </div>

        {rows === null && (
          <div style={{ padding: '40px 18px', textAlign: 'center', fontSize: 13, color: 'var(--muted3)' }}>กำลังโหลด…</div>
        )}

        {rows?.length === 0 && (
          <div style={{ padding: '48px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
              {q || status ? 'ไม่พบรายการที่ตรงกับที่ค้นหา' : 'ยังไม่มี requirement'}
            </div>
            <div style={{ marginTop: 6, fontSize: '12.5px', color: 'var(--muted)' }}>
              {q || status
                ? 'ลองเปลี่ยนคำค้นหรือกดดูทั้งหมด'
                : 'ความต้องการที่ลูกค้าส่งผ่านฟอร์มหน้าเว็บจะเข้ามาที่นี่'}
            </div>
          </div>
        )}

        {rows?.map((r) => {
          const st = STATUS_STYLE[r.status] ?? { bg: 'var(--bg)', fg: 'var(--muted2)' };
          return (
            <Link
              key={r.id}
              href={`/admin/requirements/${r.id}`}
              className="req-row"
              style={{ display: 'grid', gridTemplateColumns: '150px 1fr 170px 190px 120px 110px', gap: 12, alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
            >
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12.5px', fontWeight: 700, color: '#0D6C3B' }}>{r.code}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{fmtDate(r.createdAt)}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.company || r.leadName || '—'}</div>
                <div style={{ marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {r.dealIntent && <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{r.dealIntent}</span>}
                  {r.usage && <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>· {r.usage}</span>}
                  {r.needsRor4 && <span style={pill('#EEF4F3', '#034956')}>ต้องมี ร.ง.4</span>}
                  {r.locations[0] && <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>· {r.locations[0].name}</span>}
                </div>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtRange(r.areaMin, r.areaMax, 'ตร.ม.')}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtRange(r.budgetMin, r.budgetMax, r.dealIntent.includes('เช่า') ? '฿/ด.' : '฿')}</div>
              <div><span style={pill(st.bg, st.fg)}>{r.statusLabel}</span></div>
              <div style={{ fontSize: '12px', color: 'var(--muted2)' }}>
                {r.checkCount ? `${r.checkCount} ทรัพย์` : '—'}
                {r.shortlistCount > 0 && <span style={{ display: 'block', fontSize: '10.5px', color: '#1F5FA8' }}>shortlist {r.shortlistCount}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
