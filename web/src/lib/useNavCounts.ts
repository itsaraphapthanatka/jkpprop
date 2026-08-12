'use client';

/* The two numbers beside Leads and Requirements in the sidebar.
 *
 * They were the string literals '18' and '7', written into the nav table when
 * the shell was ported from the prototype. They never moved, so the sidebar
 * claimed eighteen leads needed attention on a fresh install with none — and
 * kept claiming it after the real ones were worked through.
 *
 * Cached per page load like useMe, and it counts what is *waiting*, not what
 * exists: a badge that shows the all-time total is decoration.
 */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/apiClient';

export type NavCounts = { leads: number; requirements: number };

let cache: NavCounts | null = null;
let inflight: Promise<NavCounts | null> | null = null;

export function clearNavCounts() {
  cache = null;
}

async function fetchCounts(): Promise<NavCounts | null> {
  if (cache) return cache;
  inflight ??= apiGet<NavCounts>('/api/nav-counts')
    .then((c) => (cache = c))
    .catch(() => null)
    .finally(() => { inflight = null; });
  return inflight;
}

export function useNavCounts(): NavCounts | null {
  const [counts, setCounts] = useState<NavCounts | null>(null);
  useEffect(() => {
    let alive = true;
    fetchCounts().then((c) => { if (alive && c) setCounts(c); });
    return () => { alive = false; };
  }, []);
  return counts;
}
