/* ============================================================
   Lead store — leads submitted from the public requirement/contact
   form, persisted to localStorage (no backend yet). The admin Leads
   page reads these and merges them into its list, so a visitor's
   requirement flows end-to-end into the sales workflow.
   ============================================================ */

export type ReqItem = { k: string; v: string };

export type StoredLead = {
  id: string;
  createdAt: number; // epoch ms
  name: string;
  phone: string;
  email: string;
  company?: string; // ชื่อบริษัท / องค์กรของผู้ติดต่อ
  respondentType?: string; // ลูกค้า / นายหน้า (ค่าที่บันทึกก่อนหน้าเขียนยาวกว่านี้)
  message: string;
  typeKey: string; // property type key (house/condo/land/factory/warehouse)
  typeLabel: string; // Thai label
  dealIntent: string; // เช่า / ซื้อ
  req: ReqItem[]; // essential requirement summary captured on the form
  source: string; // 'requirement form'
};

const LS_KEY = 'jkp.leads.v1';

export function loadLeads(): StoredLead[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as StoredLead[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addLead(lead: StoredLead) {
  if (typeof window === 'undefined') return;
  const all = loadLeads();
  all.unshift(lead); // newest first
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 200)));
  } catch {
    /* quota / serialization — ignore in mock */
  }
}

/** Relative "time-ago" label matching the admin lead list style. */
export function relTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 0) return 'เมื่อสักครู่';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m}น.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ชม.`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'เมื่อวาน' : `${d} วัน`;
}

/** Stable-ish id without relying on crypto (mock only). */
export function newLeadId(createdAt: number): string {
  return `web-${createdAt}-${Math.random().toString(36).slice(2, 7)}`;
}
