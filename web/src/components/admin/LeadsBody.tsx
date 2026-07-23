'use client';
import * as React from 'react';

/* Ported from AdminLeads.dc.html <main> — interactive leads split view:
   lead list + detail card (status/agent dropdowns), filter chips,
   follow-up tasks, and timeline/notes. Behavior mirrors the DCLogic. */

type Lead = {
  name: string; company: string; country: string; initial: string;
  avBg: string; avFg: string; time: string; status: string; statusK: string;
  source: string; phone: string; email: string; agent: string;
};

type Task = { title: string; due: string; color: string; done?: boolean };

const st = (bg: string, fg: string): React.CSSProperties => ({
  height: 20, padding: '0 9px', borderRadius: 9999, background: bg, color: fg,
  fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center',
});

const stMap: Record<string, React.CSSProperties> = {
  new: st('#EEF4F3', '#034956'),
  qualified: st('#E8F3EC', '#0D6C3B'),
  requirements_confirmed: st('#E8F3EC', '#0D6C3B'),
  negotiating: st('#273c33', '#fff'),
  shortlisted: st('#E8F3EC', '#0D6C3B'),
  won: st('#0D6C3B', '#fff'),
};

const leadsData: Lead[] = [
  { name: 'บ. ไทยโลจิสติกส์', company: 'คุณสมหมาย · TH', country: 'ไทย', initial: 'ท', avBg: '#E8F3EC', avFg: '#0D6C3B', time: '5น.', status: 'new', statusK: 'new', source: 'requirement form', phone: '+66 81-234-5678', email: 'somchai@thailog.co.th', agent: 'มอบหมาย: อารยา' },
  { name: 'Sunrise Foods Ltd.', company: 'Mr. Lee · CN', country: 'จีน', initial: 'S', avBg: '#EEF4F3', avFg: '#034956', time: '22น.', status: 'qualified', statusK: 'qualified', source: 'contact form', phone: '+86 138-0000-1111', email: 'lee@sunrise.cn', agent: 'มอบหมาย: วีรพล' },
  { name: 'Metro Pack Co.', company: 'คุณวิภา · TH', country: 'ไทย', initial: 'M', avBg: '#FBF3E1', avFg: '#9A741C', time: '1ชม.', status: 'negotiating', statusK: 'negotiating', source: 'inquiry', phone: '+66 89-999-0000', email: 'wipa@metropack.com', agent: 'มอบหมาย: อารยา' },
  { name: 'Nippon Steel TH', company: 'Mr. Tanaka · JP', country: 'ญี่ปุ่น', initial: 'N', avBg: '#EEF4F3', avFg: '#034956', time: '3ชม.', status: 'shortlisted', statusK: 'shortlisted', source: 'requirement form', phone: '+66 2-100-2000', email: 'tanaka@nsteel.co.th', agent: 'มอบหมาย: วีรพล' },
  { name: 'บ. เอเชีย โกลด์', company: 'คุณธนา · TH', country: 'ไทย', initial: 'อ', avBg: '#E8F3EC', avFg: '#0D6C3B', time: 'เมื่อวาน', status: 'requirements_confirmed', statusK: 'requirements_confirmed', source: 'contact form', phone: '+66 81-555-4444', email: 'thana@asiagold.co.th', agent: 'มอบหมาย: อารยา' },
  { name: 'Global Ware Inc.', company: 'Ms. Chen · CN', country: 'จีน', initial: 'G', avBg: '#0D6C3B', avFg: '#fff', time: '2 วัน', status: 'won', statusK: 'won', source: 'referral', phone: '+86 139-8888-7777', email: 'chen@globalware.cn', agent: 'มอบหมาย: วีรพล' },
];

const ti = (p: string, c: string) => ({ __html: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2">' + p + '</svg>' });

const dd = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: active ? 700 : 600,
  cursor: 'pointer', color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(13,108,59,.06)' : 'transparent',
});

const baseTasks: Task[] = [
  { title: 'โทรกลับยืนยันความต้องการ', due: 'วันนี้ 15:00', color: '#C0392B' },
  { title: 'เตรียม shortlist 5 รายการ', due: 'พรุ่งนี้', color: '#D9A62B' },
  { title: 'ส่งโบรชัวร์ EN', due: '2 วัน', color: '#0D6C3B' },
];

const baseTimeline = [
  { text: 'ระบบสร้าง lead จากฟอร์ม requirement', by: 'ระบบ', time: 'วันนี้ 09:05', dotBg: '#EEF4F3', icon: ti('<path d="M12 5v14M5 12h14"></path>', '#034956') },
  { text: 'มอบหมายให้ อารยา', by: 'ops', time: 'วันนี้ 09:20', dotBg: '#EEF4F3', icon: ti('<circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>', '#034956') },
  { text: 'โทรครั้งแรก — ลูกค้าสนใจโซนบางนา', by: 'อารยา', time: 'วันนี้ 10:40', dotBg: '#E8F3EC', icon: ti('<path d="M22 16.9v3a2 2 0 01-2.2 2A19.8 19.8 0 013 5.2 2 2 0 015 3h3a2 2 0 012 1.7l.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5l2.8.7A2 2 0 0122 16.9z"></path>', '#0D6C3B') },
  { text: 'requirement confirmed → เลื่อนสถานะอัตโนมัติ', by: 'ระบบ', time: 'วันนี้ 11:15', dotBg: '#E8F3EC', icon: ti('<path d="M20 6L9 17l-5-5"></path>', '#0D6C3B') },
];

const noteIcon = ti('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"></path>', '#034956');

const statusLabelMap: Record<string, string> = {
  new: 'New', qualified: 'Qualified', requirements_confirmed: 'Req. confirmed',
  negotiating: 'Negotiating', shortlisted: 'Shortlisted', won: 'Won',
};

const req = [
  { k: 'ต้องการ', v: 'เช่าโกดัง' }, { k: 'ขนาด', v: '2,000–3,500 ตร.ม.' },
  { k: 'งบเช่า', v: '฿150K–250K/ด.' }, { k: 'ต้องการ ร.ง.4', v: 'ใช่' }, { k: 'พื้นที่', v: 'สมุทรปราการ, ชลบุรี' },
];
const linked = ['Requirement #REQ-1042', 'Shortlist #SL-208', '2 Visits'];

const panelSm: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 };
const dropdownPanelBase: React.CSSProperties = { position: 'absolute', top: 44, zIndex: 30, width: 190, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 };

export function LeadsBody() {
  const [selected, setSelected] = React.useState(0);
  const [openChip, setOpenChip] = React.useState<string | null>(null);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [agentOpen, setAgentOpen] = React.useState(false);
  const [statusVal, setStatusVal] = React.useState<string | null>(null);
  const [agentVal, setAgentVal] = React.useState<string | null>(null);
  const [taskAdding, setTaskAdding] = React.useState(false);
  const [taskText, setTaskText] = React.useState('');
  const [extraTasks, setExtraTasks] = React.useState<Task[]>([]);
  const [noteText, setNoteText] = React.useState('');
  const [extraNotes, setExtraNotes] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: 'ทั้งหมด', agent: 'ทั้งหมด', source: 'ทั้งหมด', date: 'ทุกช่วง' });
  const [, setBaseDone] = React.useState<Record<string, boolean>>({});

  const cur = leadsData[selected];

  const leads = leadsData.map((d, i) => ({
    ...d,
    statusStyle: stMap[d.statusK] || stMap.new,
    rowStyle: {
      padding: '13px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
      transition: 'background .15s', background: i === selected ? 'var(--tint)' : 'transparent',
      borderLeft: '3px solid ' + (i === selected ? '#0D6C3B' : 'transparent'),
    } as React.CSSProperties,
    select: () => setSelected(i),
  }));

  const allTasks = baseTasks.concat(extraTasks);
  const tasks = allTasks.map((t, i) => {
    const done = !!t.done;
    return {
      ...t,
      done,
      box: {
        width: 16, height: 16, borderRadius: 5, flexShrink: 0, marginTop: 1, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid ' + (done ? '#0D6C3B' : (t.color || 'var(--border)')),
        background: done ? '#0D6C3B' : 'transparent',
      } as React.CSSProperties,
      toggle: () => {
        if (i >= baseTasks.length) {
          const j = i - baseTasks.length;
          setExtraTasks((ex) => ex.map((it, k) => (k === j ? { ...it, done: !it.done } : it)));
        } else {
          setBaseDone((bd) => ({ ...bd }));
        }
      },
    };
  });

  const timeline = extraNotes
    .map((n) => ({ text: n, by: 'คุณ', time: 'เมื่อสักครู่', dotBg: '#E8F3EC', icon: noteIcon }))
    .concat(baseTimeline);

  const curStatus = statusVal || statusLabelMap[cur.statusK];
  const curAgent = agentVal || 'อารยา';

  const statusOptions = ([['New', 'new'], ['Qualified', 'qualified'], ['Req. confirmed', 'req'], ['Shortlisted', 'shortlisted'], ['Negotiating', 'negotiating'], ['Won', 'won']] as [string, string][]).map(([label]) => ({
    label,
    active: curStatus === label,
    select: () => { setStatusVal(label); setStatusOpen(false); },
    style: dd(curStatus === label),
  }));

  const agentOptions = ['อารยา', 'วีรพล', 'สมชาย', 'ยังไม่มอบหมาย'].map((label) => ({
    label,
    active: curAgent === label,
    select: () => { setAgentVal(label); setAgentOpen(false); },
    style: dd(curAgent === label),
  }));

  const chipDef = (key: string, prefix: string, opts: string[]) => {
    const val = filters[key];
    const active = openChip === key;
    const chipActive = (val !== 'ทั้งหมด' && val !== 'ทุกช่วง') || active;
    return {
      key,
      label: prefix + ': ' + val,
      open: active,
      chev: chipActive ? '#fff' : 'var(--muted2)',
      chevStyle: (active ? { transform: 'rotate(180deg)', transition: 'transform .2s' } : { transition: 'transform .2s' }) as React.CSSProperties,
      toggle: () => { setOpenChip(active ? null : key); setStatusOpen(false); setAgentOpen(false); },
      style: {
        display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 15px', borderRadius: 9999,
        fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
        background: chipActive ? '#273c33' : 'var(--surface)',
        color: chipActive ? '#fff' : 'var(--muted)',
        border: '1px solid ' + (chipActive ? '#273c33' : 'var(--border)'),
      } as React.CSSProperties,
      options: opts.map((o) => ({ label: o, active: val === o, select: () => { setFilters({ ...filters, [key]: o }); setOpenChip(null); }, style: dd(val === o) })),
    };
  };

  const filterChips = [
    chipDef('status', 'สถานะ', ['ทั้งหมด', 'New', 'Qualified', 'Negotiating', 'Won']),
    chipDef('agent', 'Agent', ['ทั้งหมด', 'อารยา', 'วีรพล', 'สมชาย']),
    chipDef('source', 'Source', ['ทั้งหมด', 'requirement form', 'contact form', 'inquiry', 'referral']),
    chipDef('date', 'ช่วงวันที่', ['ทุกช่วง', 'วันนี้', '7 วัน', '30 วัน']),
  ];

  const anyOpen = openChip !== null || statusOpen || agentOpen;
  const closeAll = () => { setOpenChip(null); setStatusOpen(false); setAgentOpen(false); };
  const stopP = (e: React.MouseEvent) => e.stopPropagation();

  const statusChev: React.CSSProperties = statusOpen ? { transform: 'rotate(180deg)', transition: 'transform .2s' } : { transition: 'transform .2s' };
  const agentChev: React.CSSProperties = agentOpen ? { transform: 'rotate(180deg)', transition: 'transform .2s' } : { transition: 'transform .2s' };
  const toggleStatus = () => { setStatusOpen(!statusOpen); setAgentOpen(false); setOpenChip(null); };
  const toggleAgent = () => { setAgentOpen(!agentOpen); setStatusOpen(false); setOpenChip(null); };

  const addTask = () => setTaskAdding(!taskAdding);
  const saveTask = () => { const v = taskText.trim(); if (!v) return; setExtraTasks([...extraTasks, { title: v, due: 'ยังไม่กำหนด', color: '#0D6C3B' }]); setTaskText(''); setTaskAdding(false); };
  const saveNote = () => { const v = noteText.trim(); if (!v) return; setExtraNotes([v, ...extraNotes]); setNoteText(''); };

  return (
    <>
      {/* FILTER CHIPS */}
      <div style={{ position: 'relative', display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {anyOpen && <div onClick={closeAll} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />}
        {filterChips.map((c) => (
          <div key={c.key} style={{ position: 'relative' }}>
            <div onClick={c.toggle} style={c.style}>
              {c.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.chev} strokeWidth="2.4" style={c.chevStyle}><path d="M6 9l6 6 6-6"></path></svg>
            </div>
            {c.open && (
              <div onClick={stopP} style={{ ...dropdownPanelBase, left: 0 }}>
                {c.options.map((o) => (
                  <div key={o.label} onClick={o.select} style={o.style}>
                    <span>{o.label}</span>
                    {o.active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5"></path></svg>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div id="lead-split" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
        {/* LIST */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>42 leads</span>
            <span style={{ fontSize: 12, color: 'var(--muted2)' }}>เรียง: ใหม่ล่าสุด</span>
          </div>
          <div className="a-scroll" style={{ maxHeight: 660, overflowY: 'auto' }}>
            {leads.map((l, i) => (
              <div key={i} onClick={l.select} style={l.rowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9999, background: l.avBg, color: l.avFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{l.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted3)', flexShrink: 0 }}>{l.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.company}</div>
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={l.statusStyle}>{l.status}</span>
                      <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{l.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DETAIL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* header card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 9999, background: '#273c33', color: '#2DFB91', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800 }}>{cur.initial}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{cur.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{cur.company} · {cur.country}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {/* status dropdown */}
                <div style={{ position: 'relative' }}>
                  <div onClick={toggleStatus} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#0D6C3B' }} />
                    {curStatus}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4" style={statusChev}><path d="M6 9l6 6 6-6"></path></svg>
                  </div>
                  {statusOpen && (
                    <div onClick={stopP} style={{ ...dropdownPanelBase, right: 0 }}>
                      {statusOptions.map((o) => (
                        <div key={o.label} onClick={o.select} style={o.style}>
                          <span>{o.label}</span>
                          {o.active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5"></path></svg>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* agent dropdown */}
                <div style={{ position: 'relative' }}>
                  <div onClick={toggleAgent} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 10, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path></svg>
                    มอบหมาย: {curAgent}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" style={agentChev}><path d="M6 9l6 6 6-6"></path></svg>
                  </div>
                  {agentOpen && (
                    <div onClick={stopP} style={{ ...dropdownPanelBase, right: 0 }}>
                      {agentOptions.map((o) => (
                        <div key={o.label} onClick={o.select} style={o.style}>
                          <span>{o.label}</span>
                          {o.active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5"></path></svg>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"></path></svg>
                {cur.phone}
              </a>
              <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 6l-10 7L2 6"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                {cur.email}
              </a>
              <a href="/admin/requirements" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: '12.5px', fontWeight: 700, marginLeft: 'auto' }}>
                เปิด Requirement
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* requirement summary */}
            <div style={panelSm}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>สรุปความต้องการ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {req.map((q) => (
                  <div key={q.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{q.k}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{q.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {linked.map((lk) => (
                  <span key={lk} style={{ height: 26, padding: '0 11px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>{lk}</span>
                ))}
              </div>
            </div>

            {/* tasks */}
            <div style={panelSm}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>งานติดตาม</span>
                <span onClick={addTask} style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"></path></svg>
                </span>
              </div>
              {taskAdding && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 9 }}>
                  <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="งานใหม่…" style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #0D6C3B', fontFamily: 'inherit', fontSize: '12.5px', background: 'var(--surface)', outline: 'none' }} />
                  <div onClick={saveTask} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#0D6C3B', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>เพิ่ม</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {tasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 11, background: 'var(--bg)' }}>
                    <div onClick={t.toggle} style={t.box}>
                      {t.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5"></path></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: t.done ? 'var(--muted3)' : 'var(--text)', ...(t.done ? { textDecoration: 'line-through' } : {}) }}>{t.title}</div>
                      <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted3)' }}>{t.due}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* timeline */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Timeline &amp; Notes</div>
            <div style={{ display: 'flex', gap: 10, margin: '12px 0 18px' }}>
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="เพิ่มบันทึก…" style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg)', outline: 'none' }} />
              <div onClick={saveNote} style={{ height: 42, padding: '0 18px', borderRadius: 11, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>บันทึก</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {timeline.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9999, background: e.dotBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={e.icon} />
                    <div style={{ flex: 1, width: 2, background: 'var(--border)', marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{e.text}</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted3)' }}>{e.by} · {e.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
