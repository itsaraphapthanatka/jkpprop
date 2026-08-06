/* ============================================================
   Social Status — which channels each listing has already been posted to,
   plus the post text (auto-generated, editable per listing).
   localStorage only for now; see FRONTEND_API_SPEC.md.
   ============================================================ */

export type Channel = { key: string; label: string };

/** one channel's state for one listing */
export type ChannelPost = { done: boolean; date?: string; url?: string };

export type SocialRecord = {
  text?: string; // manual override of the generated template
  channels: Record<string, ChannelPost>;
};

export type SocialStore = {
  channels: Channel[];
  records: Record<string, SocialRecord>; // keyed by listing code
};

export const DEFAULT_CHANNELS: Channel[] = [
  { key: 'ddproperty', label: 'DD Property' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'proppit', label: 'PROPPIT' },
];

const LS_KEY = 'jkp.socialStatus.v1';
const EMPTY: SocialStore = { channels: DEFAULT_CHANNELS, records: {} };

export function loadSocial(): SocialStore {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return EMPTY;
    const o = JSON.parse(raw) as Partial<SocialStore>;
    const channels = Array.isArray(o.channels)
      ? o.channels.filter((c): c is Channel => !!c && typeof c.key === 'string' && typeof c.label === 'string')
      : [];
    const records = o.records && typeof o.records === 'object' ? (o.records as SocialStore['records']) : {};
    return { channels: channels.length ? channels : DEFAULT_CHANNELS, records };
  } catch {
    return EMPTY;
  }
}

export function saveSocial(s: SocialStore) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota — ignore in mock */ }
}

/** Always returns a usable record, even for a listing never touched before. */
export function recordOf(s: SocialStore, code: string): SocialRecord {
  return s.records[code] || { channels: {} };
}

export function postOf(rec: SocialRecord, channelKey: string): ChannelPost {
  return rec.channels[channelKey] || { done: false };
}

export const doneCount = (rec: SocialRecord, channels: Channel[]) =>
  channels.filter((c) => postOf(rec, c.key).done).length;

/** slug for a newly added channel; keeps keys stable and collision-free */
export function channelKey(label: string, taken: string[]): string {
  const base = label.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'channel';
  let k = base;
  let n = 2;
  while (taken.includes(k)) k = `${base}-${n++}`;
  return k;
}

/** today's date as YYYY-MM-DD, for stamping a channel when it gets ticked */
export const todayISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
