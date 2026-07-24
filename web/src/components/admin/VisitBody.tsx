'use client';

import * as React from 'react';

/* Ported verbatim from AdminVisit.dc.html <main> (+ the stateful topbar
   right cluster). Visit-plan detail: criteria gate (Flow C), appointment
   cards, and a sticky route + outcome-summary card. Interactive: confirm
   criteria gate, add appointment, and mark-plan-complete (topbar). */

type Listing = { seq: string; title: string; code: string; outcome: string; outcomeStyle: React.CSSProperties };
type Appointment = { no: string; landlord: string; time: string; badge: string; badgeStyle: React.CSSProperties; count: string; listings: Listing[] };

/* pill badge style helper (design `ob(label,bg,fg)` — label unused) */
const ob = (bg: string, fg: string): React.CSSProperties => ({ height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg, fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0 });

const TOTAL_LISTINGS = 5;

const ROUTE = [
  { name: 'ออกจากสำนักงาน', detail: '08:30 น.', dot: '#9B968D', line: true },
  { name: 'นัด 1 — บางพลี สมุทรปราการ', detail: '09:30 · 2 ทรัพย์', dot: '#0D6C3B', line: true },
  { name: 'นัด 2 — ศรีราชา ชลบุรี', detail: '13:30 · 1 ทรัพย์', dot: '#D9A62B', line: true },
  { name: 'กลับสำนักงาน', detail: '~17:00 น.', dot: '#9B968D', line: false },
];

const MAPS_URL =
  'https://www.google.com/maps/dir/?api=1&origin=' +
  encodeURIComponent('JKP Property, บางนา กรุงเทพ') +
  '&destination=' +
  encodeURIComponent('JKP Property, บางนา กรุงเทพ') +
  '&waypoints=' +
  encodeURIComponent('บางพลี สมุทรปราการ|ศรีราชา ชลบุรี') +
  '&travelmode=driving';

/* ---- Topbar right cluster: print route sheet + mark complete ---- */
export function VisitActions() {
  const [completed, setCompleted] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v7a2 2 0 01-2 2h-2" /><path d="M9 13h6M9 17h6" /></svg>พิมพ์ route sheet
      </div>
      <div onClick={() => setCompleted(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: completed ? '#273c33' : '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>{completed ? 'ปิด plan แล้ว' : 'ปิด plan (completed)'}
      </div>
    </div>
  );
}

/* ---- Main content ---- */
export function VisitBody() {
  const [gateConfirmed, setGateConfirmed] = React.useState(false);
  const [extraAppts, setExtraAppts] = React.useState<unknown[]>([]);
  const gatePending = !gateConfirmed;
  const overWarn = TOTAL_LISTINGS > 8;

  const appointments: Appointment[] = [
    {
      no: '1', landlord: 'คุณประเสริฐ (เจ้าของ SPK)', time: '09:30 – 11:00', badge: 'ยืนยันแล้ว', badgeStyle: ob('#E8F3EC', '#0D6C3B'), count: '2', listings: [
        { seq: '1', title: 'โกดังพร้อมสำนักงาน', code: 'JKP-SPK0042', outcome: 'สนใจมาก', outcomeStyle: ob('#E8F3EC', '#0D6C3B') },
        { seq: '2', title: 'โกดังให้เช่า มหาชัย', code: 'JKP-SKN0015', outcome: 'พิจารณาต่อ', outcomeStyle: ob('#FBF3E1', '#9A741C') },
      ],
    },
    {
      no: '2', landlord: 'บ. ปิ่นทอง แลนด์', time: '13:30 – 15:30', badge: 'รอยืนยัน', badgeStyle: ob('#FBF3E1', '#9A741C'), count: '1', listings: [
        { seq: '1', title: 'โรงงาน + โกดัง ปิ่นทอง', code: 'JKP-CBI0019', outcome: 'ยังไม่ดู', outcomeStyle: ob('#F0EEE9', '#7A7974') },
      ],
    },
    ...extraAppts.map((_appt, i): Appointment => ({ no: String(3 + i), landlord: 'นัดใหม่ (ยังไม่ระบุ)', time: 'กำหนดเวลา', badge: 'ร่าง', badgeStyle: ob('#F0EEE9', '#7A7974'), count: '0', listings: [] })),
  ];

  return (
    <>
      {/* CRITERIA GATE (Flow C) */}
      <div style={{ background: gateConfirmed ? '#E8F3EC' : 'var(--surface)', border: '1px solid ' + (gateConfirmed ? '#B6E0C4' : '#EAD9A8'), borderRadius: 16, padding: '18px 22px', boxShadow: gateConfirmed ? undefined : '0 4px 16px rgba(217,166,43,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
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
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <a href="/admin/requirements" style={{ height: 38, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>แก้ criteria</a>
              <div onClick={() => setGateConfirmed(true)} style={{ height: 38, padding: '0 16px', borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>ยืนยันไม่เปลี่ยน</div>
            </div>
          )}
        </div>
      </div>

      <div id="visit-split" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* LEFT: plan + appointments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* plan meta */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>แผนการเข้าชม</div>
              <span style={{ height: 26, padding: '0 12px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center' }}>เต็มวัน</span>
            </div>
            <div id="visit-plan-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 15px' }}><div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>วันที่นัด</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>22 ก.ค. 2026</div></div>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 15px' }}><div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>ลูกค้า</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>บ. ไทยโลจิสติกส์</div></div>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 15px' }}><div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>agent</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>อารยา</div></div>
            </div>
          </div>

          {/* soft warning */}
          {overWarn && (
            <div style={{ background: '#FBF3E1', border: '1px solid #EAD9A8', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A741C" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
              <span style={{ fontSize: '12.5px', color: '#9A741C', fontWeight: 600 }}>มีทรัพย์ {String(TOTAL_LISTINGS)} แห่งใน session นี้ (เกิน 8) — อาจดูไม่ทันในวันเดียว แนะนำแยกเป็น 2 วัน</span>
            </div>
          )}

          {/* appointments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {appointments.map((ap) => (
              <div key={ap.no} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: '#273c33', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>นัด</span>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>{ap.no}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{ap.landlord}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{ap.time}
                    </div>
                  </div>
                  <span style={ap.badgeStyle}>{ap.badge}</span>
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted2)', marginBottom: 10 }}>ทรัพย์ที่ดู ({ap.count})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ap.listings.map((ls) => (
                      <div key={ls.seq} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 11, background: 'var(--bg)' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{ls.seq}</span>
                        <div style={{ flex: 1, minWidth: 0 }}><span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{ls.title}</span> <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#0D6C3B', fontWeight: 700 }}>{ls.code}</code></div>
                        <span style={ls.outcomeStyle}>{ls.outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            onClick={() => setExtraAppts((prev) => [...prev, {}])}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0D6C3B'; e.currentTarget.style.color = '#0D6C3B'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, border: '1.5px dashed var(--border)', borderRadius: 14, color: 'var(--muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>เพิ่มนัด (appointment)
          </div>
        </div>

        {/* RIGHT: route + outcome summary */}
        <div id="visit-side" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>สรุปเส้นทาง</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {ROUTE.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 9999, background: r.dot, border: '2px solid var(--surface)', boxShadow: '0 0 0 1.5px ' + r.dot, flexShrink: 0, marginTop: 3 }} />
                    {r.line && <div style={{ flex: 1, width: 2, background: 'var(--border)', margin: '2px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            {gateConfirmed && (
              <a
                href={MAPS_URL}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>สนใจมาก</span><span style={{ fontSize: 13, fontWeight: 800, color: '#0D6C3B' }}>1</span></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>พิจารณาต่อ</span><span style={{ fontSize: 13, fontWeight: 800, color: '#D9A62B' }}>1</span></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>ไม่สนใจ</span><span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted3)' }}>1</span></div>
            </div>
            <a href="/admin/deals" style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 11, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700 }}>ไปเจรจา (Deal)<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
          </div>
        </div>
      </div>
    </>
  );
}
