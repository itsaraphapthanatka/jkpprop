'use client';

/* What the visitor has agreed to.
 *
 * The old banner asked for consent and then did nothing with the answer:
 * "ยอมรับ" and "ปฏิเสธ" both wrote a string to localStorage that no other
 * line of code ever read, and the wording claimed the site analyses traffic,
 * which it does not. Consent that changes nothing is worse than no banner —
 * it is a record of permission the site never asked for and never honoured.
 *
 * So the categories here are only the ones that exist. This site loads no
 * analytics, no advertising and no social pixels. The single thing a visitor
 * can genuinely say no to is the Google map embedded on the contact page,
 * which is a third-party frame that sets Google's own cookies. Everything
 * else is necessary: the admin session cookie, and the list of properties a
 * visitor hearted, which is kept in their own browser.
 */
import { useCallback, useEffect, useState } from 'react';

/** bump when the categories change — an old record stops counting as an answer */
export const CONSENT_VERSION = 1;

export type Consent = { v: number; ts: string; embeds: boolean };

const KEY = 'jkp.consent.v1';
const EVT = 'jkp:consent';
/** the footer asks for the panel again — withdrawing has to be as easy as agreeing */
export const OPEN_EVT = 'jkp:consent-open';

function read(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<Consent>;
    if (c?.v !== CONSENT_VERSION || typeof c.embeds !== 'boolean') return null;
    return { v: CONSENT_VERSION, ts: String(c.ts ?? ''), embeds: c.embeds };
  } catch {
    return null;
  }
}

function write(embeds: boolean, now: Date): Consent {
  const c: Consent = { v: CONSENT_VERSION, ts: now.toISOString(), embeds };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* private mode: the choice holds for this page only, and we ask again */
  }
  window.dispatchEvent(new CustomEvent(EVT));
  return c;
}

export function openConsentSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_EVT));
}

export function useConsent() {
  /* `ready` keeps the banner off the server render and off the first client
     render — otherwise it flashes at everyone who already answered */
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    const sync = () => setConsent(read());
    sync();
    setReady(true);
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((embeds: boolean) => setConsent(write(embeds, new Date())), []);

  return {
    ready,
    /** null means they have not been asked yet, or the categories changed */
    consent,
    /** nothing optional loads until the answer is an explicit yes */
    allows: (cat: 'embeds') => (cat === 'embeds' ? consent?.embeds === true : true),
    save,
  };
}
