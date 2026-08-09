'use client';

import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import Link from 'next/link';

/* Ported from AdminRequirement.dc.html — REQ-1042 detail page (Flow B:
   Requirement → Shortlist). Interactive: cancel-requirement modal with
   reason chips, availability re-check modal with an async scan, and a
   cancelled/active toggle. The topbar title status badge + right-cluster
   button are derived from the same `cancelled` state as the body, so this
   client component owns the state and renders the AdminShell chrome. */

type IconHtml = { __html: string };
type Step = {
  label: string;
  num: string;
  done: boolean;
  current: boolean;
  pending: boolean;
  line: boolean;
  circle: React.CSSProperties;
  labelColor: string;
  lineColor: string;
};

const ci = (p: string, c: string): IconHtml => ({
  __html: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2">' + p + '</svg>',
});

const tagStyle = (bg: string, fg: string): React.CSSProperties => ({
  height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg,
  fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
});

const circleBase: React.CSSProperties = { width: 34, height: 34, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const doneStep = (label: string, num: string): Step => ({ label, num, done: true, current: false, pending: false, line: true, circle: { ...circleBase, background: '#0D6C3B' }, labelColor: '#0D6C3B', lineColor: '#0D6C3B' });
const currStep = (label: string, num: string): Step => ({ label, num, done: false, current: true, pending: false, line: true, circle: { ...circleBase, background: '#273c33', boxShadow: '0 0 0 4px rgba(39,60,51,.15)' }, labelColor: '#273c33', lineColor: 'var(--border)' });
const pendStep = (label: string, num: string, last = false): Step => ({ label, num, done: false, current: false, pending: true, line: !last, circle: { ...circleBase, background: 'var(--bg)', border: '1.5px solid var(--border)' }, labelColor: 'var(--muted3)', lineColor: 'var(--border)' });
const cancelStep = (label: string, num: string, last = false): Step => ({ label, num, done: false, current: false, pending: true, line: !last, circle: { ...circleBase, background: '#FBEEEC', border: '1.5px solid #E4C4C0' }, labelColor: '#C77', lineColor: 'var(--border)' });

const STEPS_ACTIVE: Step[] = [doneStep('Submitted', '1'), doneStep('Confirmed', '2'), currStep('เช็คเกณฑ์ + ว่าง', '3'), pendStep('สร้าง Shortlist', '4'), pendStep('ส่งลูกค้า', '5', true)];
const STEPS_CANCELLED: Step[] = [doneStep('Submitted', '1'), doneStep('Confirmed', '2'), cancelStep('ยกเลิกแล้ว', '3', true)];

const REQ_FIELDS = [
  { k: 'ต้องการ', v: 'เช่าโกดัง' }, { k: 'ประเภทการใช้งาน', v: 'คลังสินค้า/โลจิสติกส์' },
  { k: 'ขนาด', v: '2,000 – 3,500 ตร.ม.' }, { k: 'งบเช่า', v: '฿150,000 – 250,000/ด.' },
  { k: 'ต้องการ ร.ง.4', v: 'ใช่' }, { k: 'ย้ายเข้า', v: '1 ก.ย. 2026' },
];

const CRITERIA = [
  { label: 'ขอใบ ร.ง.4 ได้', tag: 'ต้องมี', tag2: tagStyle('#E8F3EC', '#0D6C3B'), iconBg: '#E8F3EC', icon: ci('<path d="M20 6L9 17l-5-5"></path>', '#0D6C3B') },
  { label: 'ใกล้ท่าเรือ / สนามบิน', tag: 'ใกล้ท่าเรือ', tag2: tagStyle('#EEF4F3', '#034956'), iconBg: '#EEF4F3', icon: ci('<path d="M20 6L9 17l-5-5"></path>', '#034956') },
  { label: 'มลภาวะ (ประเภทกิจการ)', tag: 'ไม่มีปัญหา', tag2: tagStyle('#E8F3EC', '#0D6C3B'), iconBg: '#E8F3EC', icon: ci('<path d="M20 6L9 17l-5-5"></path>', '#0D6C3B') },
  { label: 'ขนาด + งบ ตรงเงื่อนไข', tag: 'ตรวจแล้ว', tag2: tagStyle('#E8F3EC', '#0D6C3B'), iconBg: '#E8F3EC', icon: ci('<path d="M20 6L9 17l-5-5"></path>', '#0D6C3B') },
];

const availOk: React.CSSProperties = { height: 22, padding: '0 10px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', flexShrink: 0 };
const availNo: React.CSSProperties = { height: 22, padding: '0 10px', borderRadius: 9999, background: 'rgba(255,255,255,.1)', color: '#F3B0A8', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0 };
const AVAIL_BASE = [
  { code: 'JKP-SPK0042', title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', result: 'ว่าง', style: availOk },
  { code: 'JKP-SKN0015', title: 'โกดังให้เช่า มหาชัย 1,800 ตร.ม.', result: 'ว่าง', style: availOk },
  { code: 'JKP-CBI0007', title: 'คลังสินค้าแหลมฉบัง 5,000 ตร.ม.', result: 'ไม่ว่าง', style: availNo },
];
const AVAIL_FOUND = { code: 'JKP-RYG0224', title: 'โรงงาน/คลังสินค้า 3,600 ตร.ม. มะขามคู่ (เพิ่มใหม่)', result: 'ว่าง', style: availOk };

const LOCATIONS = [
  { rank: '1', name: 'สมุทรปราการ (บางพลี, บางเสาธง)' },
  { rank: '2', name: 'ชลบุรี (ศรีราชา)' },
  { rank: '3', name: 'ฉะเชิงเทรา (บางปะกง)' },
];

const RECHECK_RESULTS = [
  { code: 'JKP-RYG0224', title: 'โรงงาน/คลังสินค้า 3,600 ตร.ม. มะขามคู่, ระยอง', isNew: true, existing: false },
  { code: 'JKP-SPK0042', title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', isNew: false, existing: true },
];

const CANCEL_REASONS: [string, string][] = [['budget', 'งบประมาณ'], ['size', 'ขนาด'], ['area', 'พื้นที่'], ['license', 'ใบอนุญาต'], ['timeline', 'ระยะเวลา'], ['other', 'อื่น ๆ']];

const monoCode: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

const reqCss = `
@keyframes spin{to{transform:rotate(360deg);}}
@media (max-width:1100px){ #req-split{grid-template-columns:1fr !important;} }
@media (max-width:640px){ #req-fields{grid-template-columns:1fr !important;} }
.req-shortlist-card:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(13,108,59,.18);}
`;

export function RequirementBody() {
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('budget');
  const [cancelled, setCancelled] = React.useState(false);
  const [recheckOpen, setRecheckOpen] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanDone, setScanDone] = React.useState(false);
  const [addedFound, setAddedFound] = React.useState(false);
  const scRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => { if (scRef.current) clearTimeout(scRef.current); }, []);

  const statusLabel = cancelled ? 'cancelled' : 'confirmed';
  const statusColor = cancelled ? '#C0392B' : '#0D6C3B';
  const statusBg = cancelled ? '#F9E4E1' : '#E8F3EC';
  const steps = cancelled ? STEPS_CANCELLED : STEPS_ACTIVE;
  const reasonLabel = (CANCEL_REASONS.find((r) => r[0] === cancelReason) || ['', '—'])[1];
  const availChecks = addedFound ? [...AVAIL_BASE, AVAIL_FOUND] : AVAIL_BASE;

  const openCancel = () => setCancelOpen(true);
  const closeCancel = () => setCancelOpen(false);
  const confirmCancel = () => { setCancelOpen(false); setCancelled(true); };
  const reopen = () => setCancelled(false);
  const openRecheck = () => {
    setRecheckOpen(true); setScanning(true); setScanDone(false);
    if (scRef.current) clearTimeout(scRef.current);
    scRef.current = setTimeout(() => { setScanning(false); setScanDone(true); }, 1600);
  };
  const closeRecheck = () => setRecheckOpen(false);
  const addFound = () => { setRecheckOpen(false); setAddedFound(true); };
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  /* The design's <header> carries a breadcrumb link (eyebrow) and a dynamic
     status <code> badge inside the <h1> (title). AdminShell types both props
     as `string`; passing the design's rich nodes needs a cast, which only
     satisfies the compiler — React renders the nodes correctly at runtime. */
  const eyebrowNode = (
    <>
      <Link href="/admin/leads" style={{ color: 'var(--muted2)' }}>Leads</Link> / Requirement
    </>
  );
  const titleNode = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      REQ-1042 <code style={{ ...monoCode, fontSize: 12, fontWeight: 700, color: statusColor, background: statusBg, padding: '2px 8px', borderRadius: 6 }}>{statusLabel}</code>
    </span>
  );
  const actionsNode = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {cancelled && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', borderRadius: 9999, background: '#F9E4E1', color: '#C0392B', fontSize: 13, fontWeight: 700 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>ยกเลิกแล้ว
        </span>
      )}
      {!cancelled && (
        <div onClick={openCancel} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid #E4C4C0', color: '#C0392B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>Cancel requirement
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
        <div style={{ background: '#FBEEEC', border: '1px solid #E4C4C0', borderRadius: 16, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#F4D4CF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#C0392B' }}>Requirement นี้ถูกยกเลิกแล้ว</div>
            <div style={{ marginTop: 3, fontSize: '12.5px', color: 'var(--muted)' }}>เหตุผล: <b style={{ color: 'var(--text)' }}>{reasonLabel}</b> · ยกเลิกโดย อารยา · วันนี้ · Lead ถูกเปลี่ยนสถานะเป็น &quot;lost&quot; อัตโนมัติ</div>
          </div>
          <div onClick={reopen} style={{ height: 38, padding: '0 16px', borderRadius: 9999, border: '1.5px solid #C0392B', color: '#C0392B', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>เปิดใช้ใหม่</div>
        </div>
      )}

      {/* FLOW B RAIL */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Flow B — Requirement → Shortlist</div>
          <span style={{ fontSize: 12, color: 'var(--muted2)' }}>เช็คว่าง <b style={{ color: 'var(--accent)' }}>ก่อน</b>สร้าง shortlist (FR-AVL-04)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={s.circle}>
                  {s.done && (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>)}
                  {s.current && (<span style={{ width: 8, height: 8, borderRadius: 9999, background: '#fff' }} />)}
                  {s.pending && (<span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted3)' }}>{s.num}</span>)}
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: s.labelColor, whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {s.line && (<div style={{ flex: 1, height: 2, background: s.lineColor, margin: '0 8px', marginBottom: 26 }} />)}
            </div>
          ))}
        </div>
      </div>

      <div id="req-split" style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT: requirement + criteria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ความต้องการของลูกค้า</div>
              <Link href="/admin/leads" style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)' }}>บ. ไทยโลจิสติกส์ →</Link>
            </div>
            <div id="req-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {REQ_FIELDS.map((f, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 12, padding: '13px 15px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{f.k}</div>
                  <div style={{ marginTop: 3, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Special criteria checklist */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>เกณฑ์พิเศษที่ต้องตรวจเทียบ</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted2)', marginBottom: 16 }}>ตรวจทุกข้อก่อนคัดทรัพย์เข้า shortlist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CRITERIA.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={c.icon} />
                  <div style={{ flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.label}</span></div>
                  <span style={c.tag2}>{c.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: availability gate + action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', borderRadius: 16, padding: 22, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(45,251,145,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="1.9"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Availability Gate</div>
                <div style={{ fontSize: '11.5px', color: '#C3FED5' }}>เพิ่มเข้า shortlist ได้เฉพาะทรัพย์ที่ว่าง</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {availChecks.map((a, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <code style={{ ...monoCode, fontSize: 12, fontWeight: 700, color: '#fff' }}>{a.code}</code>
                    <div style={{ fontSize: '11.5px', color: '#B9C2BD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                  </div>
                  <span style={a.style}>{a.result}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <div onClick={openRecheck} style={{ flex: 1, height: 44, borderRadius: 11, background: '#2DFB91', color: '#022310', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>เช็คทรัพย์ใหม่
              </div>
            </div>
          </div>

          <Link href="/admin/shortlists" className="req-shortlist-card" style={{ background: 'var(--surface)', border: '1.5px solid #0D6C3B', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform .2s,box-shadow .2s' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0D6C3B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>สร้าง Shortlist</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>2 ทรัพย์ผ่านเงื่อนไขว่าง พร้อมคัด</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>พื้นที่ที่ต้องการ (priority)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LOCATIONS.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l.rank}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{l.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RE-CHECK DIALOG */}
      {recheckOpen && (
        <div onClick={closeRecheck} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stopProp} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="1.9"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" /><path d="M3 3v5h5" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>เช็คทรัพย์ที่ว่างใหม่</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>สแกนทรัพย์ที่ตรงเกณฑ์ + สอบถามสถานะว่างกับเจ้าของ</div>
              </div>
            </div>
            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
              {scanning && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '20px 0' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 9999, border: '3px solid var(--tint)', borderTopColor: '#0D6C3B', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>กำลังสแกน 246 ทรัพย์…</div>
                  <div style={{ fontSize: 12, color: 'var(--muted3)' }}>เทียบขนาด/งบ/ทำเล + เช็ค valid_until</div>
                </div>
              )}
              {scanDone && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 11, background: '#E8F3EC', marginBottom: 14 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0D6C3B' }}>พบทรัพย์ที่ว่างเพิ่ม 1 รายการ · ตรงเกณฑ์ทั้งหมด</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {RECHECK_RESULTS.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <code style={{ ...monoCode, fontSize: 12, fontWeight: 700, color: '#0D6C3B' }}>{r.code}</code>
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{r.title}</div>
                        </div>
                        {r.isNew && (<span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: '10.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>ว่าง · ใหม่</span>)}
                        {r.existing && (<span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--muted2)', fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>มีอยู่แล้ว</span>)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
              <div onClick={closeRecheck} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ปิด</div>
              {scanDone && (
                <div onClick={addFound} style={{ height: 44, padding: '0 24px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่มเข้า Gate
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CANCEL DIALOG */}
      {cancelOpen && (
        <div onClick={closeCancel} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stopProp} className="a-scroll" style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F9E4E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>ยกเลิก Requirement</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>ต้องระบุเหตุผลและข้อที่เป็นเหตุ</div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)' }}>ข้อ requirement ที่เป็นเหตุ *</label>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CANCEL_REASONS.map(([k, label]) => (
                  <div
                    key={k}
                    onClick={() => setCancelReason(k)}
                    style={{ height: 34, padding: '0 15px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', border: '1.5px solid ' + (cancelReason === k ? '#C0392B' : 'var(--border)'), background: cancelReason === k ? '#F9E4E1' : 'transparent', color: cancelReason === k ? '#C0392B' : 'var(--text)', display: 'flex', alignItems: 'center' }}
                  >{label}</div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)' }}>เหตุผลเพิ่มเติม *</label>
              <textarea placeholder="อธิบายเหตุผลการยกเลิก…" style={{ marginTop: 8, width: '100%', height: 90, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, resize: 'none', outline: 'none', background: 'var(--bg)' }} />
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <div onClick={closeCancel} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ไม่ยกเลิก</div>
              <div onClick={confirmCancel} style={{ height: 44, padding: '0 24px', borderRadius: 9999, background: '#C0392B', color: '#fff', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ยืนยันยกเลิก</div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
