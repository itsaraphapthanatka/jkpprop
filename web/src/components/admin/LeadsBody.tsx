'use client';
import * as React from 'react';
import { loadLeads, relTime, type StoredLead } from '@/lib/leadStore';
import { apiGet, apiPost, apiPatch, ApiClientError } from '@/lib/apiClient';
import Link from 'next/link';
import { thumb } from '@/lib/mediaThumb';
import { PROPERTY_TYPES, propertyType } from '@/lib/propertySchema';

/* Ported from AdminLeads.dc.html <main> — interactive leads split view:
   lead list + detail card (status/agent dropdowns), filter chips,
   follow-up tasks, and timeline/notes. Behavior mirrors the DCLogic.
   Real leads come from GET /api/leads (PII masked unless the caller has the
   'pii' privilege — reveal via POST /api/leads/:id/reveal-contact). There is
   nothing else in the list: the porting-era demo rows used to sit underneath
   the real ones, so a CRM with no leads yet showed six invented companies with
   working-looking phone numbers next to whatever had actually come in. */

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

const noteIcon = ti('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"></path>', '#034956');

/* หน้าตาของแต่ละชนิดเหตุการณ์ในประวัติ — ปิดดีลสำเร็จกับไม่สำเร็จต้องแยกออกจาก
   กันได้ในแวบเดียว ไม่ใช่จุดสีเดียวกันหมดทั้งเส้น */
const EVENT_STYLE: Record<string, { bg: string; icon: { __html: string } }> = {
  created: { bg: '#EEF4F3', icon: ti('<path d="M12 5v14M5 12h14"></path>', '#034956') },
  status: { bg: '#EEF4F3', icon: ti('<path d="M4 12h16M14 6l6 6-6 6"></path>', '#7A7974') },
  note: { bg: '#E8F3EC', icon: noteIcon },
  req: { bg: '#E9F1FA', icon: ti('<path d="M4 4h16v16H4z"></path><path d="M8 9h8M8 13h5"></path>', '#0E7C86') },
  req_confirmed: { bg: '#E3F3E8', icon: ti('<path d="M20 6L9 17l-5-5"></path>', '#0D6C3B') },
  req_cancelled: { bg: '#FBE9E7', icon: ti('<path d="M18 6L6 18M6 6l12 12"></path>', '#C0392B') },
  shortlist: { bg: '#E9F1FA', icon: ti('<path d="M4 6h16M4 12h16M4 18h10"></path>', '#0E7C86') },
  visit_scheduled: { bg: '#EEF4F3', icon: ti('<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 11h18"></path>', '#034956') },
  visit_done: { bg: '#E3F3E8', icon: ti('<path d="M20 6L9 17l-5-5"></path>', '#0D6C3B') },
  visit_cancelled: { bg: '#FBE9E7', icon: ti('<path d="M18 6L6 18M6 6l12 12"></path>', '#C0392B') },
  deal: { bg: '#E9F1FA', icon: ti('<path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>', '#0E7C86') },
  deal_won: { bg: '#E3F3E8', icon: ti('<path d="M8 21h8M12 17v4M6 4h12v4a6 6 0 01-12 0z"></path><path d="M6 6H3v2a3 3 0 003 3M18 6h3v2a3 3 0 01-3 3"></path>', '#0D6C3B') },
  deal_lost: { bg: '#FBE9E7', icon: ti('<path d="M18 6L6 18M6 6l12 12"></path>', '#C0392B') },
};

const dd = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: active ? 700 : 600,
  cursor: 'pointer', color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(13,108,59,.06)' : 'transparent',
});

type LeadProp = { code: string; title: string; img: string | null };
type LeadEvent = { kind: string; at: number; text: string; by: string; property?: LeadProp | null };

type LeadDetail = {
  notes: { id: string; text: string; createdAt: number; by: string }[];
  tasks: { id: string; title: string; done: boolean; due: number | null; createdAt: number }[];
  /* สไลด์ 43 · ประวัติจริงที่ประกอบจากแถวในฐานข้อมูล ไม่ใช่แค่โน้ตที่พิมพ์มือ */
  history?: LeadEvent[];
  summary?: {
    contacts: number; lastContactAt: number | null; firstContactAt: number | null;
    openTasks: number; visitsDone: number;
    dealsWon: number; dealsLost: number; dealsOpen: number;
  };
  linked: {
    requirements: { id: string; code: string; status: string }[];
    shortlists: { id: string; name: string; status: string; count: number }[];
    visits: { id: string; date: number; status: string }[];
    deals?: { id: string; title: string; status: string; amount: number; closedAt: number | null; property: LeadProp | null }[];
  };
};



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
  /* รายชื่อที่นี่เคยเป็นค่าคงที่ในโค้ด — อารยา วีรพล สมชาย ซึ่งไม่มีใครมีบัญชีใน
     ระบบเลย และกดเลือกแล้วก็แค่เปลี่ยน state ในหน้าจอ ไม่ได้ยิงอะไรออกไป
     รีเฟรชทีก็หายไป ทั้งที่ฝั่งข้อมูล (Lead.assigneeId → User) รองรับมาตลอด */
  const [team, setTeam] = React.useState<{ id: string; name: string; role: string }[]>([]);
  React.useEffect(() => {
    let alive = true;
    apiGet<{ items: { id: string; name: string; role: string }[] }>('/api/users/assignable')
      .then((r) => { if (alive) setTeam(r.items ?? []); })
      .catch(() => { /* ยังมอบหมายไม่ได้ก็ยังดูข้อมูล lead ได้ */ });
    return () => { alive = false; };
  }, []);
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
  const [taskDue, setTaskDue] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, string>>({ status: 'ทั้งหมด', agent: 'ทั้งหมด', source: 'ทั้งหมด', date: 'ทุกช่วง' });

  // add-lead
  /* หน้านี้เคยเอา lead ตัวอย่างที่ฝังไว้ในโค้ดมาต่อท้าย lead จริงเสมอ — บน
     production ที่ยังไม่มี lead สักราย สิ่งที่ทีมขายเห็นคือ 'บ. ไทยโลจิสติกส์
     คุณสมหมาย +66 81-234-5678' ปนอยู่กับของจริง ชื่อและเบอร์ที่ไม่มีอยู่จริง
     ในระบบ CRM คือสิ่งที่จะมีคนหยิบไปโทรจริง จึงเอาออกทั้งชุด */
  const [rows, setRows] = React.useState<Lead[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [webCount, setWebCount] = React.useState(0);

  // real leads from the API, newest first; if the API is unreachable fall
  // back to the localStorage queue the public form keeps offline (§2.2)
  React.useEffect(() => {
    let alive = true;
    apiGet<{ items: ApiLead[] }>('/api/leads')
      .then((r) => {
        if (!alive || !Array.isArray(r.items)) return;
        setRows(r.items.map(webToLead));
        setWebCount(r.items.length);
      })
      .catch(() => {
        const web = loadLeads();
        if (alive && web.length) { setRows(web.map(webToLead)); setWebCount(web.length); }
      })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  /* สไลด์ 16 · ลูกค้า/นายหน้า — ฟอร์มบนเว็บถามอยู่แล้ว แต่ลีดที่เซลล์คีย์เอง
     ไม่เคยมีช่องนี้ เลยแยกไม่ออกว่าใครเป็นใคร */
  /* สไลด์ 36 · "Leads ไม่มีให้คีย์ข้อมูลความต้องการลูกค้า ตาม GG Form"
     ฟอร์มบนหน้าติดต่อถามครบทั้งประเภททรัพย์ · เช่า/ซื้อ · พื้นที่ · ทำเล · งบ ·
     รายละเอียด แล้วเปิดใบงาน Requirement ให้เลย แต่ลีดที่เซลล์คีย์เองเก็บได้
     แค่ชื่อกับเบอร์ ความต้องการที่ลูกค้าบอกทางโทรศัพท์จึงไม่มีที่ลง */
  const emptyForm = {
    name: '', contact: '', country: 'TH', phone: '', email: '',
    source: 'contact form', statusK: 'new', agent: '', who: 'ลูกค้า',
    typeKey: 'warehouse', dealIntent: 'เช่า', area: '', location: '', budget: '', message: '',
  };
  const [form, setForm] = React.useState(emptyForm);
  /* ปุ่มแชร์ลิงก์ให้ลูกค้ากรอกเอง — ฟอร์มบนหน้าติดต่อทำหน้าที่นี้อยู่แล้ว แต่
     เซลล์ต้องไปก๊อป URL เอาเองจากหน้าเว็บ ลูกค้าต่างชาติก็ต้องส่งลิงก์คนละภาษา */
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareLang, setShareLang] = React.useState<'th' | 'en' | 'zh'>('th');
  const [shareCopied, setShareCopied] = React.useState(false);
  const shareUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/${shareLang}/contact#lead-form`;
  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* เบราว์เซอร์ไม่ให้คัดลอก — URL แสดงอยู่บนจอให้ลากเอาได้ */ }
  };
  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const canCreate = form.name.trim().length > 0;

  /* an empty pipeline is a real state — everything below reads from `cur`, so
     it gets a blank stand-in rather than crashing the page */
  const NO_LEAD: Lead = {
    name: '', company: '', country: '', initial: '', avBg: 'var(--tint)', avFg: 'var(--muted)',
    time: '', status: 'new', statusK: 'new', source: '', phone: '', email: '', agent: '',
  };
  const cur = rows[selected] ?? NO_LEAD;
  const hasLead = rows.length > 0;

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

  /* How near the deadline is, from the deadline — not from a colour typed next
     to each row. The prototype's three tasks carried a fixed red / amber /
     green that only *looked* like urgency; they were the same three rows on
     every lead. */
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const DAY = 86_400_000;

  type Urgency = 'overdue' | 'soon' | 'later' | 'none' | 'done';
  const urgencyOf = (due: number | null, done: boolean): Urgency => {
    if (done) return 'done';
    if (due === null) return 'none';
    const days = Math.round((startOfDay(new Date(due)) - startOfDay(new Date())) / DAY);
    if (days < 0) return 'overdue';
    if (days <= 1) return 'soon';
    return 'later';
  };

  const URGENCY_COLOR: Record<Urgency, string> = {
    overdue: '#C0392B',
    soon: '#D9A62B',
    later: '#0D6C3B',
    none: 'var(--border)',
    done: '#0D6C3B',
  };

  /* The date in words, so the colour never has to be decoded on its own —
     colour alone is not something every reader can use. */
  const dueLabel = (due: number | null, u: Urgency) => {
    if (due === null) return 'ไม่ได้กำหนดวัน';
    const days = Math.round((startOfDay(new Date(due)) - startOfDay(new Date())) / DAY);
    const date = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(new Date(due));
    if (u === 'done') return `กำหนด ${date}`;
    if (days < 0) return `เลยกำหนด ${-days} วัน · ${date}`;
    if (days === 0) return `ครบกำหนดวันนี้ · ${date}`;
    if (days === 1) return `พรุ่งนี้ · ${date}`;
    return `อีก ${days} วัน · ${date}`;
  };

  const tasks = serverTasks.map((t) => {
    const u = urgencyOf(t.due, t.done);
    const color = URGENCY_COLOR[u];
    return {
      id: t.id,
      title: t.title,
      due: dueLabel(t.due, u),
      dueColor: u === 'overdue' ? '#C0392B' : 'var(--muted3)',
      done: t.done,
      box: {
        width: 16, height: 16, borderRadius: 5, flexShrink: 0, marginTop: 1, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid ' + color,
        background: t.done ? '#0D6C3B' : 'transparent',
      } as React.CSSProperties,
      /* the same fact in text, for anyone who cannot use the colour */
      boxTitle: t.done ? 'ทำเสร็จแล้ว — กดเพื่อเอาเครื่องหมายออก'
        : u === 'overdue' ? 'เลยกำหนดแล้ว — กดเมื่อทำเสร็จ'
          : u === 'soon' ? 'ใกล้ครบกำหนด — กดเมื่อทำเสร็จ'
            : 'กดเมื่อทำเสร็จ',
      toggle: () => {
        if (!cur.apiId) return;
        setSaveErr('');
        apiPatch(`/api/leads/${cur.apiId}/tasks`, { taskId: t.id, done: !t.done })
          .then(loadDetail)
          .catch((e) => setSaveErr(e instanceof ApiClientError ? e.message : 'ติ๊กงานไม่สำเร็จ'));
      },
    };
  });

  /* ไทม์ไลน์คือประวัติจริงของ lead ที่เซิร์ฟเวอร์ประกอบจากแถวในฐานข้อมูล —
     เปิด/ยืนยัน/ยกเลิก REQ · ส่ง shortlist · นัดและเข้าชม · เปิดและปิดดีล ·
     โน้ตที่ทีมพิมพ์เอง เดิมมีแต่โน้ตกับบรรทัด "สร้าง lead" การปิดดีลจึงไม่เคย
     โผล่ที่นี่เลย (สไลด์ 43) */
  const fmtWhen = (ms: number) => relTime(ms);
  const sum = detail?.summary;
  const timeline = (detail?.history ?? []).map((e) => ({
    text: e.text,
    by: e.by,
    time: fmtWhen(e.at),
    dotBg: EVENT_STYLE[e.kind]?.bg ?? '#E8F3EC',
    icon: EVENT_STYLE[e.kind]?.icon ?? noteIcon,
    property: e.property ?? null,
  }));

  /* was a fixed ['Requirement #REQ-1042', 'Shortlist #SL-208', '2 Visits'] */
  const L = detail?.linked;
  const linkedChips = [
    ...(L?.requirements ?? []).map((r) => ({ label: `Requirement ${r.code}`, href: `/admin/requirements/${r.id}` })),
    ...(L?.shortlists ?? []).map((sl) => ({ label: `Shortlist ${sl.name} · ${sl.count} ทรัพย์`, href: `/admin/shortlists/${sl.id}` })),
    ...(L?.visits?.length ? [{ label: `${L.visits.length} Visits`, href: '/admin/visits' }] : []),
    /* สไลด์ 43 · ดีลไม่เคยโผล่ที่นี่ ทั้งที่การปิดดีลคือสิ่งที่ทำให้ lead จบ */
    ...(L?.deals ?? []).map((dl) => ({
      label: `ดีล ${dl.status === 'won' ? 'สำเร็จ' : dl.status === 'lost' ? 'ไม่สำเร็จ' : 'กำลังเจรจา'}${dl.amount ? ` · ฿${dl.amount.toLocaleString('th-TH')}` : ''}`,
      href: `/admin/deals/${dl.id}`,
    })),
  ];

  const curStatus = statusVal || statusLabelMap[cur.statusK];
  const curAgent = agentVal ?? (cur.agent?.replace('มอบหมาย: ', '') || 'ยังไม่มอบหมาย');

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

  const assign = (assigneeId: string | null, label: string) => {
    const before = curAgent;
    setAgentVal(label);
    setAgentOpen(false);
    if (!cur.apiId) return; // ตัวอย่างที่ยังไม่ได้บันทึกลงระบบ
    apiPatch(`/api/leads/${cur.apiId}`, { assigneeId })
      .then(() => setRows((r) => r.map((x, i) => (i === selected ? { ...x, agent: 'มอบหมาย: ' + label } : x))))
      .catch((e) => {
        setAgentVal(before); // คืนป้ายเดิม ไม่ให้หน้าจอโชว์สิ่งที่ยังไม่ได้บันทึก
        window.alert(e instanceof ApiClientError ? e.message : 'บันทึกผู้รับผิดชอบไม่สำเร็จ');
      });
  };

  const agentOptions = [
    ...team.map((m) => ({
      label: m.name,
      active: curAgent === m.name,
      select: () => assign(m.id, m.name),
      style: dd(curAgent === m.name),
    })),
    {
      label: 'ยังไม่มอบหมาย',
      active: curAgent === 'ยังไม่มอบหมาย',
      select: () => assign(null, 'ยังไม่มอบหมาย'),
      style: dd(curAgent === 'ยังไม่มอบหมาย'),
    },
  ];

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
    chipDef('agent', 'Agent', ['ทั้งหมด', ...team.map((m) => m.name)]),
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
    // the API always accepted `due`; the form simply never offered it
    apiPost(`/api/leads/${cur.apiId}/tasks`, { title: v, due: taskDue || undefined })
      .then(() => { setTaskText(''); setTaskDue(''); setTaskAdding(false); loadDetail(); })
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
        respondentType: form.who,
        /* ส่งเป็นชุดเดียวกับที่ฟอร์มบนเว็บส่ง เพื่อให้ได้ Requirement เหมือนกัน */
        typeKey: form.typeKey,
        typeLabel: propertyType(form.typeKey).label,
        dealIntent: form.dealIntent,
        message: form.message.trim(),
        req: [
          { k: 'ต้องการ', v: form.dealIntent },
          form.area.trim() && { k: 'พื้นที่ใช้สอยที่ต้องการ', v: `${form.area.trim()} ตร.ม.` },
          form.location.trim() && { k: 'ทำเล / จังหวัดที่สนใจ', v: form.location.trim() },
          form.budget.trim() && { k: 'งบประมาณ (เช่า/ซื้อ)', v: form.budget.trim() },
        ].filter(Boolean),
        // ช่อง "มอบหมายให้" ในฟอร์มนี้เคยส่งชื่อที่พิมพ์ไว้ในโค้ดไปเปล่า ๆ
        assigneeId: form.agent || null,
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
      agent: 'มอบหมาย: ' + (team.find((m) => m.id === form.agent)?.name ?? 'ยังไม่มอบหมาย'),
      apiId,
      piiMasked,
    };
    setRows((r) => [nl, ...r]);
    setSelected(0);
    setStatusVal(statusLabelMap[form.statusK] || 'New');
    setAgentVal(team.find((m) => m.id === form.agent)?.name ?? 'ยังไม่มอบหมาย');
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
              <div style={fGrid}>
                <div>
                  <label style={fLabel}>ติดต่อมาในฐานะ</label>
                  <select value={form.who} onChange={(e) => setF('who', e.target.value)} style={fSelect} data-lead-who>
                    <option value="ลูกค้า">ลูกค้า</option>
                    <option value="นายหน้า">นายหน้า</option>
                  </select>
                </div>
                <div />
              </div>
              {/* ความต้องการ — ชุดเดียวกับฟอร์มบนหน้าติดต่อ กรอกได้เท่าที่ลูกค้าบอก
                  ถ้ากรอกมาอย่างน้อยหนึ่งช่อง ระบบจะเปิดใบงาน Requirement ให้ */}
              <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>ความต้องการของลูกค้า</div>
                <div style={fGrid}>
                  <div>
                    <label style={fLabel}>ประเภททรัพย์</label>
                    <select value={form.typeKey} onChange={(e) => setF('typeKey', e.target.value)} style={fSelect} data-lead-type>
                      {PROPERTY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={fLabel}>ต้องการ</label>
                    <select value={form.dealIntent} onChange={(e) => setF('dealIntent', e.target.value)} style={fSelect} data-lead-deal>
                      {['เช่า', 'ซื้อ', 'เช่า / ซื้อ'].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div style={fGrid}>
                  <div><label style={fLabel}>พื้นที่ที่ต้องการ (ตร.ม.)</label><input value={form.area} onChange={(e) => setF('area', e.target.value)} placeholder="เช่น 1500 หรือ 1000-3000" style={fInput} data-lead-area /></div>
                  <div><label style={fLabel}>ทำเล / จังหวัดที่สนใจ</label><input value={form.location} onChange={(e) => setF('location', e.target.value)} placeholder="เช่น บางนา, สมุทรปราการ" style={fInput} data-lead-location /></div>
                </div>
                <div>
                  <label style={fLabel}>งบประมาณ (เช่า/ซื้อ)</label>
                  <input value={form.budget} onChange={(e) => setF('budget', e.target.value)} placeholder="เช่น 150,000/เดือน หรือ 40 ล้าน" style={fInput} data-lead-budget />
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={fLabel}>รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setF('message', e.target.value)}
                    placeholder="บอกเราเกี่ยวกับความต้องการของลูกค้าเพิ่มเติม…"
                    data-lead-message
                    style={{ ...fInput, height: 76, padding: '10px 14px', resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div>
                <label style={fLabel}>มอบหมายให้</label>
                <select value={form.agent} onChange={(e) => setF('agent', e.target.value)} style={fSelect}>
                  <option value="">ยังไม่มอบหมาย</option>
                  {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <div onClick={() => setCreateOpen(false)} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="lead-create-save" onClick={addLead} style={{ height: 44, padding: '0 26px', borderRadius: 9999, background: canCreate ? '#0D6C3B' : 'var(--border)', color: canCreate ? '#fff' : 'var(--muted3)', display: 'flex', alignItems: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, cursor: canCreate ? 'pointer' : 'default' }}>
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
        {/* แชร์ลิงก์ให้ลูกค้ากรอกเอง แล้วลีดเข้าระบบเหมือนที่กรอกจากหน้าเว็บ */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <div
            id="lead-sharebtn"
            onClick={() => setShareOpen((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
            แชร์ลิงก์ให้ลูกค้ากรอก
          </div>
          {shareOpen && (
            <>
              <div onClick={() => setShareOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div id="lead-share-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 44, right: 0, zIndex: 41, width: 340, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 14 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text)' }}>ลิงก์ให้ลูกค้ากรอกเอง</div>
                <p style={{ margin: '4px 0 10px', fontSize: 11.5, color: 'var(--muted2)', lineHeight: 1.6 }}>
                  ลูกค้ากรอกแล้วเข้ามาเป็น lead พร้อมใบงาน Requirement เหมือนกรอกจากหน้าเว็บ
                </p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {([['th', 'ไทย'], ['en', 'EN'], ['zh', '中文']] as const).map(([k, label]) => (
                    <div
                      key={k}
                      data-share-lang={k}
                      onClick={() => setShareLang(k)}
                      style={{ flex: 1, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (shareLang === k ? '#0D6C3B' : 'var(--border)'), background: shareLang === k ? '#E8F3EC' : 'var(--bg)', color: shareLang === k ? '#0D6C3B' : 'var(--muted)' }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div data-share-url style={{ padding: '9px 11px', borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--muted)', wordBreak: 'break-all' }}>{shareUrl}</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <div id="lead-share-copy" onClick={() => void copyShare()} style={{ flex: 1, height: 36, borderRadius: 9, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    {shareCopied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                  </div>
                  <a id="lead-share-open" href={shareUrl} target="_blank" rel="noreferrer" style={{ height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--border)', color: 'var(--text)', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none' }}>เปิดดู</a>
                </div>
              </div>
            </>
          )}
        </div>
        <div id="lead-addbtn" onClick={openCreate} className="admin-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14"></path></svg>
          เพิ่ม Lead
        </div>
      </div>

      <div id="lead-split" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
        {/* LIST */}
        <div style={{ minWidth: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{rows.length} leads</span>
              {webCount > 0 && <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#E8F3EC', color: '#0D6C3B', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>+{webCount} จากเว็บ</span>}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted2)' }}>เรียง: ใหม่ล่าสุด</span>
          </div>
          <div className="a-scroll" style={{ maxHeight: 660, overflowY: 'auto' }}>
            {loaded && !leads.length && (
              <div id="lead-empty" style={{ padding: '34px 18px', textAlign: 'center', fontSize: 13, color: 'var(--muted3)', lineHeight: 1.7 }}>
                ยังไม่มี lead ในระบบ<br />
                lead จะเข้ามาเองเมื่อมีคนกรอกฟอร์มบนเว็บ หรือกด “เพิ่ม Lead” เพื่อบันทึกเองจากการโทร
              </div>
            )}
            {leads.map((l, i) => (
              <div key={i} data-lead-row={l.name} onClick={l.select} style={l.rowStyle}>
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
        {!hasLead ? (
          <div id="lead-detail-empty" style={{ minWidth: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ยังไม่มี lead ให้ดู</div>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
              ฟอร์ม “แจ้งความต้องการ” และ “ติดต่อทีมงาน” บนเว็บส่งเข้าที่นี่โดยตรง<br />
              ถ้าลูกค้าโทรมา กด “เพิ่ม Lead” เพื่อบันทึกเองได้
            </p>
          </div>
        ) : (
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
              {/* Both chips were href="#". A masked number stays unclickable —
                  there is nothing to dial until the contact is revealed. */}
              <a
                href={cur.piiMasked || !cur.phone || cur.phone === '—' ? undefined : `tel:${cur.phone.replace(/[^\d+]/g, '')}`}
                title={cur.piiMasked ? 'กด "ดูข้อมูลติดต่อเต็ม" ก่อนจึงจะโทรได้' : `โทรหา ${cur.phone}`}
                style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, cursor: cur.piiMasked ? 'default' : 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"></path></svg>
                {cur.phone}
              </a>
              <a
                href={cur.piiMasked || !cur.email || cur.email === '—' ? undefined : `mailto:${cur.email}`}
                title={cur.piiMasked ? 'กด "ดูข้อมูลติดต่อเต็ม" ก่อนจึงจะส่งอีเมลได้' : `ส่งอีเมลถึง ${cur.email}`}
                style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, cursor: cur.piiMasked ? 'default' : 'pointer' }}
              >
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 9 }}>
                  <input id="lead-task-input" value={taskText} onChange={(e) => setTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveTask(); }} placeholder="งานใหม่…" style={{ minWidth: 0, height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #0D6C3B', fontFamily: 'inherit', fontSize: '12.5px', background: 'var(--surface)', outline: 'none' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* the deadline is what drives the colour, so it is asked for here */}
                    <input
                      id="lead-task-due"
                      type="date"
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTask(); }}
                      aria-label="กำหนดวันที่ต้องทำเสร็จ"
                      style={{ flex: 1, minWidth: 0, height: 38, padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '12.5px', color: taskDue ? 'var(--text)' : 'var(--muted3)', background: 'var(--surface)', outline: 'none' }}
                    />
                    <div id="lead-task-save" onClick={saveTask} style={{ height: 38, padding: '0 16px', borderRadius: 10, background: '#0D6C3B', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>เพิ่ม</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted3)' }}>ไม่ใส่วันก็ได้ — แต่ใส่แล้วระบบจะเตือนเมื่อใกล้ครบกำหนด</div>
                </div>
              )}
              {saveErr && (
                <div id="lead-save-error" style={{ marginBottom: 9, padding: '9px 11px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12px', fontWeight: 600 }}>{saveErr}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {tasks.length === 0 && (
                  <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--muted3)' }}>ยังไม่มีงานติดตาม</div>
                )}
                {/* the colour needed explaining, which is the tell that it was
                    decoration — it means something now, and says so */}
                {tasks.some((t) => !t.done) && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 10.5, color: 'var(--muted3)', paddingBottom: 2 }}>
                    {[['#C0392B', 'เลยกำหนด'], ['#D9A62B', 'ใกล้ครบ'], ['#0D6C3B', 'ยังมีเวลา']].map(([c, label]) => (
                      <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, border: '1.5px solid ' + c }} />{label}
                      </span>
                    ))}
                  </div>
                )}
                {tasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 11, background: 'var(--bg)' }}>
                    <div onClick={t.toggle} title={t.boxTitle} role="checkbox" aria-checked={t.done} aria-label={`${t.title} — ${t.due}`} style={t.box}>
                      {t.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5"></path></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: t.done ? 'var(--muted3)' : 'var(--text)', ...(t.done ? { textDecoration: 'line-through' } : {}) }}>{t.title}</div>
                      <div style={{ marginTop: 2, fontSize: 11, fontWeight: t.dueColor === '#C0392B' ? 700 : 400, color: t.done ? 'var(--muted3)' : t.dueColor }}>{t.due}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* timeline */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>ประวัติและการติดต่อ</div>

            {/* สไลด์ 43 · "ไม่มีสรุปและประวัติการติดต่อ" — คนเปิดหน้านี้ถามสาม
                คำถามเดิมทุกครั้ง: คุยกันไปกี่ครั้งแล้ว ครั้งล่าสุดเมื่อไร ค้างอะไรอยู่
                เดิมต้องไล่อ่านไทม์ไลน์เอาเองทีละบรรทัด */}
            {sum && (
              <div data-lead-summary style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {([
                  ['ติดต่อแล้ว', `${sum.contacts} ครั้ง`, null],
                  ['ล่าสุด', sum.lastContactAt ? relTime(sum.lastContactAt) : 'ยังไม่เคย', sum.lastContactAt ? null : '#C0392B'],
                  ['เข้าชมแล้ว', `${sum.visitsDone} ครั้ง`, null],
                  ['งานค้าง', `${sum.openTasks} งาน`, sum.openTasks ? '#C0392B' : null],
                  ...(sum.dealsWon ? [['ดีลสำเร็จ', `${sum.dealsWon}`, '#0D6C3B'] as const] : []),
                  ...(sum.dealsLost ? [['ดีลไม่สำเร็จ', `${sum.dealsLost}`, '#C0392B'] as const] : []),
                  ...(sum.dealsOpen ? [['กำลังเจรจา', `${sum.dealsOpen}`, null] as const] : []),
                ] as [string, string, string | null][]).map(([k, v, colour]) => (
                  <div key={k} style={{ padding: '8px 12px', borderRadius: 11, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{k}</div>
                    <div style={{ marginTop: 2, fontSize: '12.5px', fontWeight: 700, color: colour ?? 'var(--text)' }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
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
                    {/* รหัสทรัพย์อย่างเดียวไม่พอ — คนที่ไม่ได้ลงเองจำรหัสไม่ได้
                        (สไลด์ 43 "ต้องมีรูปภาพเพื่อยืนยัน") */}
                    {e.property && (
                      <div data-event-property style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {e.property.img
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={thumb(e.property.img, 160)} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                          : <span style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--tint)', flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--muted2)' }}>{e.property.code}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{e.property.title}</div>
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted3)' }}>{e.by} · {e.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  );
}
