/* ============================================================
   Lease-expiry notifications.

   - Leases come from /api/leases — the real book. There used to be a mock
     book here as well, shown whenever the table was empty, so the bell warned
     about tenants who did not exist ("บ. ไทยโลจิสติกส์ · เกินกำหนด 11 วัน")
     against property codes this org never owned. An empty book now shows as
     empty, which is the honest answer.
   - NotifyConfig is what the admin sets in Settings → การแจ้งเตือน
     (แจ้งเตือนก่อนหมดสัญญา 1 / 2 / 3 เดือน), persisted to localStorage.
   - buildAlerts() turns leases + config into the list rendered in the topbar
     bell. Everything here is client-only: call it from an effect, never during
     render, so the server and first client render stay identical.
   ============================================================ */

export type Lease = {
  id: string;
  code: string; // public_code, e.g. JKP-SPK0042
  title: string;
  tenant: string;
  endsInDays: number; // negative = already past the end date
  /** the dates themselves, so the manage form can edit what is stored */
  startDate?: string | null;
  endDate?: string;
  rent: number; // บาท / เดือน
  href: string;
};



/** Milestones the admin can switch on, in months before the end date. */
export const MILESTONE_MONTHS = [1, 2, 3] as const;
const DAYS_PER_MONTH = 30;

export type NotifyConfig = {
  enabled: boolean;
  months: number[]; // which milestones are active
  includeExpired: boolean; // also alert leases already past their end date
  readIds: string[]; // dismissed/read alert ids
};

export const DEFAULT_NOTIFY: NotifyConfig = { enabled: true, months: [1, 3], includeExpired: true, readIds: [] };

const LS_KEY = 'jkp.leaseNotify.v1';

export function loadNotifyConfig(): NotifyConfig {
  if (typeof window === 'undefined') return DEFAULT_NOTIFY;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_NOTIFY;
    const o = JSON.parse(raw) as Partial<NotifyConfig> | null;
    if (!o || typeof o !== 'object') return DEFAULT_NOTIFY;
    const months = Array.isArray(o.months)
      ? o.months.filter((m): m is number => typeof m === 'number' && (MILESTONE_MONTHS as readonly number[]).includes(m))
      : DEFAULT_NOTIFY.months;
    return {
      enabled: typeof o.enabled === 'boolean' ? o.enabled : DEFAULT_NOTIFY.enabled,
      months,
      includeExpired: typeof o.includeExpired === 'boolean' ? o.includeExpired : DEFAULT_NOTIFY.includeExpired,
      readIds: Array.isArray(o.readIds) ? o.readIds.filter((x): x is string => typeof x === 'string') : [],
    };
  } catch {
    return DEFAULT_NOTIFY;
  }
}

export function saveNotifyConfig(cfg: NotifyConfig) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch { /* quota — mock only */ }
}

export type AlertLevel = 'expired' | 'urgent' | 'warn';

export type LeaseAlert = {
  id: string; // stable across reloads so "read" sticks
  lease: Lease;
  daysLeft: number;
  endDateLabel: string;
  milestone: number | null; // months milestone matched; null = already expired
  level: AlertLevel;
  read: boolean;
};

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** Thai-formatted end date derived from the day offset (client-only). */
export function endDateLabel(endsInDays: number, now = Date.now()): string {
  const d = new Date(now + endsInDays * 86400000);
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/**
 * Alerts for the bell: one per lease, using the tightest milestone it has
 * crossed. Sorted most urgent first. Returns [] when notifications are off.
 */
export function buildAlerts(cfg: NotifyConfig, leases: Lease[] = [], now = Date.now()): LeaseAlert[] {
  if (!cfg.enabled) return [];
  const read = new Set(cfg.readIds);
  const months = [...cfg.months].sort((a, b) => a - b); // tightest first
  const out: LeaseAlert[] = [];

  leases.forEach((lease) => {
    const daysLeft = lease.endsInDays;
    let milestone: number | null = null;
    let level: AlertLevel;

    if (daysLeft < 0) {
      if (!cfg.includeExpired) return;
      level = 'expired';
    } else {
      const hit = months.find((m) => daysLeft <= m * DAYS_PER_MONTH);
      if (hit === undefined) return; // outside every selected window
      milestone = hit;
      level = hit <= 1 ? 'urgent' : 'warn';
    }

    const id = `${lease.id}-${milestone ?? 'expired'}`;
    out.push({ id, lease, daysLeft, endDateLabel: endDateLabel(daysLeft, now), milestone, level, read: read.has(id) });
  });

  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

export const unreadCount = (alerts: LeaseAlert[]) => alerts.filter((a) => !a.read).length;

/* ---- API-backed loading -------------------------------------------------
   The lease book + org thresholds now live on the server; localStorage keeps
   working as an offline cache so the bell never renders empty (§2.2). */
import { apiGet } from './apiClient';

type ApiLease = Lease & { endDate?: string; status?: string };

export async function fetchLeaseData(): Promise<{ leases: Lease[]; cfg: NotifyConfig }> {
  try {
    const [leaseRes, cfgRes] = await Promise.all([
      apiGet<{ items: ApiLease[] }>('/api/leases?status=active'),
      apiGet<NotifyConfig>('/api/notify-config'),
    ]);
    const leases: Lease[] = (Array.isArray(leaseRes.items) ? leaseRes.items : []).map((l) => ({
      id: l.id, code: l.code, title: l.title, tenant: l.tenant,
      endsInDays: typeof l.endsInDays === 'number' ? l.endsInDays : 0,
      startDate: l.startDate ?? null,
      endDate: l.endDate,
      rent: l.rent, href: l.href || '/admin/deals',
    }));
    const cfg: NotifyConfig = {
      enabled: typeof cfgRes.enabled === 'boolean' ? cfgRes.enabled : DEFAULT_NOTIFY.enabled,
      months: Array.isArray(cfgRes.months) ? cfgRes.months : DEFAULT_NOTIFY.months,
      includeExpired: typeof cfgRes.includeExpired === 'boolean' ? cfgRes.includeExpired : DEFAULT_NOTIFY.includeExpired,
      readIds: Array.isArray(cfgRes.readIds) ? cfgRes.readIds : [],
    };
    saveNotifyConfig(cfg); // refresh the local cache
    return { leases, cfg };
  } catch {
    // offline / not signed in → cached config, and no invented contracts
    return { leases: [], cfg: loadNotifyConfig() };
  }
}
