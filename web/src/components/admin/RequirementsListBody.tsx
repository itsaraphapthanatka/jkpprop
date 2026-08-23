'use client';

import * as React from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, ApiClientError } from '@/lib/apiClient';

/* The Requirements queue.
 *
 * There was no list screen at all — /admin/requirements went straight to a
 * hardcoded detail mock-up of one imaginary enquiry, so there was no way to see
 * how many were waiting or open a particular one. */

type Row = {
  id: string; code: string; status: string; statusLabel: string;
  leadName: string; company: string;
  dealIntent: string; typeKey: string; typeLabel: string; usage: string; businessType: string;
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
#req-list-scroll{overflow-x:auto;}
#req-list-head,.req-row{min-width:1130px;}
@media (max-width:900px){
  #req-list-head{display:none !important;}
  .req-row{grid-template-columns:1fr !important;row-gap:8px;min-width:0;}
  #req-list-scroll{overflow-x:visible;}
}
.req-row:hover{background:var(--tint);}
`;

type LeadOption = { id: string; name: string; company: string | null };

/* เด็ค Web 2026 ข้อ 15 · ลูกค้าขอสามคอลัมน์ที่ต้องเห็นจากตาราง — ทำเล ·
   ประเภทสินค้าและธุรกิจ · ประเภทการใช้งาน เดิมสองในสามยัดเป็นตัวจิ๋วใต้ชื่อ
   ลูกค้าจนอ่านไม่ออก และอีกอันไม่มีเลย
   กว้างรวมเกินจอแคบ จึงให้ตารางเลื่อนแนวนอนในกล่องตัวเอง ไม่ใช่ให้ทั้งหน้าเลื่อน */
const COLS = '112px minmax(130px,1fr) 118px 132px 126px 118px 132px 100px 84px';

export function RequirementsListBody() {
  const router = useRouter();
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [status, setStatus] = React.useState('');
  const [q, setQ] = React.useState('');
  const [err, setErr] = React.useState('');

  /* Requirements arriving by phone had nowhere to go: POST /api/requirements
     worked from the first release and no button called it, so the only way in
     was the public form. */
  const [newOpen, setNewOpen] = React.useState(false);
  const [leads, setLeads] = React.useState<LeadOption[]>([]);
  const [leadQ, setLeadQ] = React.useState('');
  const [leadId, setLeadId] = React.useState('');
  const [dealIntent, setDealIntent] = React.useState('เช่า');
  const [newErr, setNewErr] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const openNew = () => {
    setNewErr('');
    setLeadId('');
    setLeadQ('');
    setNewOpen(true);
    apiGet<{ items: LeadOption[] }>('/api/leads')
      .then((r) => setLeads(r.items ?? []))
      .catch(() => setLeads([]));
  };

  const createRequirement = () => {
    if (!leadId) { setNewErr('เลือกลูกค้าก่อน'); return; }
    if (creating) return;
    setCreating(true);
    setNewErr('');
    apiPost<{ id: string }>('/api/requirements', { leadId, dealIntent })
      .then((r) => router.push(`/admin/requirements/${r.id}`))
      .catch((e) => setNewErr(e instanceof ApiClientError ? e.message : 'สร้างไม่สำเร็จ'))
      .finally(() => setCreating(false));
  };

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
        <div id="req-new-btn" onClick={openNew} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่ม requirement
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 220 }}>
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

      <div id="req-list-scroll" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <div id="req-list-head" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 10, padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', fontSize: 11, fontWeight: 800, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          <span>รหัส</span><span>ลูกค้า</span><span>ทำเล</span><span>ประเภทสินค้าและธุรกิจ</span>
          <span>ประเภทการใช้งาน</span><span>ขนาด</span><span>งบ</span><span>สถานะ</span><span>เช็คว่าง</span>
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
              style={{ display: 'grid', gridTemplateColumns: COLS, gap: 10, alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
            >
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12.5px', fontWeight: 700, color: '#0D6C3B' }}>{r.code}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{fmtDate(r.createdAt)}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.company || r.leadName || '—'}</div>
                {/* ทำเล · ธุรกิจ · การใช้งาน ย้ายออกไปเป็นคอลัมน์ของตัวเองแล้ว
                    เหลือไว้แค่สิ่งที่บอกตัวลูกค้าเอง */}
                <div style={{ marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {r.dealIntent && <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{r.dealIntent}</span>}
                  {r.typeLabel && <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>· {r.typeLabel}</span>}
                  {r.needsRor4 && <span style={pill('#EEF4F3', '#034956')}>ต้องมี ร.ง.4</span>}
                </div>
              </div>
              {/* ทำเลเรียงตามลำดับที่ลูกค้าอยากได้ อันแรกคืออันที่อยากได้ที่สุด
                  ที่เหลือบอกเป็นจำนวน ไม่งั้นแถวสูงไม่เท่ากันทั้งตาราง */}
              <div data-req-locations style={{ fontSize: '12px', color: 'var(--text)', minWidth: 0 }}>
                {r.locations.length === 0 ? <span style={{ color: 'var(--muted3)' }}>—</span> : (
                  <>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.locations[0].name}</span>
                    {r.locations.length > 1 && (
                      <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>+ อีก {r.locations.length - 1} ที่</span>
                    )}
                  </>
                )}
              </div>
              <div data-req-business style={{ fontSize: '12px', color: r.businessType ? 'var(--text)' : 'var(--muted3)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.businessType || '—'}
              </div>
              <div data-req-usage style={{ fontSize: '12px', color: r.usage ? 'var(--text)' : 'var(--muted3)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.usage || '—'}
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

      {/* NEW REQUIREMENT — for an enquiry that arrived by phone */}
      {newOpen && (
        <div onClick={() => setNewOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 860, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>เพิ่ม requirement</div>
            <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              เลือกลูกค้าที่มีอยู่แล้ว — สร้างเสร็จค่อยกรอกงบ ขนาด ทำเล ในหน้าถัดไป
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ต้องการ</label>
            <div style={{ marginTop: 6, marginBottom: 14, display: 'flex', gap: 8 }}>
              {['เช่า', 'ขาย'].map((v) => {
                const on = dealIntent === v;
                return (
                  <div key={v} data-intent={v} onClick={() => setDealIntent(v)} style={{ flex: 1, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: on ? 800 : 600, cursor: 'pointer', background: on ? '#E8F3EC' : 'var(--bg)', color: on ? '#0D6C3B' : 'var(--muted)', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)') }}>{v}</div>
                );
              })}
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ลูกค้า</label>
            <input
              id="req-new-leadq"
              value={leadQ}
              onChange={(e) => setLeadQ(e.target.value)}
              placeholder="ค้นหาชื่อ / บริษัท"
              style={{ marginTop: 6, width: '100%', height: 42, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }}
            />
            <div className="a-scroll" style={{ marginTop: 8, flex: 1, minHeight: 120, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leads.length === 0 && (
                <div style={{ padding: '18px 10px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)' }}>ยังไม่มีลูกค้าในระบบ — เพิ่มที่หน้า Leads ก่อน</div>
              )}
              {leads
                .filter((l) => {
                  const t = leadQ.trim().toLowerCase();
                  return !t || l.name.toLowerCase().includes(t) || (l.company ?? '').toLowerCase().includes(t);
                })
                .slice(0, 40)
                .map((l) => {
                  const on = leadId === l.id;
                  return (
                    <div key={l.id} data-lead={l.id} onClick={() => setLeadId(l.id)} style={{ padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: on ? 'rgba(13,108,59,.06)' : 'var(--bg)', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)') }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{l.company || l.name}</div>
                      {l.company && <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{l.name}</div>}
                    </div>
                  );
                })}
            </div>

            {newErr && <div id="req-new-error" style={{ marginTop: 12, padding: '9px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>{newErr}</div>}

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={() => setNewOpen(false)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="req-new-save" onClick={createRequirement} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: creating ? '#6E8C7C' : '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, cursor: creating ? 'default' : 'pointer' }}>{creating ? 'กำลังสร้าง…' : 'สร้าง'}</div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
