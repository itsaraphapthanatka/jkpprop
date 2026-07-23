import type {
  CancelledField,
  LeadStatus,
  OperationType,
  RequirementStatus,
  SourceChannel,
} from '@jkp/domain';
import { LEAD_STATUS } from '@jkp/domain';

/**
 * Admin CRM mock data. Mirrors the future GET /api/v1/admin|ops endpoints so the
 * Leads workspace can be built now; swap the fixture reads for real fetches later.
 * (Admin is single-language Thai, outside the [locale] tree.)
 */

export interface Agent {
  id: string;
  name: string;
}

export interface LeadContact {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
}

export interface LeadCompany {
  name: string;
  country?: string;
  website?: string;
  businessType?: string;
}

export interface LeadRequirement {
  status: RequirementStatus;
  operationType: OperationType | null;
  needFactoryLicense: boolean;
  sizeMin: number | null;
  sizeMax: number | null;
  rentMin: number | null;
  rentMax: number | null;
  moveInDate: string | null;
  locations: string[];
  cancelledReason?: string;
  cancelledField?: CancelledField | null;
}

export interface Note {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
  id: string;
  title: string;
  dueAt: string | null;
  priority: TaskPriority;
  done: boolean;
}

export interface Activity {
  id: string;
  type: string;
  text: string;
  createdAt: string;
}

export interface LeadRow {
  id: string;
  code: string;
  contactName: string;
  company: string | null;
  status: LeadStatus;
  source: SourceChannel;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDetail extends LeadRow {
  contacts: LeadContact[];
  companyInfo: LeadCompany | null;
  requirement: LeadRequirement | null;
  notes: Note[];
  tasks: Task[];
  activities: Activity[];
  linked: { shortlists: number; visits: number; deals: number };
}

export const AGENTS: Agent[] = [
  { id: 'ag-1', name: 'ณัฐพงษ์ (Nattapong)' },
  { id: 'ag-2', name: 'สุดารัตน์ (Sudarat)' },
  { id: 'ag-3', name: 'วิชัย (Wichai)' },
];

export interface LeadFilters {
  status?: LeadStatus | null;
  agentId?: string | null;
  source?: SourceChannel | null;
  q?: string | null;
}

const act = (id: string, type: string, text: string, createdAt: string): Activity => ({
  id,
  type,
  text,
  createdAt,
});

const LEADS: LeadDetail[] = [
  {
    id: 'ld-1001',
    code: 'LD-1001',
    contactName: 'สมชาย ผลิตภัณฑ์',
    company: 'ACME Manufacturing',
    status: 'new',
    source: 'website_form',
    assignedAgentId: null,
    createdAt: '2026-07-20T03:00:00.000Z',
    updatedAt: '2026-07-20T03:00:00.000Z',
    contacts: [
      { name: 'สมชาย ผลิตภัณฑ์', email: 'somchai@acme.example', phone: '081-111-1111', position: 'ผู้จัดการโรงงาน', isPrimary: true },
    ],
    companyInfo: { name: 'ACME Manufacturing', country: 'ไทย', website: 'acme.example', businessType: 'ผลิตชิ้นส่วนโลหะ' },
    requirement: {
      status: 'submitted',
      operationType: 'manufacturing',
      needFactoryLicense: true,
      sizeMin: 3000,
      sizeMax: 5000,
      rentMin: null,
      rentMax: null,
      moveInDate: '2026-10-01',
      locations: ['ชลบุรี', 'ระยอง'],
    },
    notes: [],
    tasks: [{ id: 'tk-1', title: 'โทรกลับเพื่อ qualify', dueAt: '2026-07-23', priority: 'high', done: false }],
    activities: [act('a1', 'created', 'สร้าง lead จากฟอร์มเว็บ (requirement)', '2026-07-20T03:00:00.000Z')],
    linked: { shortlists: 0, visits: 0, deals: 0 },
  },
  {
    id: 'ld-1002',
    code: 'LD-1002',
    contactName: 'Lin Wei',
    company: 'Sunrise Logistics',
    status: 'qualified',
    source: 'line',
    assignedAgentId: 'ag-1',
    createdAt: '2026-07-18T06:00:00.000Z',
    updatedAt: '2026-07-21T02:00:00.000Z',
    contacts: [{ name: 'Lin Wei', email: 'lin@sunrise.example', phone: '082-222-2222', isPrimary: true }],
    companyInfo: { name: 'Sunrise Logistics', country: 'จีน', businessType: 'โลจิสติกส์' },
    requirement: {
      status: 'submitted',
      operationType: 'logistics',
      needFactoryLicense: false,
      sizeMin: 2000,
      sizeMax: 4000,
      rentMin: 200000,
      rentMax: 600000,
      moveInDate: '2026-09-01',
      locations: ['สมุทรปราการ', 'กรุงเทพมหานคร'],
    },
    notes: [{ id: 'n1', author: 'ณัฐพงษ์', body: 'สนใจโกดังใกล้สุวรรณภูมิ งบเช่าไม่เกิน 6 แสน/เดือน', createdAt: '2026-07-21T02:00:00.000Z' }],
    tasks: [{ id: 'tk-2', title: 'ยืนยัน requirement', dueAt: '2026-07-24', priority: 'medium', done: false }],
    activities: [
      act('a2', 'created', 'สร้าง lead จาก Line', '2026-07-18T06:00:00.000Z'),
      act('a3', 'assigned', 'มอบหมายให้ ณัฐพงษ์', '2026-07-18T07:00:00.000Z'),
      act('a4', 'status', 'เปลี่ยนสถานะเป็น qualified', '2026-07-19T02:00:00.000Z'),
    ],
    linked: { shortlists: 0, visits: 0, deals: 0 },
  },
  {
    id: 'ld-1003',
    code: 'LD-1003',
    contactName: 'ธนวัฒน์ อุตสาหกิจ',
    company: 'TW Industries',
    status: 'requirements_confirmed',
    source: 'website_form',
    assignedAgentId: 'ag-2',
    createdAt: '2026-07-15T04:00:00.000Z',
    updatedAt: '2026-07-21T08:00:00.000Z',
    contacts: [{ name: 'ธนวัฒน์ อุตสาหกิจ', email: 'thanawat@tw.example', phone: '083-333-3333', isPrimary: true }],
    companyInfo: { name: 'TW Industries', country: 'ไทย', businessType: 'ประกอบชิ้นส่วน' },
    requirement: {
      status: 'confirmed',
      operationType: 'assembly',
      needFactoryLicense: true,
      sizeMin: 4000,
      sizeMax: 6000,
      rentMin: null,
      rentMax: null,
      moveInDate: '2026-11-01',
      locations: ['พระนครศรีอยุธยา'],
    },
    notes: [],
    tasks: [{ id: 'tk-3', title: 'จัด shortlist ส่งลูกค้า', dueAt: '2026-07-23', priority: 'high', done: false }],
    activities: [
      act('a5', 'created', 'สร้าง lead จากฟอร์มเว็บ', '2026-07-15T04:00:00.000Z'),
      act('a6', 'status', 'ยืนยัน requirement', '2026-07-21T08:00:00.000Z'),
    ],
    linked: { shortlists: 0, visits: 0, deals: 0 },
  },
  {
    id: 'ld-1004',
    code: 'LD-1004',
    contactName: 'ประไพ ค้าส่ง',
    company: 'Prapai Trading',
    status: 'shortlisted',
    source: 'whatsapp',
    assignedAgentId: 'ag-1',
    createdAt: '2026-07-10T04:00:00.000Z',
    updatedAt: '2026-07-20T09:00:00.000Z',
    contacts: [{ name: 'ประไพ ค้าส่ง', phone: '084-444-4444', isPrimary: true }],
    companyInfo: { name: 'Prapai Trading', country: 'ไทย', businessType: 'คลังสินค้า' },
    requirement: {
      status: 'confirmed',
      operationType: 'storage',
      needFactoryLicense: false,
      sizeMin: 1500,
      sizeMax: 3000,
      rentMin: 150000,
      rentMax: 350000,
      moveInDate: null,
      locations: ['สมุทรสาคร'],
    },
    notes: [{ id: 'n2', author: 'ณัฐพงษ์', body: 'ส่ง shortlist 4 ทรัพย์แล้ว รอ feedback', createdAt: '2026-07-20T09:00:00.000Z' }],
    tasks: [{ id: 'tk-4', title: 'ติดตาม feedback shortlist', dueAt: '2026-07-23', priority: 'medium', done: false }],
    activities: [
      act('a7', 'created', 'สร้าง lead จาก WhatsApp', '2026-07-10T04:00:00.000Z'),
      act('a8', 'shortlist', 'ส่ง shortlist ให้ลูกค้า', '2026-07-20T09:00:00.000Z'),
    ],
    linked: { shortlists: 1, visits: 0, deals: 0 },
  },
  {
    id: 'ld-1005',
    code: 'LD-1005',
    contactName: 'Kenji Sato',
    company: 'Sato Precision',
    status: 'visit_scheduled',
    source: 'referral',
    assignedAgentId: 'ag-3',
    createdAt: '2026-07-05T04:00:00.000Z',
    updatedAt: '2026-07-21T01:00:00.000Z',
    contacts: [{ name: 'Kenji Sato', email: 'kenji@sato.example', phone: '085-555-5555', isPrimary: true }],
    companyInfo: { name: 'Sato Precision', country: 'ญี่ปุ่น', businessType: 'ผลิตแม่พิมพ์' },
    requirement: {
      status: 'confirmed',
      operationType: 'manufacturing',
      needFactoryLicense: true,
      sizeMin: 5000,
      sizeMax: 8000,
      rentMin: null,
      rentMax: null,
      moveInDate: '2026-12-01',
      locations: ['ชลบุรี'],
    },
    notes: [],
    tasks: [{ id: 'tk-5', title: 'เตรียมเส้นทางเข้าชม 3 จุด', dueAt: '2026-07-25', priority: 'high', done: false }],
    activities: [
      act('a9', 'created', 'สร้าง lead จากการแนะนำ', '2026-07-05T04:00:00.000Z'),
      act('a10', 'visit', 'ยืนยันนัดเข้าชม 25 ก.ค.', '2026-07-21T01:00:00.000Z'),
    ],
    linked: { shortlists: 1, visits: 1, deals: 0 },
  },
  {
    id: 'ld-1006',
    code: 'LD-1006',
    contactName: 'อรุณี พัฒนา',
    company: 'Arunee Dev',
    status: 'negotiating',
    source: 'phone',
    assignedAgentId: 'ag-2',
    createdAt: '2026-06-28T04:00:00.000Z',
    updatedAt: '2026-07-20T05:00:00.000Z',
    contacts: [{ name: 'อรุณี พัฒนา', phone: '086-666-6666', isPrimary: true }],
    companyInfo: { name: 'Arunee Dev', country: 'ไทย', businessType: 'พัฒนาอสังหาฯ' },
    requirement: {
      status: 'confirmed',
      operationType: 'storage',
      needFactoryLicense: false,
      sizeMin: 3000,
      sizeMax: 4000,
      rentMin: null,
      rentMax: null,
      moveInDate: null,
      locations: ['ระยอง'],
    },
    notes: [{ id: 'n3', author: 'สุดารัตน์', body: 'เจ้าของเสนอ 235 ล้าน ลูกค้าต่อ 220 ล้าน', createdAt: '2026-07-20T05:00:00.000Z' }],
    tasks: [],
    activities: [
      act('a11', 'created', 'สร้าง lead จากโทรศัพท์', '2026-06-28T04:00:00.000Z'),
      act('a12', 'negotiation', 'เปิดการเจรจา', '2026-07-18T05:00:00.000Z'),
    ],
    linked: { shortlists: 1, visits: 1, deals: 0 },
  },
  {
    id: 'ld-1007',
    code: 'LD-1007',
    contactName: 'Somchai Won',
    company: 'BigBox Co',
    status: 'won',
    source: 'website_form',
    assignedAgentId: 'ag-1',
    createdAt: '2026-05-20T04:00:00.000Z',
    updatedAt: '2026-07-12T05:00:00.000Z',
    contacts: [{ name: 'Somchai Won', email: 'win@bigbox.example', isPrimary: true }],
    companyInfo: { name: 'BigBox Co', country: 'ไทย', businessType: 'ค้าปลีก' },
    requirement: {
      status: 'confirmed',
      operationType: 'storage',
      needFactoryLicense: false,
      sizeMin: 3000,
      sizeMax: 3500,
      rentMin: 400000,
      rentMax: 550000,
      moveInDate: null,
      locations: ['กรุงเทพมหานคร'],
    },
    notes: [],
    tasks: [],
    activities: [act('a13', 'deal', 'ปิดดีลสำเร็จ', '2026-07-12T05:00:00.000Z')],
    linked: { shortlists: 1, visits: 1, deals: 1 },
  },
  {
    id: 'ld-1008',
    code: 'LD-1008',
    contactName: 'ไม่ระบุ',
    company: null,
    status: 'lost',
    source: 'wechat',
    assignedAgentId: 'ag-3',
    createdAt: '2026-06-01T04:00:00.000Z',
    updatedAt: '2026-06-30T05:00:00.000Z',
    contacts: [{ name: 'ไม่ระบุ', phone: '087-777-7777', isPrimary: true }],
    companyInfo: null,
    requirement: {
      status: 'cancelled',
      operationType: null,
      needFactoryLicense: false,
      sizeMin: null,
      sizeMax: null,
      rentMin: null,
      rentMax: null,
      moveInDate: null,
      locations: [],
      cancelledReason: 'งบประมาณไม่ตรงกับตลาด',
      cancelledField: 'budget',
    },
    notes: [],
    tasks: [],
    activities: [act('a14', 'status', 'ปิดการขาย (lost)', '2026-06-30T05:00:00.000Z')],
    linked: { shortlists: 0, visits: 0, deals: 0 },
  },
];

/* ---- Queries (async → mirror API) ---- */

export async function getAgents(): Promise<Agent[]> {
  return AGENTS;
}

export function agentName(id: string | null): string | null {
  return AGENTS.find((a) => a.id === id)?.name ?? null;
}

function toRow(l: LeadDetail): LeadRow {
  const { contacts, companyInfo, requirement, notes, tasks, activities, linked, ...row } = l;
  void contacts;
  void companyInfo;
  void requirement;
  void notes;
  void tasks;
  void activities;
  void linked;
  return row;
}

export async function getLeads(filters: LeadFilters = {}): Promise<LeadRow[]> {
  return LEADS.filter((l) => {
    if (filters.status && l.status !== filters.status) return false;
    if (filters.agentId && l.assignedAgentId !== filters.agentId) return false;
    if (filters.source && l.source !== filters.source) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = `${l.code} ${l.contactName} ${l.company ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  })
    .map(toRow)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  return LEADS.find((l) => l.id === id) ?? null;
}

export interface DashboardStats {
  newLeads7d: number;
  requirementsToReview: number;
  shortlistsToSend: number;
  visitsThisWeek: number;
  openDeals: number;
  funnel: { status: LeadStatus; count: number }[];
  recentActivities: (Activity & { leadCode: string; leadId: string })[];
  todayTasks: (Task & { leadCode: string; leadId: string })[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const count = (s: LeadStatus) => LEADS.filter((l) => l.status === s).length;

  const funnel = LEAD_STATUS.filter((s) => s !== 'won' && s !== 'lost').map((status) => ({
    status,
    count: count(status),
  }));

  const recentActivities = LEADS.flatMap((l) =>
    l.activities.map((a) => ({ ...a, leadCode: l.code, leadId: l.id })),
  )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const todayTasks = LEADS.flatMap((l) =>
    l.tasks.filter((t) => !t.done).map((t) => ({ ...t, leadCode: l.code, leadId: l.id })),
  )
    .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))
    .slice(0, 6);

  return {
    newLeads7d: count('new'),
    requirementsToReview: LEADS.filter((l) => l.requirement?.status === 'submitted').length,
    shortlistsToSend: count('requirements_confirmed'),
    visitsThisWeek: count('visit_scheduled'),
    openDeals: count('negotiating'),
    funnel,
    recentActivities,
    todayTasks,
  };
}
