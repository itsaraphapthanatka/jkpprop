'use client';

import * as React from 'react';

/* Ported verbatim from AdminAudit.dc.html — audit log filter bar
   (action / entity / date-range dropdowns), before/after diff log
   list, and load-more footer. The export-CSV topbar button lives in
   AuditExport (rendered as AdminShell's `actions`). */

const CREATE = { bg: '#E8F3EC', fg: '#0D6C3B' };
const UPDATE = { bg: '#EEF4F3', fg: '#034956' };
const DELETE = { bg: '#F9E4E1', fg: '#C0392B' };
const PUBLISH = { bg: '#FBF3E1', fg: '#9A741C' };
const SEC = { bg: '#F0ECF9', fg: '#7A3FB0' };

const li = (p: string, c: string) => ({
  __html: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2">' + p + '</svg>',
});

const tag = (bg: string, fg: string): React.CSSProperties => ({
  height: 20,
  padding: '0 9px',
  borderRadius: 9999,
  background: bg,
  color: fg,
  fontSize: 10,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
});

type LogEntry = {
  user: string;
  action: string;
  tag: string;
  tagStyle: React.CSSProperties;
  entity: string;
  time: string;
  ip: string;
  ago: string;
  dotBg: string;
  icon: { __html: string };
  hasDiff: boolean;
  before?: string;
  after?: string;
};

const LOGS: LogEntry[] = [
  { user: 'สมชาย', action: 'แก้ราคาเช่า', tag: 'UPDATE', tagStyle: tag(UPDATE.bg, UPDATE.fg), entity: 'listing/JKP-CBI0007', time: '18 ก.ค. 11:15', ip: '203.150.x.x', ago: '2 นาที', dotBg: '#EEF4F3', icon: li('<path d="M12 1v22M5 8h14M5 16h14"></path>', '#034956'), hasDiff: true, before: '฿42,000/ด.', after: '฿45,000/ด.' },
  { user: 'สมชาย', action: 'เผยแพร่ประกาศ', tag: 'PUBLISH', tagStyle: tag(PUBLISH.bg, PUBLISH.fg), entity: 'listing/JKP-SPK0042', time: '18 ก.ค. 09:20', ip: '203.150.x.x', ago: '2 ชม.', dotBg: '#FBF3E1', icon: li('<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"></path>', '#9A741C'), hasDiff: true, before: 'draft', after: 'published' },
  { user: 'อารยา', action: 'ปิดดีลสำเร็จ', tag: 'UPDATE', tagStyle: tag(UPDATE.bg, UPDATE.fg), entity: 'deal/DEAL-089', time: '18 ก.ค. 08:40', ip: '171.96.x.x', ago: '3 ชม.', dotBg: '#E8F3EC', icon: li('<path d="M20 6L9 17l-5-5"></path>', '#0D6C3B'), hasDiff: true, before: 'signed', after: 'closed · won' },
  { user: 'กิตติพงษ์', action: 'ปลดล็อกฟิลด์การเงิน (override)', tag: 'SECURITY', tagStyle: tag(SEC.bg, SEC.fg), entity: 'deal/DEAL-071', time: '17 ก.ค. 16:30', ip: '203.150.x.x', ago: 'เมื่อวาน', dotBg: '#F0ECF9', icon: li('<rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 019.9-1"></path>', '#7A3FB0'), hasDiff: false },
  { user: 'วีรพล', action: 'เพิ่มทรัพย์ใหม่', tag: 'CREATE', tagStyle: tag(CREATE.bg, CREATE.fg), entity: 'property/JKP-RYG2081', time: '17 ก.ค. 14:05', ip: '171.96.x.x', ago: 'เมื่อวาน', dotBg: '#E8F3EC', icon: li('<path d="M12 5v14M5 12h14"></path>', '#0D6C3B'), hasDiff: false },
  { user: 'ณัฐพร', action: 'แก้บทความ (TH)', tag: 'UPDATE', tagStyle: tag(UPDATE.bg, UPDATE.fg), entity: 'article/why-port-location', time: '17 ก.ค. 10:20', ip: '184.22.x.x', ago: 'เมื่อวาน', dotBg: '#EEF4F3', icon: li('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"></path>', '#034956'), hasDiff: false },
  { user: 'กิตติพงษ์', action: 'ปิดใช้งานผู้ใช้', tag: 'SECURITY', tagStyle: tag(SEC.bg, SEC.fg), entity: 'user/natthaporn@jkp.co', time: '16 ก.ค. 17:50', ip: '203.150.x.x', ago: '2 วัน', dotBg: '#F0ECF9', icon: li('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 11l-3 3M19 11l3 3"></path>', '#7A3FB0'), hasDiff: true, before: 'active', after: 'disabled' },
  { user: 'อารยา', action: 'ลบ media', tag: 'DELETE', tagStyle: tag(DELETE.bg, DELETE.fg), entity: 'media/old-hero-3.jpg', time: '16 ก.ค. 13:10', ip: '171.96.x.x', ago: '2 วัน', dotBg: '#F9E4E1', icon: li('<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>', '#C0392B'), hasDiff: false },
];

type FilterKey = 'action' | 'entity' | 'dateR';

const ACTION_OPTS = ['ทุก action', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'SECURITY'];
const ENTITY_OPTS = ['ทุก entity', 'listing', 'property', 'deal', 'article', 'user', 'media'];
const DATE_OPTS = ['ช่วงวันที่', 'วันนี้', '7 วัน', '30 วัน'];

/** Topbar right cluster: single Export CSV button with a transient
    "downloaded" confirmation state (resets after 1.8s). */
export function AuditExport() {
  const [exported, setExported] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportLabel = exported ? 'ดาวน์โหลดแล้ว ✓' : 'Export CSV';
  const exportCsv = () => {
    setExported(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setExported(false), 1800);
  };
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div onClick={exportCsv} style={{ height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>{exportLabel}
      </div>
    </div>
  );
}

export function AuditBody() {
  const [openFilter, setOpenFilter] = React.useState<FilterKey | null>(null);
  const [action, setAction] = React.useState('ทุก action');
  const [entity, setEntity] = React.useState('ทุก entity');
  const [dateR, setDateR] = React.useState('ช่วงวันที่');
  const [shown, setShown] = React.useState(8);

  const anyFilterOpen = openFilter !== null;
  const closeFilters = () => setOpenFilter(null);
  const loadMoreLabel = shown >= 8 ? 'โหลดเพิ่ม' : 'โหลดครบแล้ว';
  const loadMore = () => setShown(shown + 8);

  const dd = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '9px 11px',
    borderRadius: 9,
    fontSize: '12.5px',
    fontWeight: active ? 700 : 600,
    cursor: 'pointer',
    color: active ? '#0D6C3B' : 'var(--text)',
    background: active ? 'rgba(13,108,59,.06)' : 'transparent',
  });

  const fdef = (key: FilterKey, cur: string, opts: string[], setVal: (v: string) => void) => {
    const isDefault = cur.indexOf('ทุก') === 0 || cur.indexOf('ช่วง') === 0;
    const open = openFilter === key;
    return {
      key,
      label: cur,
      open,
      chev: (open
        ? { transform: 'rotate(180deg)', transition: 'transform .2s' }
        : { transition: 'transform .2s' }) as React.CSSProperties,
      toggle: () => setOpenFilter(open ? null : key),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        height: 40,
        padding: '0 14px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        background: isDefault ? 'var(--bg)' : '#273c33',
        color: isDefault ? 'var(--text)' : '#fff',
        border: '1px solid ' + (isDefault ? 'var(--border)' : '#273c33'),
      } as React.CSSProperties,
      options: opts.map((o) => ({
        label: o,
        active: cur === o,
        select: () => { setVal(o); setOpenFilter(null); },
        style: dd(cur === o),
      })),
    };
  };

  const filters = [
    fdef('action', action, ACTION_OPTS, setAction),
    fdef('entity', entity, ENTITY_OPTS, setEntity),
    fdef('dateR', dateR, DATE_OPTS, setDateR),
  ];

  return (
    <>
      {/* FILTER BAR */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, position: 'relative' }}>
        {anyFilterOpen && <div onClick={closeFilters} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input placeholder="ค้นหา user / entity / action" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
        </div>
        {filters.map((f) => (
          <div key={f.key} style={{ position: 'relative', zIndex: 25 }}>
            <div onClick={f.toggle} style={f.style}>
              {f.label}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4" style={f.chev}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {f.open && (
              <div style={{ position: 'absolute', top: 46, right: 0, zIndex: 30, width: 180, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}>
                {f.options.map((o) => (
                  <div key={o.label} onClick={o.select} style={o.style}>
                    <span>{o.label}</span>
                    {o.active && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* LOG LIST */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>2,847 รายการ</span>
          <span style={{ fontSize: 12, color: 'var(--muted2)' }}>เก็บ before/after JSON ทุก mutation</span>
        </div>
        <div className="a-scroll">
          {LOGS.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '15px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9999, background: l.dotBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={l.icon} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13.5px', color: 'var(--text)' }}><b>{l.user}</b> {l.action}</span>
                  <span style={l.tagStyle}>{l.tag}</span>
                </div>
                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <code style={{ fontSize: '11.5px', color: '#0D6C3B', fontWeight: 700 }}>{l.entity}</code>
                  <span style={{ fontSize: 11, color: 'var(--muted3)' }}>· {l.time} · IP {l.ip}</span>
                </div>
                {l.hasDiff && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: '#F9E9E7' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#C0392B' }}>เดิม</span>
                      <code style={{ fontSize: 11, color: '#8A3A32', textDecoration: 'line-through' }}>{l.before}</code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: '#E8F3EC' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0D6C3B' }}>ใหม่</span>
                      <code style={{ fontSize: 11, color: '#0D6C3B' }}>{l.after}</code>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{l.ago}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={loadMore} style={{ height: 38, padding: '0 20px', borderRadius: 9999, border: '1px solid var(--border)', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            {loadMoreLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>
      </div>
    </>
  );
}
