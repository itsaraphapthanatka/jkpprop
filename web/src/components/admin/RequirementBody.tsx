'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiGet, apiPatch, apiPost, apiDelete, ApiClientError } from '@/lib/apiClient';

/* Requirement detail — Flow B (SPEC_PACK §3.6).
 *
 * The layout is the one ported from AdminRequirement.dc.html, but everything
 * in it used to be a constant: REQ-1042, one imaginary customer, three
 * properties whose availability never changed, four criteria ticked in
 * advance. Cancel repainted the page and forgot on refresh; "เช็คทรัพย์ใหม่"
 * ran a fake scan; "สร้าง Shortlist" was a link that created nothing.
 *
 * Now: one requirement from the database, its real availability checks, and
 * the FR-AVL-04 gate enforced by the server when the shortlist is built.
 */

/** ทรัพย์ที่ระบบเสนอให้เช็ค — มาจาก /api/requirements/:id/candidates */
type Candidate = {
  id: string; code: string; title: string; typeLabel: string; province: string;
  area: number | null; price: number | null; img: string | null;
  available: boolean; contactName: string; contactPhone: string; contactCompany: string;
  alreadyChecked: boolean; misses: string[]; fit: boolean;
};

type Check = {
  img?: string | null; contactName?: string; contactPhone?: string;
  id: string; propertyId: string; code: string; title: string;
  area: number | null; location: string;
  result: string; stillActive: boolean; available: boolean;
  note: string; checkedAt: number;
};
type ShortlistRef = { id: string; name: string; status: string; count: number; url: string; createdAt: number };
type CancelField = { key: string; label: string };

type Detail = {
  id: string; code: string; status: string; statusLabel: string;
  leadId: string; leadName: string; company: string; leadStatus: string;
  leadPhone: string; leadEmail: string; leadWho: string;
  dealIntent: string; typeKey: string; usage: string;
  areaMin: number | null; areaMax: number | null;
  budgetMin: number | null; budgetMax: number | null;
  moveIn: number | null;
  needsRor4: boolean; nearPort: boolean; pollution: string; note: string;
  locations: { name: string }[];
  cancelReason: string; cancelField: string;
  checks: Check[];
  shortlists: ShortlistRef[];
  cancelFields: CancelField[];
};

const monoCode: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };
const circleBase: React.CSSProperties = { width: 34, height: 34, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };

const nf = new Intl.NumberFormat('en-US');
const fmtRange = (a: number | null, b: number | null, unit: string) => {
  if (a === null && b === null) return '—';
  if (a !== null && b !== null) return `${nf.format(a)} – ${nf.format(b)} ${unit}`;
  return `${nf.format((a ?? b)!)} ${unit}`;
};
const fmtDate = (ms: number | null) =>
  ms ? new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)) : '—';

const availOk: React.CSSProperties = { height: 22, padding: '0 10px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', flexShrink: 0 };
const availNo: React.CSSProperties = { height: 22, padding: '0 10px', borderRadius: 9999, background: 'rgba(255,255,255,.1)', color: '#F3B0A8', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0 };
const tagStyle = (bg: string, fg: string): React.CSSProperties => ({
  height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg,
  fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
});

const STATUS_CHIP: Record<string, { bg: string; fg: string }> = {
  submitted: { bg: '#FBF3E1', fg: '#9A741C' },
  confirmed: { bg: '#E8F3EC', fg: '#0D6C3B' },
  shortlisted: { bg: '#E7F0FB', fg: '#1F5FA8' },
  cancelled: { bg: '#F9E4E1', fg: '#C0392B' },
};

const reqCss = `
@keyframes spin{to{transform:rotate(360deg);}}
@media (max-width:1100px){ #req-split{grid-template-columns:1fr !important;} }
@media (max-width:640px){ #req-fields{grid-template-columns:1fr !important;} }
.req-shortlist-card:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(13,108,59,.18);}
`;

/* the rail mirrors the requirement's own status rather than being drawn once */
function stepsFor(status: string, hasAvailable: boolean, sentCount: number) {
  const done = (label: string) => ({ label, num: '', kind: 'done' as const });
  const curr = (label: string) => ({ label, num: '', kind: 'current' as const });
  const pend = (label: string, num: string) => ({ label, num, kind: 'pending' as const });
  const stop = (label: string) => ({ label, num: '', kind: 'cancelled' as const });

  if (status === 'cancelled') return [done('Submitted'), done('Confirmed'), stop('ยกเลิกแล้ว')];
  if (status === 'submitted') return [done('Submitted'), curr('รอยืนยัน'), pend('เช็คเกณฑ์ + ว่าง', '3'), pend('สร้าง Shortlist', '4'), pend('ส่งลูกค้า', '5')];
  if (status === 'confirmed') {
    return [
      done('Submitted'), done('Confirmed'),
      hasAvailable ? done('เช็คเกณฑ์ + ว่าง') : curr('เช็คเกณฑ์ + ว่าง'),
      hasAvailable ? curr('สร้าง Shortlist') : pend('สร้าง Shortlist', '4'),
      pend('ส่งลูกค้า', '5'),
    ];
  }
  return [done('Submitted'), done('Confirmed'), done('เช็คเกณฑ์ + ว่าง'), done('สร้าง Shortlist'), sentCount ? curr('ส่งลูกค้า') : curr('ส่งลูกค้า')];
}

const circleFor = (kind: string): React.CSSProperties => {
  if (kind === 'done') return { ...circleBase, background: '#0D6C3B' };
  if (kind === 'current') return { ...circleBase, background: '#273c33', boxShadow: '0 0 0 4px rgba(39,60,51,.15)' };
  if (kind === 'cancelled') return { ...circleBase, background: '#FBEEEC', border: '1.5px solid #E4C4C0' };
  return { ...circleBase, background: 'var(--bg)', border: '1.5px solid var(--border)' };
};
const labelColorFor = (kind: string) =>
  kind === 'done' ? '#0D6C3B' : kind === 'current' ? '#273c33' : kind === 'cancelled' ? '#C77' : 'var(--muted3)';

export function RequirementBody({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = React.useState<Detail | null>(null);
  const [loadErr, setLoadErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelField, setCancelField] = React.useState('budget');
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelErr, setCancelErr] = React.useState('');

  /* Reading a size and a budget out of free text will get it wrong sometimes,
     and until now there was nothing Ops could do about it — the PATCH existed
     but no screen called it. */
  const [editOpen, setEditOpen] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string | boolean>>({});
  const [editErr, setEditErr] = React.useState('');

  const [checkOpen, setCheckOpen] = React.useState(false);
  const [checkCode, setCheckCode] = React.useState('');
  const [checkResult, setCheckResult] = React.useState('available');
  const [checkNote, setCheckNote] = React.useState('');
  const [checkErr, setCheckErr] = React.useState('');
  /* สไลด์ 35/37 · เดิมช่องนี้ให้พิมพ์รหัสทรัพย์ที่คนคีย์ไม่มีทางรู้ ตอนนี้เลือก
     จากรายการที่เข้าเกณฑ์ พร้อมรูป ราคา สถานะว่าง และเบอร์เจ้าของให้โทรได้เลย */
  const [cands, setCands] = React.useState<Candidate[] | null>(null);
  const [candQ, setCandQ] = React.useState('');
  const [picked, setPicked] = React.useState<Candidate | null>(null);

  const loadCandidates = React.useCallback((term: string) => {
    apiGet<{ items: Candidate[] }>(`/api/requirements/${id}/candidates?q=${encodeURIComponent(term)}`)
      .then((r) => setCands(r.items))
      .catch(() => setCands([]));
  }, [id]);
  React.useEffect(() => {
    if (!checkOpen) return;
    const t = window.setTimeout(() => loadCandidates(candQ), candQ ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [checkOpen, candQ, loadCandidates]);

  const flash = (msg: string, ms = 2600) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), ms);
  };
  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const load = React.useCallback(() => {
    apiGet<Detail>(`/api/requirements/${id}`)
      .then((r) => { setData(r); setLoadErr(''); })
      .catch((e) => setLoadErr(e instanceof ApiClientError ? e.message : 'โหลดข้อมูลไม่สำเร็จ'));
  }, [id]);
  React.useEffect(load, [load]);

  const act = async (payload: Record<string, unknown>, done: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await apiPatch(`/api/requirements/${id}`, payload);
      load();
      flash(done);
      return true;
    } catch (e) {
      flash(e instanceof ApiClientError ? e.message : 'ทำรายการไม่สำเร็จ', 3200);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openEdit = () => {
    if (!data) return;
    setEditErr('');
    setForm({
      dealIntent: data.dealIntent,
      usage: data.usage,
      areaMin: data.areaMin?.toString() ?? '',
      areaMax: data.areaMax?.toString() ?? '',
      budgetMin: data.budgetMin?.toString() ?? '',
      budgetMax: data.budgetMax?.toString() ?? '',
      moveIn: data.moveIn ? new Date(data.moveIn).toISOString().slice(0, 10) : '',
      needsRor4: data.needsRor4,
      nearPort: data.nearPort,
      pollution: data.pollution,
      note: data.note,
      locations: data.locations.map((l) => l.name).join(', '),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditErr('');
    const okDone = await act({
      dealIntent: form.dealIntent, usage: form.usage,
      areaMin: form.areaMin, areaMax: form.areaMax,
      budgetMin: form.budgetMin, budgetMax: form.budgetMax,
      moveIn: form.moveIn, needsRor4: form.needsRor4, nearPort: form.nearPort,
      pollution: form.pollution, note: form.note,
      locations: String(form.locations || '').split(','),
    }, 'บันทึกความต้องการแล้ว');
    if (okDone) setEditOpen(false);
    else setEditErr('บันทึกไม่สำเร็จ');
  };

  const confirmCancel = async () => {
    setCancelErr('');
    if (!cancelReason.trim()) { setCancelErr('กรุณาระบุเหตุผล'); return; }
    const okDone = await act({ action: 'cancel', cancelField, cancelReason }, 'ยกเลิก requirement แล้ว');
    if (okDone) setCancelOpen(false);
  };

  const saveCheck = async () => {
    setCheckErr('');
    if (!checkCode.trim()) { setCheckErr('เลือกทรัพย์ที่โทรถามมาก่อน'); return; }
    if (busy) return;
    setBusy(true);
    try {
      await apiPost(`/api/requirements/${id}/checks`, { code: checkCode.trim().toUpperCase(), result: checkResult, note: checkNote });
      setCheckOpen(false);
      setCheckCode('');
      setPicked(null);
      setCandQ('');
      setCheckNote('');
      load();
      flash('บันทึกผลการเช็คแล้ว');
    } catch (e) {
      setCheckErr(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const removeCheck = async (code: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await apiDelete(`/api/requirements/${id}/checks?code=${encodeURIComponent(code)}`);
      load();
    } catch (e) {
      flash(e instanceof ApiClientError ? e.message : 'เอาออกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const buildShortlist = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await apiPost<{ id: string; count: number; skipped: number }>(`/api/requirements/${id}/shortlist`, {});
      flash(
        r.skipped
          ? `สร้าง shortlist ${r.count} ทรัพย์ — ข้าม ${r.skipped} ทรัพย์ที่ไม่ได้เผยแพร่แล้ว`
          : `สร้าง shortlist ${r.count} ทรัพย์แล้ว`,
        3200,
      );
      load();
      setTimeout(() => router.push('/admin/shortlists'), 900);
    } catch (e) {
      flash(e instanceof ApiClientError ? e.message : 'สร้าง shortlist ไม่สำเร็จ', 4000);
    } finally {
      setBusy(false);
    }
  };

  if (loadErr) {
    return (
      <AdminShell active="requirements" eyebrow="งานขาย / Requirements" title="Requirement">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{loadErr}</div>
          <Link href="/admin/requirements" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>← กลับไปรายการ Requirements</Link>
        </div>
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell active="requirements" eyebrow="งานขาย / Requirements" title="Requirement">
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--muted3)' }}>กำลังโหลด…</div>
      </AdminShell>
    );
  }

  const cancelled = data.status === 'cancelled';
  const availableChecks = data.checks.filter((c) => c.available);
  const steps = stepsFor(data.status, availableChecks.length > 0, data.shortlists.length);
  const chip = STATUS_CHIP[data.status] ?? { bg: 'var(--bg)', fg: 'var(--muted2)' };
  const reasonLabel = data.cancelFields.find((f) => f.key === data.cancelField)?.label || data.cancelField;

  const fields: { k: string; v: string }[] = [
    { k: 'ต้องการ', v: data.dealIntent || '—' },
    { k: 'ประเภทการใช้งาน', v: data.usage || '—' },
    { k: 'ขนาด', v: fmtRange(data.areaMin, data.areaMax, 'ตร.ม.') },
    { k: data.dealIntent.includes('ขาย') ? 'งบซื้อ' : 'งบเช่า', v: fmtRange(data.budgetMin, data.budgetMax, data.dealIntent.includes('ขาย') ? '฿' : '฿/ด.') },
    { k: 'ต้องการ ร.ง.4', v: data.needsRor4 ? 'ใช่' : 'ไม่ระบุ' },
    { k: 'ย้ายเข้า', v: fmtDate(data.moveIn) },
  ];

  /* Only the conditions this requirement actually asks for. The mock-up
     listed four with green ticks whatever the customer said. */
  const criteria = [
    data.needsRor4 && { label: 'ขอใบ ร.ง.4 ได้', tag: 'ต้องมี', style: tagStyle('#E8F3EC', '#0D6C3B') },
    data.nearPort && { label: 'ใกล้ท่าเรือ / สนามบิน', tag: 'ต้องใกล้', style: tagStyle('#EEF4F3', '#034956') },
    data.pollution && { label: 'มลภาวะ (ประเภทกิจการ)', tag: data.pollution, style: tagStyle('#FBF3E1', '#9A741C') },
    (data.areaMin !== null || data.budgetMin !== null) && {
      label: 'ขนาด + งบ ตรงเงื่อนไข',
      tag: `${fmtRange(data.areaMin, data.areaMax, 'ตร.ม.')}`,
      style: tagStyle('#E8F3EC', '#0D6C3B'),
    },
  ].filter(Boolean) as { label: string; tag: string; style: React.CSSProperties }[];

  const eyebrowNode = (
    <>
      <Link href="/admin/requirements" style={{ color: 'var(--muted2)' }}>Requirements</Link> / {data.code}
    </>
  );
  const titleNode = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {data.code}
      <code style={{ ...monoCode, fontSize: 12, fontWeight: 700, color: chip.fg, background: chip.bg, padding: '2px 8px', borderRadius: 6 }}>{data.statusLabel}</code>
    </span>
  );
  const actionsNode = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {data.status === 'submitted' && (
        <div id="req-confirm" onClick={() => void act({ action: 'confirm' }, 'ยืนยัน requirement แล้ว — lead เลื่อนสถานะให้อัตโนมัติ')} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>ยืนยัน requirement
        </div>
      )}
      {cancelled ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', borderRadius: 9999, background: '#F9E4E1', color: '#C0392B', fontSize: 13, fontWeight: 700 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>ยกเลิกแล้ว
        </span>
      ) : (
        <div id="req-cancel" onClick={() => { setCancelErr(''); setCancelOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid #E4C4C0', color: '#C0392B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>ยกเลิก requirement
        </div>
      )}
    </div>
  );

  return (
    <AdminShell
      active="requirements"
      eyebrow={eyebrowNode as unknown as string}
      title={titleNode as unknown as string}
      actions={actionsNode}
      css={reqCss}
    >
      {cancelled && (
        <div style={{ background: '#FBEEEC', border: '1px solid #E4C4C0', borderRadius: 16, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#F4D4CF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#C0392B' }}>Requirement นี้ถูกยกเลิกแล้ว</div>
            <div style={{ marginTop: 3, fontSize: '12.5px', color: 'var(--muted)' }}>
              ข้อที่เป็นปัญหา: <b style={{ color: 'var(--text)' }}>{reasonLabel}</b>
              {data.cancelReason && <> · {data.cancelReason}</>}
            </div>
          </div>
          <div id="req-reopen" onClick={() => void act({ action: 'reopen' }, 'เปิด requirement ใหม่แล้ว')} style={{ height: 38, padding: '0 16px', borderRadius: 9999, border: '1.5px solid #C0392B', color: '#C0392B', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>เปิดใช้ใหม่</div>
        </div>
      )}

      {/* ลูกค้าเจ้าไหน · โทรที่ไหน — สไลด์ 37 "ชื่อลูกค้าหรือบริษัทอยู่ตรงไหน
          รู้ได้อย่างไรว่าทำแผนลูกค้าเจ้าไหน" หน้านี้เคยมีแต่รหัส REQ-xxxx */}
      <div data-req-customer style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>ทำแผนให้ลูกค้า</div>
          <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text)' }}>
            {data.company || data.leadName || 'ยังไม่ได้ระบุชื่อ'}
            {data.company && data.leadName && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}> · {data.leadName}</span>}
            {data.leadWho && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--tint)', padding: '2px 8px', borderRadius: 9999 }}>{data.leadWho}</span>}
          </div>
        </div>
        {data.leadPhone && (
          <a href={`tel:${data.leadPhone.replace(/[^+\d]/g, '')}`} data-req-lead-phone style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '13px', fontWeight: 700 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /></svg>
            {data.leadPhone}
          </a>
        )}
        <Link href={`/admin/leads?id=${data.leadId}`} style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)' }}>เปิด lead →</Link>
      </div>

      {/* FLOW B RAIL */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Flow B — Requirement → Shortlist</div>
          <span style={{ fontSize: 12, color: 'var(--muted2)' }}>เช็คว่าง <b style={{ color: 'var(--accent)' }}>ก่อน</b>สร้าง shortlist (FR-AVL-04)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={circleFor(s.kind)}>
                  {s.kind === 'done' && (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>)}
                  {s.kind === 'current' && (<span style={{ width: 8, height: 8, borderRadius: 9999, background: '#fff' }} />)}
                  {s.kind === 'pending' && (<span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted3)' }}>{s.num}</span>)}
                  {s.kind === 'cancelled' && (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>)}
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: labelColorFor(s.kind), whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (<div style={{ flex: 1, height: 2, background: s.kind === 'done' ? '#0D6C3B' : 'var(--border)', margin: '0 8px', marginBottom: 26 }} />)}
            </div>
          ))}
        </div>
      </div>

      <div id="req-split" style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ความต้องการของลูกค้า</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!cancelled && (
                  <span id="req-edit" onClick={openEdit} style={{ fontSize: '12.5px', fontWeight: 700, color: '#0D6C3B', cursor: 'pointer' }}>แก้ไข</span>
                )}
                <Link href={`/admin/leads?id=${data.leadId}`} style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)' }}>
                  {data.company || data.leadName || 'ดู lead'} →
                </Link>
              </div>
            </div>
            <div id="req-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fields.map((f) => (
                <div key={f.k} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{f.k}</div>
                  <div style={{ marginTop: 4, fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>{f.v}</div>
                </div>
              ))}
            </div>
            {data.note && (
              <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--tint)', fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.7 }}>{data.note}</div>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>เกณฑ์พิเศษที่ต้องตรวจเทียบ</div>
            <div style={{ marginTop: 3, fontSize: '12.5px', color: 'var(--muted)' }}>ตรวจทุกข้อก่อนคัดทรัพย์เข้า shortlist</div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {criteria.length === 0 && (
                <div style={{ padding: '18px 14px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)' }}>
                  requirement นี้ไม่ได้ระบุเงื่อนไขพิเศษไว้
                </div>
              )}
              {criteria.map((c) => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{c.label}</span>
                  <span style={c.style}>{c.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(150deg,#08301C 0%,#04170D 100%)', borderRadius: 18, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(45,251,145,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
              </span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Availability Gate</div>
                <div style={{ fontSize: '12.5px', color: '#9FD9BA' }}>เพิ่มเข้า shortlist ได้เฉพาะทรัพย์ที่ว่าง</div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.checks.length === 0 && (
                <div style={{ padding: '18px 14px', borderRadius: 12, background: 'rgba(255,255,255,.05)', textAlign: 'center', fontSize: '12.5px', color: '#9FD9BA', lineHeight: 1.7 }}>
                  ยังไม่ได้เช็คทรัพย์ไหนเลย<br />โทรถามเจ้าของทรัพย์แล้วกดบันทึกผลด้านล่าง
                </div>
              )}
              {data.checks.map((c) => (
                <div key={c.id} data-check={c.code} style={{ padding: '13px 15px', borderRadius: 12, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.img
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={c.img} alt="" style={{ width: 46, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 46, height: 38, borderRadius: 8, background: 'rgba(255,255,255,.09)', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...monoCode, fontSize: '12.5px', fontWeight: 700, color: '#fff' }}>{c.code}</div>
                    <div style={{ marginTop: 2, fontSize: '11.5px', color: '#9FD9BA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}{c.area ? ` ${nf.format(c.area)} ตร.ม.` : ''}
                    </div>
                    {c.contactPhone && (
                      <a href={`tel:${c.contactPhone.replace(/[^+\d]/g, '')}`} data-check-owner style={{ fontSize: '11px', fontWeight: 700, color: '#8FE6B6' }}>
                        {c.contactName || 'เจ้าของ'} · {c.contactPhone}
                      </a>
                    )}
                    {c.result === 'available' && !c.stillActive && (
                      <div style={{ marginTop: 3, fontSize: '11px', color: '#F3B0A8' }}>เจ้าของบอกว่าว่าง แต่ทรัพย์ไม่ได้เผยแพร่อยู่แล้ว</div>
                    )}
                  </div>
                  <span style={c.available ? availOk : availNo}>{c.available ? 'ว่าง' : c.result === 'available' ? 'ไม่เผยแพร่' : 'ไม่ว่าง'}</span>
                  <span onClick={() => void removeCheck(c.code)} title="เอาออก" style={{ color: '#7E9C8B', cursor: 'pointer', flexShrink: 0, display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </span>
                </div>
              ))}
            </div>

            <div id="req-add-check" onClick={() => { setCheckErr(''); setCheckOpen(true); }} style={{ marginTop: 14, height: 48, borderRadius: 12, background: '#2DFB91', color: '#022310', fontSize: '14.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.6"><path d="M12 5v14M5 12h14" /></svg>บันทึกผลเช็คทรัพย์
            </div>
          </div>

          {/* build the shortlist — the gate is enforced on the server too */}
          <div
            id="req-build-shortlist"
            onClick={() => { if (availableChecks.length && !cancelled && data.status !== 'submitted') void buildShortlist(); }}
            className={availableChecks.length ? 'req-shortlist-card' : undefined}
            style={{ background: 'var(--surface)', border: '1.5px solid ' + (availableChecks.length && !cancelled && data.status !== 'submitted' ? '#0D6C3B' : 'var(--border)'), borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform .2s,box-shadow .2s', cursor: availableChecks.length && !cancelled && data.status !== 'submitted' ? 'pointer' : 'default', opacity: availableChecks.length && !cancelled && data.status !== 'submitted' ? 1 : .6 }}
          >
            <span style={{ width: 40, height: 40, borderRadius: 11, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>สร้าง Shortlist</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {cancelled ? 'requirement ยกเลิกแล้ว'
                  : data.status === 'submitted' ? 'ต้องกด "ยืนยัน requirement" ก่อน'
                    : availableChecks.length ? `${availableChecks.length} ทรัพย์ผ่านเงื่อนไขว่าง พร้อมคัด`
                      : 'ยังไม่มีทรัพย์ที่เช็คแล้วว่าว่าง'}
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </div>

          {data.shortlists.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Shortlist ที่สร้างจาก requirement นี้</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.shortlists.map((s) => (
                  <Link key={s.id} href="/admin/shortlists" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <span style={{ flex: 1, fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{s.name}</span>
                    <span style={tagStyle('#E8F3EC', '#0D6C3B')}>{s.count} ทรัพย์</span>
                    <span style={{ fontSize: 11, color: 'var(--muted3)' }}>{s.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {data.locations.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>พื้นที่ที่ต้องการ (priority)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.locations.map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '13.5px', color: 'var(--text)' }}>{l.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT — the form only ever guessed these from free text */}
      {editOpen && (
        <div onClick={() => setEditOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 860, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>แก้ความต้องการ {data.code}</div>
            <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              ระบบอ่านตัวเลขจากข้อความที่ลูกค้าพิมพ์ ซึ่งบางทีอ่านไม่ออก — เติมหรือแก้ตรงนี้ได้เลย
            </p>

            {([
              ['dealIntent', 'ต้องการ', 'เช่า / ขาย'],
              ['usage', 'ประเภทการใช้งาน', 'คลังสินค้า/โลจิสติกส์'],
            ] as [string, string, string][]).map(([k, label, ph]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{label}</label>
                <input
                  id={`req-f-${k}`}
                  value={String(form[k] ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  placeholder={ph}
                  style={{ marginTop: 6, width: '100%', height: 42, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }}
                />
              </div>
            ))}

            {([
              ['ขนาด (ตร.ม.)', 'areaMin', 'areaMax', 'จาก', 'ถึง'],
              [String(form.dealIntent ?? '').includes('ขาย') ? 'งบซื้อ (฿)' : 'งบเช่า (฿/เดือน)', 'budgetMin', 'budgetMax', 'ต่ำสุด', 'สูงสุด'],
            ] as [string, string, string, string, string][]).map(([label, a, b, pa, pb]) => (
              <div key={a} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{label}</label>
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  {[[a, pa], [b, pb]].map(([k, ph]) => (
                    <input
                      key={k}
                      id={`req-f-${k}`}
                      value={String(form[k] ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value.replace(/[^\d]/g, '') }))}
                      inputMode="numeric"
                      placeholder={ph}
                      style={{ flex: 1, minWidth: 0, height: 42, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, fontVariantNumeric: 'tabular-nums', background: 'var(--bg)', outline: 'none' }}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ย้ายเข้า</label>
              <input
                id="req-f-moveIn"
                type="date"
                value={String(form.moveIn ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, moveIn: e.target.value }))}
                style={{ marginTop: 6, width: '100%', height: 42, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([['needsRor4', 'ต้องมี ร.ง.4'], ['nearPort', 'ต้องใกล้ท่าเรือ / สนามบิน']] as [string, string][]).map(([k, label]) => {
                const on = form[k] === true;
                return (
                  <div key={k} id={`req-f-${k}`} onClick={() => setForm((f) => ({ ...f, [k]: !on }))} style={{ height: 38, padding: '0 14px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: '12.5px', fontWeight: on ? 700 : 600, background: on ? '#E8F3EC' : 'var(--bg)', color: on ? '#0D6C3B' : 'var(--muted)', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)') }}>
                    <span style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? '#0D6C3B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg>}
                    </span>
                    {label}
                  </div>
                );
              })}
            </div>

            {([
              ['pollution', 'มลภาวะ (ประเภทกิจการ)', 'เช่น มีกลิ่น / เสียงดัง — เว้นว่างถ้าไม่มีปัญหา'],
              ['locations', 'พื้นที่ที่ต้องการ (คั่นด้วย ,)', 'สมุทรปราการ, ชลบุรี'],
            ] as [string, string, string][]).map(([k, label, ph]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{label}</label>
                <input
                  id={`req-f-${k}`}
                  value={String(form[k] ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  placeholder={ph}
                  style={{ marginTop: 6, width: '100%', height: 42, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>บันทึกเพิ่มเติม</label>
              <textarea
                id="req-f-note"
                value={String(form.note ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={3}
                style={{ marginTop: 6, width: '100%', padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {editErr && <div id="req-edit-error" style={{ marginBottom: 10, padding: '9px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>{editErr}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={() => setEditOpen(false)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="req-edit-save" onClick={() => void saveEdit()} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: busy ? '#6E8C7C' : '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL — FR-CRM-07 needs both the item and the reason */}
      {cancelOpen && (
        <div onClick={() => setCancelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 860, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>ยกเลิก {data.code}</div>
            <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              ต้องระบุว่าข้อไหนเป็นปัญหา ทีมจะได้เห็นภาพรวมว่าเสียงานเพราะอะไรบ่อยที่สุด
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ข้อที่เป็นปัญหา</label>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {data.cancelFields.map((f) => {
                const on = cancelField === f.key;
                return (
                  <div key={f.key} data-cancel-field={f.key} onClick={() => setCancelField(f.key)} style={{ height: 34, padding: '0 14px', borderRadius: 9999, display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: on ? 700 : 600, cursor: 'pointer', background: on ? '#273c33' : 'var(--bg)', color: on ? '#fff' : 'var(--muted)', border: '1px solid ' + (on ? '#273c33' : 'var(--border)') }}>{f.label}</div>
                );
              })}
            </div>

            <label style={{ marginTop: 16, display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>เหตุผล</label>
            <textarea
              id="req-cancel-reason"
              value={cancelReason}
              onChange={(e) => { setCancelReason(e.target.value); if (cancelErr) setCancelErr(''); }}
              rows={3}
              placeholder="เช่น งบไม่ถึงราคาตลาดในโซนที่ต้องการ"
              style={{ marginTop: 6, width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />

            {cancelErr && <div id="req-cancel-error" style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>{cancelErr}</div>}

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={() => setCancelOpen(false)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ปิด</div>
              <div id="req-cancel-confirm" onClick={() => void confirmCancel()} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: busy ? '#C98B8B' : '#A32A2A', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>{busy ? 'กำลังยกเลิก…' : 'ยืนยันยกเลิก'}</div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD AN AVAILABILITY ANSWER */}
      {checkOpen && (
        <div onClick={() => setCheckOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 860, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>บันทึกผลเช็คความว่าง</div>
            <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              ระบบเช็คให้เองไม่ได้ — ต้องถามเจ้าของทรัพย์แล้วมาบันทึกว่าได้คำตอบว่าอะไร
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ทรัพย์ที่โทรถาม</label>
            {picked ? (
              <div data-check-picked style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, border: '1.5px solid #0D6C3B', background: '#F4FAF6' }}>
                {picked.img
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={picked.img} alt="" style={{ width: 54, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 54, height: 44, borderRadius: 8, background: 'var(--border)', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...monoCode, fontSize: 12, fontWeight: 800, color: '#0D6C3B' }}>{picked.code}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{picked.title}</div>
                  {picked.contactPhone && (
                    <a href={`tel:${picked.contactPhone.replace(/[^+\d]/g, '')}`} data-check-phone style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                      {picked.contactName || 'ผู้ติดต่อ'} · {picked.contactPhone}
                    </a>
                  )}
                </div>
                <span onClick={() => { setPicked(null); setCheckCode(''); }} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted2)', cursor: 'pointer', flexShrink: 0 }}>เปลี่ยน</span>
              </div>
            ) : (
              <>
                <input
                  id="req-check-code"
                  autoFocus
                  value={candQ}
                  onChange={(e) => { setCandQ(e.target.value); if (checkErr) setCheckErr(''); }}
                  placeholder="ค้นหาด้วยชื่อ รหัส หรือจังหวัด"
                  style={{ marginTop: 6, width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg)', outline: 'none', fontFamily: 'inherit' }}
                />
                <div style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cands === null && <div style={{ padding: 12, fontSize: '12.5px', color: 'var(--muted2)' }}>กำลังหาทรัพย์ที่เข้าเกณฑ์…</div>}
                  {cands?.length === 0 && <div style={{ padding: 12, fontSize: '12.5px', color: 'var(--muted2)' }}>ไม่พบทรัพย์ที่ตรงกับคำค้นนี้</div>}
                  {cands?.map((c) => (
                    <div
                      key={c.id}
                      data-candidate={c.code}
                      onClick={() => { setPicked(c); setCheckCode(c.code); setCheckErr(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 11, border: '1px solid var(--border)', cursor: 'pointer', background: c.alreadyChecked ? 'var(--bg)' : 'var(--surface)', opacity: c.alreadyChecked ? 0.6 : 1 }}
                    >
                      {c.img
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={c.img} alt="" style={{ width: 48, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 48, height: 40, borderRadius: 8, background: 'var(--border)', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ ...monoCode, fontSize: '11.5px', fontWeight: 800, color: 'var(--accent)' }}>{c.code}</span>
                          {!c.available && <span style={{ fontSize: 10, fontWeight: 700, color: '#A32A2A' }}>ไม่ว่าง</span>}
                          {c.alreadyChecked && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted2)' }}>เช็คแล้ว</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                          {[c.province, c.area ? `${nf.format(c.area)} ตร.ม.` : '', c.price ? `฿${nf.format(c.price)}` : ''].filter(Boolean).join(' · ')}
                          {c.misses.length > 0 && <span style={{ color: '#9A741C' }}> · {c.misses.join(' · ')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <label style={{ marginTop: 14, display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>เจ้าของทรัพย์ตอบว่า</label>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {[['available', 'ว่าง'], ['unavailable', 'ไม่ว่าง']].map(([k, label]) => {
                const on = checkResult === k;
                return (
                  <div key={k} data-check-result={k} onClick={() => setCheckResult(k)} style={{ flex: 1, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: on ? 800 : 600, cursor: 'pointer', background: on ? (k === 'available' ? '#E8F3EC' : '#FBEEEC') : 'var(--bg)', color: on ? (k === 'available' ? '#0D6C3B' : '#A32A2A') : 'var(--muted)', border: '1.5px solid ' + (on ? (k === 'available' ? '#0D6C3B' : '#C0392B') : 'var(--border)') }}>{label}</div>
                );
              })}
            </div>

            <label style={{ marginTop: 14, display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>บันทึกเพิ่ม (ไม่ใส่ก็ได้)</label>
            <input
              value={checkNote}
              onChange={(e) => setCheckNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void saveCheck(); }}
              placeholder="เช่น ว่าง 1 ต.ค. · เจ้าของขอขึ้นราคา"
              style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }}
            />

            {checkErr && <div id="req-check-error" style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>{checkErr}</div>}

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={() => setCheckOpen(false)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="req-check-save" onClick={() => void saveCheck()} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: busy ? '#6E8C7C' : '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div id="req-toast" style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 950, padding: '12px 20px', borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 18px 40px rgba(0,0,0,.28)', maxWidth: '90vw', textAlign: 'center' }}>{toast}</div>
      )}
    </AdminShell>
  );
}
