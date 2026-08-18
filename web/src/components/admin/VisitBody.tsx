'use client';

import * as React from 'react';
import { apiGet, apiPatch, apiPost, ApiClientError } from '@/lib/apiClient';
import Link from 'next/link';

/* Ported verbatim from AdminVisit.dc.html <main> (+ the stateful topbar
   right cluster). Visit-plan detail: criteria gate (Flow C), appointment
   cards, and a sticky route + outcome-summary card. Interactive: confirm
   criteria gate, add appointment, and mark-plan-complete (topbar). */

/* The plan used to be two invented appointments with invented landlords and
   invented outcomes, a four-stop route and a fixed date of 22 ก.ค. 2026 —
   while "ปิด plan" closed whichever real visit happened to be newest. You
   could read one plan off the screen and close another.

   The data model has stops, not landlord appointments with time windows, so
   the screen shows what the model holds: the stops, in order, each with the
   outcome that was recorded for it. */
type Stop = { id: string; code: string; title: string; location: string; result: string | null };

/* pill badge style helper (design `ob(label,bg,fg)` — label unused) */
const ob = (bg: string, fg: string): React.CSSProperties => ({ height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg, fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0 });

const OUTCOMES: { key: string; label: string; style: React.CSSProperties }[] = [
  { key: 'สนใจมาก', label: 'สนใจมาก', style: ob('#E8F3EC', '#0D6C3B') },
  { key: 'พิจารณาต่อ', label: 'พิจารณาต่อ', style: ob('#FBF3E1', '#9A741C') },
  { key: 'ไม่สนใจ', label: 'ไม่สนใจ', style: ob('#F9E4E1', '#C0392B') },
];
const outcomeStyle = (r: string | null) =>
  OUTCOMES.find((o) => o.key === r)?.style ?? ob('#F0EEE9', '#7A7974');

/** a Google Maps route through the stops that are actually on the plan */
const mapsUrl = (stops: Stop[]) => {
  const points = stops.map((s) => s.location || s.title).filter(Boolean);
  if (!points.length) return '';
  const last = points[points.length - 1];
  const via = points.slice(0, -1);
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(last)
    + (via.length ? '&waypoints=' + encodeURIComponent(via.join('|')) : '')
    + '&travelmode=driving';
};

const fmtDate = (ms: number) =>
  new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms));

/* ---- Topbar right cluster: print route sheet + mark complete ---- */
/* GET /api/visits item */
type ApiVisit = {
  id: string; date: number; status: string; note: string | null; gateConfirmed?: boolean;
  /** the lead's requirement, so "แก้ criteria" opens that card and not the queue */
  requirementId?: string | null;
  leadId: string | null;
  stops: Stop[];
};

/* The topbar cluster and the body are separate components with no shared
   provider, so the fetch is cached at module scope and both subscribe. */
let visitCache: ApiVisit | null = null;
let visitInflight: Promise<ApiVisit | null> | null = null;
const VISIT_EVT = 'jkp:visit-loaded';

/* /admin/visits/<id> pins a plan; the plain route falls back to the newest.
   The id is module-scoped because the topbar and the body are separate
   components with no shared provider. */
let pinnedVisitId: string | undefined;
export function setPinnedVisit(id?: string) {
  if (id !== pinnedVisitId) { pinnedVisitId = id; visitCache = null; }
}

function useLatestVisit(): ApiVisit | null {
  const [visit, setVisit] = React.useState<ApiVisit | null>(null);
  React.useEffect(() => {
    const sync = () => setVisit(visitCache);
    window.addEventListener(VISIT_EVT, sync);
    if (visitCache) setVisit(visitCache);
    else {
      visitInflight ??= apiGet<{ items: ApiVisit[] }>('/api/visits')
        .then((r) => (visitCache = (pinnedVisitId ? r.items?.find((v) => v.id === pinnedVisitId) : r.items?.[0]) ?? null))
        .catch(() => null)
        .finally(() => { visitInflight = null; window.dispatchEvent(new Event(VISIT_EVT)); });
      void visitInflight;
    }
    return () => window.removeEventListener(VISIT_EVT, sync);
  }, []);
  return visit;
}

/* หัวเรื่องของหน้านี้เคยเป็นข้อความคงที่ 'VP-064 · confirming' และ breadcrumb
   'SL-208' ซึ่งเป็นรหัสจากไฟล์ออกแบบ ขึ้นเหมือนกันทุกครั้งแม้ในระบบจะไม่มีแผน
   เข้าชมสักแผน — หน้าจึงประกาศรหัสของสิ่งที่ไม่มีอยู่ */
export function VisitTitle() {
  const visit = useLatestVisit();
  if (!visit) return <span>แผนเข้าชม</span>;
  const when = new Date(Number(visit.date)).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const label: Record<string, string> = { scheduled: 'นัดไว้', done: 'ปิดแผนแล้ว', cancelled: 'ยกเลิก' };
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      นัดชม {when}
      <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#034956', background: '#EEF4F3', padding: '2px 8px', borderRadius: 6 }}>
        {label[visit.status] ?? visit.status}
      </code>
    </span>
  );
}

export function VisitActions() {
  const visit = useLatestVisit();
  const [completed, setCompleted] = React.useState(false);
  React.useEffect(() => { if (visit?.status === 'done') setCompleted(true); }, [visit]);

  // the server refuses to close a plan whose availability gate is still open
  const complete = () => {
    // เดิม: ไม่มีแผนก็ยังเปลี่ยนปุ่มเป็น "ปิด plan แล้ว" ทั้งที่ไม่ได้บันทึกอะไรเลย
    if (!visit) return;
    apiPatch(`/api/visits/${visit.id}`, { status: 'done' })
      .then(() => { setCompleted(true); if (visitCache) visitCache.status = 'done'; })
      .catch((e) => window.alert(e instanceof ApiClientError ? e.message : 'ปิดแผนไม่สำเร็จ'));
  };

  return (
    <div id="visit-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v7a2 2 0 01-2 2h-2" /><path d="M9 13h6M9 17h6" /></svg>พิมพ์ route sheet
      </div>
      <div onClick={complete} title={visit ? undefined : 'ยังไม่มีแผนเข้าชมให้ปิด'}
        style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: !visit ? 'var(--border)' : completed ? '#273c33' : '#0D6C3B', color: visit ? '#fff' : 'var(--muted3)', fontSize: 13, fontWeight: 700, cursor: visit ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>{completed ? 'ปิด plan แล้ว' : 'ปิด plan (completed)'}
      </div>
    </div>
  );
}

/* ---- Main content ---- */
export function VisitBody() {
  const visit = useLatestVisit();
  const [gateConfirmed, setGateConfirmed] = React.useState(false);
  React.useEffect(() => { if (visit?.gateConfirmed) setGateConfirmed(true); }, [visit]);

  const confirmGate = () => {
    // ไม่มีแผน = ไม่มีอะไรให้ยืนยัน เดิมกดแล้วขึ้นว่ายืนยันแล้วเฉย ๆ
    if (!visit) return;
    setGateConfirmed(true); // optimistic — it only unlocks a link
    apiPatch(`/api/visits/${visit.id}`, { gateConfirmed: true })
      .then(() => { if (visitCache) visitCache.gateConfirmed = true; })
      .catch((e) => {
        setGateConfirmed(false);
        window.alert(e instanceof ApiClientError ? e.message : 'ยืนยันไม่สำเร็จ');
      });
  };

  const gatePending = !gateConfirmed;
  const stops = visit?.stops ?? [];
  // FR-VIS-04 soft warning — counts the real stops
  const overWarn = stops.length > 8;

  const [saving, setSaving] = React.useState<string | null>(null);
  const setOutcome = (stopId: string, result: string) => {
    if (!visit || saving) return;
    setSaving(stopId);
    apiPatch(`/api/visits/${visit.id}`, { outcomes: { [stopId]: result } })
      .then(() => {
        // keep the cached copy in step so the summary updates without a reload
        const hit = visitCache?.stops.find((s) => s.id === stopId);
        if (hit) hit.result = result;
        window.dispatchEvent(new Event(VISIT_EVT));
      })
      .catch((e) => window.alert(e instanceof ApiClientError ? e.message : 'บันทึกผลไม่สำเร็จ'))
      .finally(() => setSaving(null));
  };

  const tally = OUTCOMES.map((o) => ({ ...o, n: stops.filter((s) => s.result === o.key).length }));

  /* Flow D starts here. POST /api/deals existed and nothing called it, so the
     trail stopped after the viewing — opening the negotiation meant inserting
     a row by hand. */
  const [dealOpen, setDealOpen] = React.useState(false);
  const [dealCode, setDealCode] = React.useState('');
  const [dealAmount, setDealAmount] = React.useState('');
  const [dealErr, setDealErr] = React.useState('');
  const [opening, setOpening] = React.useState(false);

  const openDealDialog = () => {
    setDealErr('');
    setDealAmount('');
    // the one the customer liked most is the obvious candidate
    setDealCode(stops.find((s) => s.result === 'สนใจมาก')?.code ?? stops[0]?.code ?? '');
    setDealOpen(true);
  };

  const createDeal = () => {
    if (!dealCode) { setDealErr('เลือกทรัพย์ที่จะเปิดดีล'); return; }
    if (opening) return;
    setOpening(true);
    setDealErr('');
    const stop = stops.find((s) => s.code === dealCode);
    apiPost<{ id: string }>('/api/deals', {
      title: `${stop?.title || dealCode} — ${visit ? fmtDate(visit.date) : ''}`.trim(),
      propertyCode: dealCode,
      leadId: visit?.leadId ?? undefined,
      amount: Number(dealAmount.replace(/[^\d]/g, '')) || 0,
    })
      .then((d) => { window.location.href = `/admin/deals/${d.id}`; })
      .catch((e) => setDealErr(e instanceof ApiClientError ? e.message : 'เปิดดีลไม่สำเร็จ'))
      .finally(() => setOpening(false));
  };
  const route = mapsUrl(stops);

  return (
    <>
      {/* CRITERIA GATE (Flow C) */}
      {/* ด่านยืนยันเกณฑ์เป็นเรื่องของแผนที่มีอยู่จริง — ไม่มีแผนก็ไม่มีอะไรให้ยืนยัน
          เดิมกล่องนี้ขึ้นเสมอ พร้อมปุ่มที่กดแล้วขึ้นว่า "ยืนยันแล้ว" เฉย ๆ */}
      {visit && (
      <div style={{ background: gateConfirmed ? '#E8F3EC' : 'var(--surface)', border: '1px solid ' + (gateConfirmed ? '#B6E0C4' : '#EAD9A8'), borderRadius: 16, padding: '18px 22px', boxShadow: gateConfirmed ? undefined : '0 4px 16px rgba(217,166,43,.08)' }}>
        <div id="visit-gate-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: gateConfirmed ? '#0D6C3B' : '#FBF3E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={gateConfirmed ? '#fff' : '#9A741C'} strokeWidth="1.9">
              {gateConfirmed ? <path d="M20 6L9 17l-5-5" /> : (<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>)}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: gateConfirmed ? '#0D6C3B' : '#28251D' }}>ยืนยันเกณฑ์กับลูกค้าก่อนจัดนัด (FR-VIS-07)</div>
            <div style={{ marginTop: 3, fontSize: '12.5px', color: gateConfirmed ? '#3E7A54' : '#9A741C' }}>{gateConfirmed ? 'ลูกค้ายืนยันว่าไม่เปลี่ยนเกณฑ์ — จัดนัดได้เลย' : 'ต้องยืนยันก่อนว่าลูกค้าไม่เปลี่ยน criteria — ถ้าเปลี่ยนให้กลับไปแก้ requirement (Flow B)'}</div>
          </div>
          {gateConfirmed && (
            <span style={{ height: 28, padding: '0 13px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>ยืนยันแล้ว
            </span>
          )}
          {gatePending && (
            <div id="visit-gate-btns" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link id="visit-edit-criteria" href={visit?.requirementId ? `/admin/requirements/${visit.requirementId}` : '/admin/requirements'} title={visit?.requirementId ? 'เปิด requirement ของลูกค้ารายนี้' : 'ยังไม่มี requirement ผูกกับแผนนี้ — เปิดคิวทั้งหมด'} style={{ height: 38, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>แก้ criteria</Link>
              <div onClick={confirmGate} style={{ height: 38, padding: '0 16px', borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>ยืนยันไม่เปลี่ยน</div>
            </div>
          )}
        </div>
      </div>
      )}

      <div id="visit-split" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* LEFT: plan + appointments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* plan meta */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>แผนการเข้าชม</div>
              {/* ป้าย "เต็มวัน" เป็นข้อความคงที่ ไม่มีข้อมูลครึ่งวัน/เต็มวันในระบบให้อ้างอิง */}
            </div>
            <div id="visit-plan-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 15px' }}><div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>วันที่นัด</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{visit ? fmtDate(visit.date) : '—'}</div></div>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 15px' }}><div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>ทรัพย์ที่จะดู</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{stops.length} แห่ง</div></div>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 15px' }}><div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>สถานะ</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{!visit ? '—' : visit.status === 'done' ? 'ปิดแล้ว' : visit.status === 'cancelled' ? 'ยกเลิก' : 'นัดไว้'}</div></div>
            </div>
          </div>

          {/* soft warning */}
          {overWarn && (
            <div style={{ background: '#FBF3E1', border: '1px solid #EAD9A8', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A741C" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
              <span style={{ fontSize: '12.5px', color: '#9A741C', fontWeight: 600 }}>มีทรัพย์ {stops.length} แห่งใน session นี้ (เกิน 8) — อาจดูไม่ทันในวันเดียว แนะนำแยกเป็น 2 วัน</span>
            </div>
          )}

          {/* the stops on this plan, each with the outcome recorded for it */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
              ทรัพย์ที่จะเข้าชม ({stops.length})
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!visit && (
                <div style={{ padding: '28px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>ยังไม่มีแผนเข้าชม</div>
                  <div style={{ marginTop: 6, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.7 }}>
                    สร้างนัดชมได้จาก shortlist ที่ส่งให้ลูกค้าแล้ว
                  </div>
                  <Link href="/admin/shortlists" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>ไปหน้า Shortlists →</Link>
                </div>
              )}
              {visit && stops.length === 0 && (
                <div style={{ padding: '22px 10px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)' }}>แผนนี้ยังไม่มีทรัพย์</div>
              )}
              {stops.map((st, i) => (
                <div key={st.id} data-stop={st.code} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 8, background: 'var(--tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{st.title}</div>
                      <div style={{ marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#0D6C3B', fontWeight: 700 }}>{st.code}</code>
                        {st.location && <span style={{ fontSize: 11, color: 'var(--muted3)' }}>{st.location}</span>}
                      </div>
                    </div>
                    <span style={outcomeStyle(st.result)}>{st.result || 'ยังไม่ดู'}</span>
                  </div>
                  {/* recording the outcome per stop — the old cards showed one
                      and offered no way to change it */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted2)' }}>ผลหลังเข้าชม:</span>
                    {OUTCOMES.map((o) => {
                      const on = st.result === o.key;
                      return (
                        <div
                          key={o.key}
                          data-outcome={`${st.code}:${o.key}`}
                          onClick={() => setOutcome(st.id, on ? '' : o.key)}
                          style={{ height: 28, padding: '0 11px', borderRadius: 9999, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: on ? 800 : 600, cursor: saving ? 'default' : 'pointer', opacity: saving === st.id ? .5 : 1, ...(on ? o.style : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }) }}
                        >{o.label}</div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: route + outcome summary */}
        <div id="visit-side" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>สรุปเส้นทาง</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stops.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--muted3)' }}>ยังไม่มีจุดแวะ</div>
              )}
              {stops.map((st, i) => (
                <div key={st.id} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 9999, background: st.result ? '#0D6C3B' : '#9B968D', border: '2px solid var(--surface)', boxShadow: '0 0 0 1.5px ' + (st.result ? '#0D6C3B' : '#9B968D'), flexShrink: 0, marginTop: 3 }} />
                    {i < stops.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--border)', margin: '2px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: 16, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{st.location || st.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{st.code}{st.result ? ` · ${st.result}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
            {gateConfirmed && route && (
              <a
                href={route}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(13,108,59,.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 11, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, transition: 'transform .2s,box-shadow .2s' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>เปิดเส้นทางใน Google Maps
              </a>
            )}
            {gatePending && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 11, background: 'var(--bg)', border: '1px dashed var(--border)', color: 'var(--muted3)', fontSize: 12, fontWeight: 600 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="1.9"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" /></svg>ยืนยันเกณฑ์ก่อนเปิดเส้นทาง
              </div>
            )}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tally.map((t) => (
                <div key={t.key} data-tally={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{t.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: t.n ? '#0D6C3B' : 'var(--muted3)' }}>{t.n}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>ยังไม่ดู</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted3)' }}>{stops.filter((s2) => !s2.result).length}</span>
              </div>
            </div>
            {/* was a plain link to /admin/deals that created nothing */}
            {stops.length > 0 ? (
              <div id="visit-open-deal" onClick={openDealDialog} style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 11, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                เปิดดีล (เจรจา)<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            ) : (
              <Link href="/admin/deals" style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 11, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>ดูดีลทั้งหมด</Link>
            )}
          </div>
        </div>
      </div>

      {/* OPEN A DEAL (Flow D) */}
      {dealOpen && (
        <div onClick={() => setDealOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 860, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>เปิดดีล</div>
            <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              ทรัพย์ที่ลูกค้าให้ผลว่า &ldquo;สนใจมาก&rdquo; ถูกเลือกไว้ให้แล้ว
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ทรัพย์</label>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stops.map((st) => {
                const on = dealCode === st.code;
                return (
                  <div
                    key={st.id}
                    data-deal-pick={st.code}
                    onClick={() => setDealCode(st.code)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', background: on ? 'rgba(13,108,59,.06)' : 'var(--bg)', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)') }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: 9999, flexShrink: 0, border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? '#0D6C3B' : 'transparent' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{st.title}</div>
                      <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#0D6C3B', fontWeight: 700 }}>{st.code}</code>
                    </div>
                    {st.result && <span style={outcomeStyle(st.result)}>{st.result}</span>}
                  </div>
                );
              })}
            </div>

            <label style={{ marginTop: 16, display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>มูลค่าตั้งต้น (฿) — ใส่ทีหลังก็ได้</label>
            <input
              id="visit-deal-amount"
              value={dealAmount}
              onChange={(e) => setDealAmount(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="0"
              style={{ marginTop: 6, width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, fontVariantNumeric: 'tabular-nums', background: 'var(--bg)', outline: 'none' }}
            />

            {dealErr && <div id="visit-deal-error" style={{ marginTop: 12, padding: '9px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>{dealErr}</div>}

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={() => setDealOpen(false)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="visit-deal-save" onClick={createDeal} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: opening ? '#6E8C7C' : '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, cursor: opening ? 'default' : 'pointer' }}>{opening ? 'กำลังเปิด…' : 'เปิดดีล'}</div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
