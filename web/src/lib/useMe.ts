'use client';

/* Current signed-in user — GET /api/me/permissions, cached per page load.
   Hydration-safe: first render returns null everywhere, then narrows in an
   effect (FRONTEND_API_SPEC §2.1). */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/apiClient';
import type { PrivKey, RoleKey, Scope } from '@/lib/rbac';

export type Me = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  scope: Scope;
  privileges: PrivKey[];
  expiresAt: string | null;
  mustChangePassword?: boolean;
};

let cache: Me | null = null;
let inflight: Promise<Me | null> | null = null;

async function fetchMe(): Promise<Me | null> {
  if (cache) return cache;
  if (!inflight) {
    inflight = apiGet<Me>('/api/me/permissions')
      .then((m) => (cache = m))
      .catch(() => null)
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function clearMeCache() {
  cache = null;
}

export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    fetchMe().then((m) => { if (alive && m) setMe(m); });
    return () => { alive = false; };
  }, []);
  return me;
}

export function hasPrivilege(me: Me | null, priv: PrivKey): boolean {
  return !!me && me.privileges.includes(priv);
}
