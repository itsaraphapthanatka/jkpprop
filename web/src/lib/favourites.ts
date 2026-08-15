'use client';

/* Properties a visitor has hearted.
 *
 * The heart on a listing card filled in and forgot: the state lived in the
 * page's memory, so a reload emptied it and there was nowhere to see what had
 * been saved. There are no visitor accounts on this site, so the list lives in
 * the browser — which is enough for "keep these three while I compare them",
 * the job the heart is actually doing.
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'jkp.favourites.v1';
const EVT = 'jkp:favourites';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* private mode, quota — the page still works, it just forgets */ }
  // other components on this page, and other tabs, follow along
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useFavourites() {
  /* starts empty on purpose: the server render and the first client render
     have to match, so the stored list arrives in an effect */
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setCodes(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((code: string) => {
    const next = read().includes(code) ? read().filter((c) => c !== code) : [...read(), code];
    write(next);
    setCodes(next);
  }, []);

  const clear = useCallback(() => { write([]); setCodes([]); }, []);

  return { codes, has: (code: string) => codes.includes(code), toggle, clear };
}
