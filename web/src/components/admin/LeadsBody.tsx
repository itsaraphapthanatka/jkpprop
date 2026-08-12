'use client';
import * as React from 'react';
import { loadLeads, relTime, type StoredLead } from '@/lib/leadStore';
import { apiGet, apiPost, apiPatch, ApiClientError } from '@/lib/apiClient';
import Link from 'next/link';

/* Ported from AdminLeads.dc.html <main> — interactive leads split view:
   lead list + detail card (status/agent dropdowns), filter chips,
   follow-up tasks, and timeline/notes. Behavior mirrors the DCLogic.
   Real leads come from GET /api/leads (PII masked unless the caller has the
   'pii' privilege — reveal via POST /api/leads/:id/reveal-contact); the
   porting-era demo rows stay below them so the pipeline pages keep context. */

type Lead = {
  name: string; company: string; country: string; initial: string;
  avBg: string; avFg: string; time: string; status: string; statusK: string;
  source: string; phone: string; email: string; agent: string;
  req?: { k: string; v: string }[]; message?: string; web?: boolean;
  apiId?: string; piiMasked?: boolean;
};

/* GET /api/leads item — StoredLead shape + pipeline fields (leadDto) */
type ApiLead = StoredLead & { status?: string; agentName?: string | null; piiMasked?: boolean };


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

/* map a public requirement-form submission into a Lead row (defensive against
   malformed / hand-edited localStorage records) */
function webToLead(sl: ApiLead): Lead {
  const nm = (sl.name || '').trim();
  const org = (sl.company || '').trim();
  const who = (sl.respondentType || '').trim();
  const typeLabel = sl.typeLabel || sl.typeKey || 'ทรัพย์';
  const intent = sl.dealIntent || '';
  const statusK = sl.status && stMap[sl.status] ? sl.status : 'new';
  // list convention: `name` = organisation, `company` = contact person · context
  const title = org || nm || 'ไม่ระบุชื่อ';
  return {
    name: title,
    company: [nm || '—', who || `ต้องการ${intent}${typeLabel}`].join(' · '),
    country: 'ไทย',
    initial: (title[0] || '?').toUpperCase(),
    avBg: '#273c33', avFg: '#2DFB91',
    time: relTime(sl.createdAt),
    status: statusK, statusK,
    source: sl.source || 'requirement form',
    phone: sl.phone || '—',
    email: sl.email || '—',
    agent: 'มอบหมาย: ' + (sl.agentName || 'ยังไม่มอบหมาย'),
    req: [
      ...(who ? [{ k: 'สถานะผู้ติดต่อ', v: who }] : []),
      ...(org ? [{ k: 'บริษัท / องค์กร', v: org }] : []),
      { k: 'ประเภททรัพย์', v: typeLabel },
      { k: 'ความต้องการ', v: intent },
      ...(Array.isArray(sl.req) ? sl.req : []),
    ],
    message: sl.message || undefined,
    web: true,
    apiId: typeof sl.id === 'string' && !sl.id.startsWith('web-') ? sl.id : undefined,
    piiMasked: !!sl.piiMasked,
  };
}

const ti = (p: string, c: string) => ({ __html: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2">' + p + '</svg>' });

const dd = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: active ? 700 : 600,
  cursor: 'pointer', color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(13,108,59,.06)' : 'transparent',
});

type LeadDetail = {
  notes: { id: string; text: string; createdAt: number; by: string }[];
  tasks: { id: string; title: string; done: boolean; due: number | null; createdAt: number }[];
  linked: {
    requirements: { id: string; code: string; status: string }[];
    shortlists: { id: string; name: string; status: string; count: number }[];
    visits: { id: string; date: number; status: string }[];
  };
};

const noteIcon = ti('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"></path>', '#034956');

const statusLabelMap: Record<string, string> = {
  new: 'New', qualified: 'Qualified', requirements_confirmed: 'Req. confirmed',
  negotiating: 'Negotiating', shortlisted: 'Shortlisted', won: 'Won',
};

const req = [
  { k: 'ต้องการ', v: 'เช่าโกดัง' }, { k: 'ขนาด', v: '2,000–3,500 ตร.ม.' },
  { k: 'งบเช่า', v: '฿150K–250K/ด.' }, { k: 'ต้องการ ร.ง.4', v: 'ใช่' }, { k: 'พื้นที่', v: 'สมุทรปราการ, ชลบุรี' },
];

const panelSm: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 };
const dropdownPanelBase: React.CSSProperties = { position: 'absolute', top: 44, zIndex: 30, width: 190, maxWidth: 'calc(100vw - 16px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 };

/* ---- add-lead modal form ---- */
const COUNTRY_NAMES: Record<string, string> = { TH: 'ไทย', CN: 'จีน', JP: 'ญี่ปุ่น', US: 'สหรัฐฯ', SG: 'สิงคโปร์', OTHER: 'อื่นๆ' };
const COUNTRY_OPTS: [string, string][] = [['TH', 'ไทย (TH)'], ['CN', 'จีน (CN)'], ['JP', 'ญี่ปุ่น (JP)'], ['US', 'สหรัฐฯ (US)'], ['SG', 'สิงคโปร์ (SG)'], ['OTHER', 'อื่นๆ']];
const SOURCE_OPTS = ['requirement form', 'contact form', 'inquiry', 'referral'];
const STATUS_CREATE_OPTS: [string, string][] = [['new', 'New'], ['qualified', 'Qualified'], ['requirements_confirmed', 'Req. confirmed'], ['negotiating', 'Negotiating'], ['shortlisted', 'Shortlisted'], ['won', 'Won']];
const AGENT_OPTS = ['อารยา', 'วีรพล', 'สมชาย', 'ยังไม่มอบหมาย'];
const fLabel: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const fInput: React.CSSProperties = { width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const fSelect: React.CSSProperties = { ...fInput, cursor: 'pointer' };
const fGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 };

export function LeadsBody() {
  const [selected, setSelected] = React.useState(0);
  const [openChip, setOpenChip] = React.useState<string | null>(null);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [agentOpen, setAgentOpen] = React.useState(false);
  const [statusVal, setStatusVal] = React.useState<string | null>(null);
  const [agentVal, setAgentVal] = React.useState<string | null>(null);
  const [taskAdding, setTaskAdding] = React.useState(false);
  const [taskText, setTaskText] = React.useState('');
  /* What the panel shows for this lead, straight from the server.
   *
   * Notes and tasks were POSTed but never read back, so the timeline was four
   * hardcoded events and the task list three hardcoded rows — the same on
   * every lead — and anything typed vanished on refresh. The POST's failure
   * was swallowed too, so a rejected save looked identical to a saved one. */
  const [detail, setDetail] = React.useState<LeadDetail | null>(null);
  const [saveErr, setSaveErr] = React.useState('');
  const [noteText, setNoteText] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: 'ทั้งหมด', agent: 'ทั้งหมด', source: 'ทั้งหมด', date: 'ทุกช่วง' });

  // add-lead
  const [rows, setRows] = React.useState<Lead[]>(leadsData);
  const [webCount, setWebCount] = React.useState(0);

  // real leads from the API, newest first; if the API is unreachable fall
  // back to the localStorage queue the public form keeps offline (§2.2)
  React.useEffect(() => {
    let alive = true;
    apiGet<{ items: ApiLead[] }>('/api/leads')
      .then((r) => {
        if (!alive || !Array.isArray(r.items)) return;
        setRows([...r.items.map(webToLead), ...leadsData]);
        setWebCount(r.items.length);
      })
      .catch(() => {
        const web = loadLeads();
        if (alive && web.length) { setRows([...web.map(webToLead), ...leadsData]); setWebCount(web.length); }
      });
    return () => { alive = false; };
  }, []);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const emptyForm = { name: '', contact: '', country: 'TH', phone: '', email: '', source: 'contact form', statusK: 'new', agent: 'อารยา' };
  const [form, setForm] = React.useState(emptyForm);
  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const canCreate = form.name.trim().length > 0;

  const cur = rows[selected];

  const curApiId = cur?.apiId;
  const loadDetail = React.useCallback(() => {
    if (!curApiId) { setDetail(null); return; }
    apiGet<LeadDetail>(`/api/leads/${curApiId}`)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null));
  }, [curApiId]);
  React.useEffect(loadDetail, [loadDetail]);

  const leads = rows.map((d, i) => ({
    ...d,
    statusStyle: stMap[d.statusK] || stMap.new,
    rowStyle: {
      padding: '13px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
      transition: 'background .15s', background: i === selected ? 'var(--tint)' : 'transparent',
      borderLeft: '3px solid ' + (i === selected ? '#0D6C3B' : 'transparent'),
    } as React.CSSProperties,
    select: () => setSelected(i),
  }));

  /* Real tasks for this lead. `baseTasks` was three fixed rows whose tick box
     called a setState that changed nothing — pure decoration. */
  const serverTasks = detail?.tasks ?? [];
  const fmtDue = (ms: number | null) => (ms
    ? new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(new Date(ms))
    : 'ยังไม่กำหนด');

  const tasks = serverTasks.map((t) => ({
    id: t.id,
    title: t.title,
    due: fmtDue(t.due),
    done: t.done,
    color: t.done ? '#0D6C3B' : '#D9A62B',
    box: {
      width: 16, height: 16, borderRadius: 5, flexShrink: 0, marginTop: 1, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1.5px solid ' + (t.done ? '#0D6C3B' : 'var(--border)'),
      background: t.done ? '#0D6C3B' : 'transparent',
    } as React.CSSProperties,
    toggle: () => {
      if (!cur.apiId) return;
      setSaveErr('');
      apiPatch(`/api/leads/${cur.apiId}/tasks`, { taskId: t.id, done: !t.done })
        .then(loadDetail)
        .catch((e) => setSaveErr(e instanceof ApiClientError ? e.message : 'ติ๊กงานไม่สำเร็จ'));
    },
  }));

  /* The timeline is the notes actually on this lead, newest first, with the
     lead's own creation at the bottom. It used to be the same four invented
     events on every record. */
  const fmtWhen = (ms: number) => relTime(ms);
  const timeline = (detail?.notes ?? [])
    .map((n) => ({ text: n.text, by: n.by, time: fmtWhen(n.createdAt), dotBg: '#E8F3EC', icon: noteIcon }))
    .concat(cur.apiId && detail
      ? [{
        text: `สร้าง lead จาก ${cur.source || 'ฟอร์ม'}`,
        by: 'ระบบ',
        time: cur.time || '',
        dotBg: '#EEF4F3',
        icon: ti('<path d="M12 5v14M5 12h14"></path>', '#034956'),
      }]
      : []);

  /* was a fixed ['Requirement #REQ-1042', 'Shortlist #SL-208', '2 Visits'] */
  const L = detail?.linked;
  const linkedChips = [
    ...(L?.requirements ?? []).map((r) => ({ label: `Requirement ${r.code}`, href: `/admin/requirements/${r.id}` })),
    ...(L?.shortlists ?? []).map((sl) => ({ label: `Shortlist ${sl.name} · ${sl.count} ทรัพย์`, href: `/admin/shortlists/${sl.id}` })),
    ...(L?.visits?.length ? [{ label: `${L.visits.length} Visits`, href: '/admin/visits' }] : []),
  ];

  const curStatus = statusVal || statusLabelMap[cur.statusK];
  const curAgent = agentVal || 'อารยา';

  const statusOptions = ([['New', 'new'], ['Qualified', 'qualified'], ['Req. confirmed', 'requirements_confirmed'], ['Shortlisted', 'shortlisted'], ['Negotiating', 'negotiating'], ['Won', 'won']] as [string, string][]).map(([label, key]) => ({
    label,
    active: curStatus === label,
    select: () => {
      setStatusVal(label);
      setStatusOpen(false);
      // persist for real leads — pipeline is forward-only server-side
      if (cur.apiId) {
        apiPatch(`/api/leads/${cur.apiId}`, { status: key })
          .then(() => setRows((r) => r.map((x, i) => (i === selected ? { ...x, status: key, statusK: stMap[key] ? key : x.statusK } : x))))
          .catch((e) => {
            setStatusVal(null); // roll back the label
            window.alert(e instanceof ApiClientError ? e.message : 'บันทึกสถานะไม่สำเร็จ');
          });
      }
    },
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

  // keep an open filter-chip dropdown clamped inside the viewport on small screens
  const chipPanelRef = React.useRef<HTMLDivElement | null>(null);
  React.useLayoutEffect(() => {
    const el = chipPanelRef.current;
    if (!el || openChip === null) return;
    el.style.left = '0px';
    el.style.right = 'auto';
    const vw = document.documentElement.clientWidth;
    let r = el.getBoundingClientRect();
    let left = 0;
    if (r.right > vw - 8) left = -(r.right - (vw - 8));
    el.style.left = Math.round(left) + 'px';
    r = el.getBoundingClientRect();
    if (r.left < 8) el.style.left = Math.round(left + (8 - r.left)) + 'px';
  }, [openChip]);

  const anyOpen = openChip !== null || statusOpen || agentOpen;
  const closeAll = () => { setOpenChip(null); setStatusOpen(false); setAgentOpen(false); };
  const stopP = (e: React.MouseEvent) => e.stopPropagation();

  const statusChev: React.CSSProperties = statusOpen ? { transform: 'rotate(180deg)', transition: 'transform .2s' } : { transition: 'transform .2s' };
  const agentChev: React.CSSProperties = agentOpen ? { transform: 'rotate(180deg)', transition: 'transform .2s' } : { transition: 'transform .2s' };
  const toggleStatus = () => { setStatusOpen(!statusOpen); setAgentOpen(false); setOpenChip(null); };
  const toggleAgent = () => { setAgentOpen(!agentOpen); setStatusOpen(false); setOpenChip(null); };

  const addTask = () => setTaskAdding(!taskAdding);

  /* Both of these used to add the row to local state and fire a POST whose
     failure was thrown away — so a save that the server rejected looked
     exactly like one that worked, right up until the page was reloaded. The
     row now appears because the server said so. */
  const saveTask = () => {
    const v = taskText.trim();
    if (!v) return;
    if (!cur.apiId) { setSaveErr('lead นี้ยังไม่ได้บันทึกลงระบบ'); return; }
    setSaveErr('');
    apiPost(`/api/leads/${cur.apiId}/tasks`, { title: v })
      .then(() => { setTaskText(''); setTaskAdding(false); loadDetail(); })
      .catch((e) => setSaveErr(e instanceof ApiClientError ? e.message : 'เพิ่มงานไม่สำเร็จ'));
  };

  const saveNote = () => {
    const v = noteText.trim();
    if (!v) return;
    if (!cur.apiId) { setSaveErr('lead นี้ยังไม่ได้บันทึกลงระบบ'); return; }
    setSaveErr('');
    apiPost(`/api/leads/${cur.apiId}/notes`, { text: v })
      .then(() => { setNoteText(''); loadDetail(); })
      .catch((e) => setSaveErr(e instanceof ApiClientError ? e.message : 'บันทึกโน้ตไม่สำเร็จ'));
  };

  const addLead = async () => {
    const name = form.name.trim();
    if (!name || creating) return;
    setCreating(true);
    let apiId: string | undefined;
    let piiMasked = false;
    try {
      const created = await apiPost<ApiLead>('/api/leads', {
        name,
        company: form.contact.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        source: form.source,
        status: form.statusK,
      });
      apiId = typeof created.id === 'string' ? created.id : undefined;
      piiMasked = !!created.piiMasked;
    } catch (e) {
      if (e instanceof ApiClientError && e.status > 0) {
        window.alert(e.message);
        setCreating(false);
        return;
      }
      // network down → keep it locally so nothing typed is lost (§2.2)
    }
    const nl: Lead = {
      name,
      company: (form.contact.trim() || '—') + ' · ' + form.country,
      country: COUNTRY_NAMES[form.country] || form.country,
      initial: name[0] || '?',
      avBg: '#273c33', avFg: '#2DFB91',
      time: 'เมื่อสักครู่',
      status: form.statusK, statusK: form.statusK,
      source: form.source,
      phone: form.phone.trim() || '—',
      email: form.email.trim() || '—',
      agent: 'มอบหมาย: ' + form.agent,
      apiId,
      piiMasked,
    };
    setRows((r) => [nl, ...r]);
    setSelected(0);
    setStatusVal(statusLabelMap[form.statusK] || 'New');
    setAgentVal(form.agent);
    setCreateOpen(false);
    setForm(emptyForm);
    setCreating(false);
  };
  const openCreate = () => { setForm(emptyForm); setCreateOpen(true); closeAll(); };

  return (
    <>
      {/* CREATE LEAD MODAL */}
      {createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stopP} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>เพิ่ม Lead ใหม่</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2 }}>บันทึกผู้สนใจเข้าสู่ระบบงานขาย</div>
              </div>
              <div onClick={() => setCreateOpen(false)} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </div>
            </div>
            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={fLabel}>ชื่อบริษัท / ลูกค้า *</label>
                <input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="เช่น บ. ไทยโลจิสติกส์" style={fInput} autoFocus />
              </div>
              <div style={fGrid}>
                <div><label style={fLabel}>ผู้ติดต่อ</label><input value={form.contact} onChange={(e) => setF('contact', e.target.value)} placeholder="เช่น คุณสมชาย" style={fInput} /></div>
                <div><label style={fLabel}>ประเทศ</label><select value={form.country} onChange={(e) => setF('country', e.target.value)} style={fSelect}>{COUNTRY_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              </div>
              <div style={fGrid}>
                <div><label style={fLabel}>เบอร์โทร</label><input value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="+66 8x-xxx-xxxx" style={fInput} /></div>
                <div><label style={fLabel}>อีเมล</label><input value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="name@company.com" style={fInput} /></div>
              </div>
              <div style={fGrid}>
                <div><label style={fLabel}>แหล่งที่มา</label><select value={form.source} onChange={(e) => setF('source', e.target.value)} style={fSelect}>{SOURCE_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label style={fLabel}>สถานะ</label><select value={form.statusK} onChange={(e) => setF('statusK', e.target.value)} style={fSelect}>{STATUS_CREATE_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              </div>
              <div>
                <label style={fLabel}>มอบหมายให้</label>
                <select value={form.agent} onChange={(e) => setF('agent', e.target.value)} style={fSelect}>{AGENT_OPTS.map((a) => <option key={a} value={a}>{a}</option>)}</select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <div onClick={() => setCreateOpen(false)} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div onClick={addLead} style={{ height: 44, padding: '0 26px', borderRadius: 9999, background: canCreate ? '#0D6C3B' : 'var(--border)', color: canCreate ? '#fff' : 'var(--muted3)', display: 'flex', alignItems: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, cursor: canCreate ? 'pointer' : 'default' }}>
                เพิ่ม Lead
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div ref={chipPanelRef} onClick={stopP} style={{ ...dropdownPanelBase, left: 0 }}>
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
        <div id="lead-addbtn" onClick={openCreate} className="admin-primary-btn" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14"></path></svg>
          เพิ่ม Lead
        </div>
      </div>

      <div id="lead-split" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
        {/* LIST */}
        <div style={{ minWidth: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{42 + (rows.length - leadsData.length)} leads</span>
              {webCount > 0 && <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#E8F3EC', color: '#0D6C3B', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>+{webCount} จากเว็บ</span>}
            </span>
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
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              {cur.piiMasked && cur.apiId && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    apiPost<{ phone: string; email: string }>(`/api/leads/${cur.apiId}/reveal-contact`)
                      .then((full) => setRows((r) => r.map((x, i) => (i === selected ? { ...x, phone: full.phone || '—', email: full.email || '—', piiMasked: false } : x))))
                      .catch((err) => window.alert(err instanceof ApiClientError ? err.message : 'เปิดดูข้อมูลติดต่อไม่สำเร็จ'));
                  }}
                  title="การเปิดดูจะถูกบันทึกลง Audit log ตาม PDPA"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                  ดูข้อมูลติดต่อเต็ม
                </a>
              )}
              <Link id="lead-openreq" href="/admin/requirements" className="admin-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: '12.5px', fontWeight: 700, marginLeft: 'auto' }}>
                เปิด Requirement
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
              </Link>
            </div>
          </div>

          <div id="lead-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* requirement summary */}
            <div style={panelSm}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>สรุปความต้องการ</span>
                {cur.web && <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>จากฟอร์มเว็บ</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {(cur.req && cur.req.length ? cur.req : req).map((q, qi) => (
                  <div key={q.k + qi} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--muted)', flexShrink: 0 }}>{q.k}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{q.v}</span>
                  </div>
                ))}
              </div>
              {cur.message && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>ข้อความจากลูกค้า</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{cur.message}</div>
                </div>
              )}
              {/* the linked records used to be hidden whenever the customer had
                  left a message — two different things sharing one slot */}
              {cur.apiId && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {linkedChips.length === 0 && (
                    <span style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>ยังไม่มี requirement / shortlist / นัดชม ที่ผูกกับ lead นี้</span>
                  )}
                  {linkedChips.map((lk) => (
                    <Link key={lk.href + lk.label} href={lk.href} style={{ height: 26, padding: '0 11px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>{lk.label}</Link>
                  ))}
                </div>
              )}
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
                  <input id="lead-task-input" value={taskText} onChange={(e) => setTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveTask(); }} placeholder="งานใหม่…" style={{ flex: 1, minWidth: 0, height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #0D6C3B', fontFamily: 'inherit', fontSize: '12.5px', background: 'var(--surface)', outline: 'none' }} />
                  <div id="lead-task-save" onClick={saveTask} style={{ height: 38, padding: '0 14px', borderRadius: 10, background: '#0D6C3B', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>เพิ่ม</div>
                </div>
              )}
              {saveErr && (
                <div id="lead-save-error" style={{ marginBottom: 9, padding: '9px 11px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12px', fontWeight: 600 }}>{saveErr}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {tasks.length === 0 && (
                  <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--muted3)' }}>ยังไม่มีงานติดตาม</div>
                )}
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
              <input id="lead-note-input" value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveNote(); }} placeholder="เพิ่มบันทึก…" style={{ flex: 1, minWidth: 0, height: 42, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg)', outline: 'none' }} />
              <div id="lead-note-save" onClick={saveNote} style={{ height: 42, padding: '0 18px', borderRadius: 11, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>บันทึก</div>
            </div>
            {saveErr && (
              <div style={{ marginBottom: 14, padding: '9px 11px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12px', fontWeight: 600 }}>{saveErr}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {timeline.length === 0 && (
                <div style={{ padding: '18px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--muted3)' }}>
                  {cur.apiId ? 'ยังไม่มีบันทึก' : 'lead นี้ยังไม่ได้บันทึกลงระบบ'}
                </div>
              )}
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
