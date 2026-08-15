'use client';

/* The consent dialog, on every public page.
 *
 * It replaces a card in the corner that only the home page, the listing page
 * and a property page ever showed — so a visitor who landed on /contact, the
 * one page with a third-party frame on it, was never asked at all.
 *
 * Three ways out, as on the sites this was modelled on: manage, refuse the
 * optional part, or accept. Refusing is one click, the same as accepting —
 * consent that is harder to withhold than to give is not consent.
 */
import * as React from 'react';
import Link from '@/i18n/LocaleLink';
import { useDict } from '@/i18n/useDict';
import { useConsent, OPEN_EVT } from '@/lib/consent';

export function ConsentGate() {
  const d = useDict();
  const { ready, consent, save } = useConsent();
  const [open, setOpen] = React.useState(false);
  const [manage, setManage] = React.useState(false);
  const [embeds, setEmbeds] = React.useState(false);

  // first visit: ask. afterwards only the footer link opens it again.
  React.useEffect(() => {
    if (ready && !consent) setOpen(true);
  }, [ready, consent]);

  React.useEffect(() => {
    const reopen = () => {
      setEmbeds(consent?.embeds ?? false);
      setManage(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVT, reopen);
    return () => window.removeEventListener(OPEN_EVT, reopen);
  }, [consent]);

  if (!open) return null;

  const decide = (v: boolean) => { save(v); setOpen(false); setManage(false); };

  return (
    <div
      id="consent-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        background: 'rgba(10,14,12,.55)', backdropFilter: 'blur(2px)',
        animation: 'consentIn .25s ease-out both',
      }}
    >
      <div
        style={{
          width: 560, maxWidth: '100%', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto',
          background: 'var(--surface)', borderRadius: 20, padding: '30px 32px',
          boxShadow: '0 30px 80px rgba(0,0,0,.35)',
        }}
      >
        <h2 id="consent-title" style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--text)' }}>
          {d.consent.title}
        </h2>

        {!manage ? (
          <>
            <p style={{ margin: '14px 0 0', fontSize: 14, lineHeight: 1.75, color: 'var(--muted)' }}>
              {d.consent.body}
            </p>
            <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.75, color: 'var(--muted)' }}>
              {d.consent.noTracking}{' '}
              <Link href="/p/cookies" style={{ color: 'var(--accent)', fontWeight: 600 }}>{d.consent.cookiePolicy}</Link>
              {' · '}
              <Link href="/p/privacy" style={{ color: 'var(--accent)', fontWeight: 600 }}>{d.consent.privacyPolicy}</Link>
            </p>
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
              <button id="consent-manage" onClick={() => { setEmbeds(consent?.embeds ?? false); setManage(true); }} style={ghost}>
                {d.consent.manage}
              </button>
              <button id="consent-reject" onClick={() => decide(false)} style={ghost}>
                {d.consent.rejectOptional}
              </button>
              <button id="consent-accept" onClick={() => decide(true)} style={solid}>
                {d.consent.acceptAll}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Category title={d.consent.necessary} body={d.consent.necessaryBody} state={d.consent.always} />
              <Category
                title={d.consent.embeds}
                body={d.consent.embedsBody}
                state={embeds ? d.consent.on : d.consent.off}
                on={embeds}
                onToggle={() => setEmbeds((v) => !v)}
              />
            </div>
            <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setManage(false)} style={ghost}>{d.consent.back}</button>
              <button id="consent-save" onClick={() => decide(embeds)} style={solid}>{d.consent.save}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* one row per category that actually exists on this site */
function Category({ title, body, state, on, onToggle }: {
  title: string; body: string; state: string; on?: boolean; onToggle?: () => void;
}) {
  const locked = !onToggle;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', background: 'var(--bg2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        {locked ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted2)', whiteSpace: 'nowrap' }}>{state}</span>
        ) : (
          <button
            data-consent-toggle
            role="switch"
            aria-checked={on}
            aria-label={title}
            onClick={onToggle}
            style={{
              flexShrink: 0, width: 52, height: 30, borderRadius: 9999, cursor: 'pointer', position: 'relative',
              border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
              background: on ? 'var(--accent)' : 'var(--surface)', transition: 'background .2s, border-color .2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: on ? 25 : 3, width: 22, height: 22, borderRadius: 9999,
              background: on ? '#fff' : 'var(--muted3)', transition: 'left .2s',
            }} />
          </button>
        )}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{body}</p>
    </div>
  );
}

const solid: React.CSSProperties = {
  height: 46, padding: '0 22px', border: 0, borderRadius: 11, background: 'var(--accent)', color: '#fff',
  fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer',
};
const ghost: React.CSSProperties = {
  height: 46, padding: '0 20px', border: '1px solid var(--border)', borderRadius: 11, background: 'var(--surface)',
  color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
