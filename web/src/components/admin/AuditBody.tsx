'use client';

import * as React from 'react';
import { apiGet, ApiClientError } from '@/lib/apiClient';

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

/* No sample entries. An audit trail is the page somebody opens to settle an
   argument about who changed what — filling it with invented rows (สมชาย
   แก้ราคาเช่า, อารยา ปิดดีลสำเร็จ, complete with IP addresses and before/after
   values) is worse than showing nothing, and they appeared for anyone without
   the 'audit' privilege, which is when the API 403s. */

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

/* GET /api/audit row */
type ApiLog = {
  id: string; user: string; action: string; tag: string; entity: string;
  entityType: string; createdAt: number; ip: string; before?: string; after?: string;
};

const TAG_STYLE: Record<string, React.CSSProperties> = {
  CREATE: tag(CREATE.bg, CREATE.fg),
  UPDATE: tag(UPDATE.bg, UPDATE.fg),
  DELETE: tag(DELETE.bg, DELETE.fg),
  PUBLISH: tag(PUBLISH.bg, PUBLISH.fg),
  SECURITY: tag(SEC.bg, SEC.fg),
};
const TAG_DOT: Record<string, string> = { CREATE: '#E8F3EC', UPDATE: '#EEF4F3', DELETE: '#F9E4E1', PUBLISH: '#FBF3E1', SECURITY: '#F0ECF9' };
const TAG_ICON: Record<string, { __html: string }> = {
  CREATE: li('<path d="M12 5v14M5 12h14"></path>', '#0D6C3B'),
  UPDATE: li('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"></path>', '#034956'),
  DELETE: li('<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>', '#C0392B'),
  PUBLISH: li('<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"></path>', '#9A741C'),
  SECURITY: li('<rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 019.9-1"></path>', '#7A3FB0'),
};

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const stamp = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()} ${TH_MONTH[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const ago = (ms: number) => {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาที`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'เมื่อวาน' : `${d} วัน`;
};

function apiToEntry(l: ApiLog): LogEntry {
  const t = TAG_STYLE[l.tag] ? l.tag : 'UPDATE';
  return {
    user: l.user,
    action: l.action,
    tag: t,
    tagStyle: TAG_STYLE[t],
    entity: l.entity,
    time: stamp(l.createdAt),
    ip: l.ip,
    ago: ago(l.createdAt),
    dotBg: TAG_DOT[t],
    icon: TAG_ICON[t],
    hasDiff: !!(l.before || l.after),
    before: l.before,
    after: l.after,
  };
}

export function AuditBody() {
  const [openFilter, setOpenFilter] = React.useState<FilterKey | null>(null);
  const [action, setAction] = React.useState('ทุก action');
  const [entity, setEntity] = React.useState('ทุก entity');
  const [dateR, setDateR] = React.useState('ช่วงวันที่');
  const [shown, setShown] = React.useState(8);

  /* real audit trail — needs the 'audit' privilege; without it the API 403s
     and the porting-era sample rows stay on screen */
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [denied, setDenied] = React.useState(false);
  const [total, setTotal] = React.useState<number | null>(null);
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (!entity.startsWith('ทุก')) params.set('entity', entity);
    apiGet<{ items: ApiLog[] }>(`/api/audit?${params}`)
      .then((r) => {
        if (!Array.isArray(r.items)) return;
        const rows = action.startsWith('ทุก') ? r.items : r.items.filter((l) => l.tag === action);
        setLogs(rows.map(apiToEntry));
        setTotal(rows.length);
      })
      .catch((e) => { setDenied(e instanceof ApiClientError ? e.status === 403 : false); })
      .finally(() => setLoaded(true));
  }, [entity, action]);

  const anyFilterOpen = openFilter !== null;
  const closeFilters = () => setOpenFilter(null);
  const loadMoreLabel = shown < logs.length ? 'โหลดเพิ่ม' : 'โหลดครบแล้ว';
  const loadMore = () => setShown((n) => n + 8);

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
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{(total ?? logs.length).toLocaleString('th-TH')} รายการ</span>
          <span style={{ fontSize: 12, color: 'var(--muted2)' }}>เก็บ before/after JSON ทุก mutation</span>
        </div>
        <div className="a-scroll">
          {loaded && !logs.length && (
            <div id="audit-empty" style={{ padding: '34px 18px', textAlign: 'center', fontSize: 13, color: 'var(--muted3)', lineHeight: 1.7 }}>
              {denied
                ? 'บัญชีนี้ไม่มีสิทธิ์ดูบันทึกการใช้งาน — ขอสิทธิ์ audit จากเจ้าของระบบ'
                : 'ยังไม่มีบันทึกการใช้งานในช่วงที่เลือก'}
            </div>
          )}
          {logs.slice(0, shown).map((l, i) => (
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
