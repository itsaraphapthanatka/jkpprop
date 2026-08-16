'use client';

/* The share button's menu.
 *
 * The share control on a property page was a <div> with a cursor and no
 * handler, and the one on the listing page offered two things. This is one
 * menu, used by both: copy, email, and the three chat apps this site's readers
 * actually use.
 *
 * WeChat has no share URL a browser may open — the weixin:// scheme is not
 * available to web pages — so it does what every Chinese site does and shows
 * the page as a QR code for the app's scanner. Claiming a "share to WeChat"
 * link that silently fails would be worse than showing the square.
 */
import * as React from 'react';
import { useDict } from '@/i18n/useDict';
import { placeMenu } from '@/lib/menuPlacement';

export type ShareTarget = { url: string; title: string };

export function ShareMenu({ target, children, align = 'right' }: {
  target: ShareTarget;
  /** the trigger; it is wrapped, so it keeps whatever styling it came with */
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const d = useDict();
  const [open, setOpen] = React.useState(false);
  const [box, setBox] = React.useState({ top: 0, left: 0, width: 240 });
  const [copied, setCopied] = React.useState(false);
  const [qr, setQr] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  const url = target.url || (typeof window === 'undefined' ? '' : window.location.href);

  /* The menu is positioned `fixed`, so it has to be told when the page moves
     under it. Closing on scroll was the first attempt and it was wrong: a
     phone's momentum, or the browser's own scroll-into-view, shut the menu the
     moment it opened. It follows the button instead, and closes only when the
     reader clicks away or presses Escape. */
  React.useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setBox(placeMenu(r, { minWidth: 240, width: 240, align, maxHeight: 420 }));
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, align]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    const r = ref.current?.getBoundingClientRect();
    if (r) setBox(placeMenu(r, { minWidth: 240, width: 240, align, maxHeight: 420 }));
    setQr(null);
    setCopied(false);
    setOpen(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setOpen(false), 900);
    } catch {
      /* the clipboard was refused — leave the menu open rather than claim a
         copy that did not happen */
    }
  };

  const openQr = async () => {
    const QR = (await import('qrcode')).default;
    setQr(await QR.toDataURL(url, { margin: 1, width: 320 }));
  };

  const mail = `mailto:?subject=${encodeURIComponent(target.title)}&body=${encodeURIComponent(`${target.title}\n${url}`)}`;
  const line = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${target.title} ${url}`)}`;

  return (
    <>
      <div ref={ref} onClick={toggle} data-share-trigger style={{ display: 'inline-flex' }}>
        {children}
      </div>

      {/* A sheet behind the menu catches the click that closes it. A listener
          on `document` did that before, and it also caught the clicks *inside*
          the menu — pressing WeChat closed the menu instead of showing the
          code. */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 940 }} />}

      {open && (
        <div
          id="share-menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', top: box.top, left: box.left, width: box.width, zIndex: 950,
            background: 'var(--surface)', borderRadius: 18, padding: 10,
            boxShadow: '0 24px 60px rgba(var(--ink-rgb),.22)', border: '1px solid var(--border)',
          }}
        >
          {qr ? (
            <div style={{ padding: '10px 8px 12px', textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={d.share.wechat} width={200} height={200} style={{ width: 200, height: 200, borderRadius: 12 }} />
              <p style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)' }}>{d.share.wechatHint}</p>
              <button onClick={() => setQr(null)} style={backBtn}>{d.share.back}</button>
            </div>
          ) : (
            <>
              <Row icon={linkIcon} label={copied ? d.faq.copied : d.share.copy} onClick={copy} testId="share-copy" />
              <Row icon={mailIcon} label={d.share.email} href={mail} testId="share-email" />
              <Row icon={lineIcon} label="Line" href={line} testId="share-line" />
              <Row icon={waIcon} label="WhatsApp" href={wa} testId="share-whatsapp" />
              <Row icon={wechatIcon} label="WeChat" onClick={openQr} testId="share-wechat" />
            </>
          )}
        </div>
      )}
    </>
  );
}

function Row({ icon, label, href, onClick, testId }: {
  icon: React.ReactNode; label: string; href?: string; onClick?: () => void; testId: string;
}) {
  const [hover, setHover] = React.useState(false);
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
    padding: '11px 12px', border: 0, borderRadius: 12, cursor: 'pointer',
    background: hover ? 'var(--bg2)' : 'transparent', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 15, fontWeight: 700, textAlign: 'left',
  };
  const inner = (<>{icon}{label}</>);
  const on = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };
  return href
    ? <a data-testid={testId} href={href} target="_blank" rel="noopener noreferrer" style={style} {...on}>{inner}</a>
    : <button data-testid={testId} type="button" onClick={onClick} style={style} {...on}>{inner}</button>;
}

const backBtn: React.CSSProperties = {
  marginTop: 10, height: 34, padding: '0 16px', border: '1px solid var(--border)',
  borderRadius: 9999, background: 'var(--surface)', color: 'var(--text)',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

const GOLD = '#C79A2E';
const linkIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.9">
    <path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" />
  </svg>
);
const mailIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.9">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
  </svg>
);
const lineIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="6" fill={GOLD} />
    <path fill="#fff" d="M12 5.4c-3.6 0-6.5 2.3-6.5 5.2 0 2.6 2.3 4.7 5.4 5.1.2 0 .5.1.6.3.1.2 0 .4 0 .6l-.1.6c0 .2-.1.6.5.3s3.4-2 4.6-3.4c.8-.9 1.2-1.8 1.2-2.9 0-2.9-2.9-5.2-6.5-5.2z" />
  </svg>
);
const waIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.7">
    <path d="M21 11.5a8.5 8.5 0 01-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1121 11.5z" />
    <path d="M8.8 9.2c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .5.4l.7 1.6c0 .2 0 .3-.1.5l-.4.5c-.1.2-.2.3 0 .6.7 1.1 1.6 1.8 2.7 2.2.3.1.4 0 .5-.1l.6-.7c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.3 0 .8-.5 1.6-1.4 1.8-2.6.5-6.9-3.4-7.1-6-.1-.6.1-1.1.3-1.3z" />
  </svg>
);
const wechatIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={GOLD} aria-hidden="true">
    <path d="M8.7 3C4.6 3 1.3 5.8 1.3 9.2c0 1.9 1 3.6 2.6 4.7l-.5 1.7 2-1a9 9 0 002.6.4h.6a5.6 5.6 0 01-.2-1.5c0-3.2 3.1-5.7 6.9-5.7h.5C15.4 5.1 12.4 3 8.7 3zM6.3 7.6a1 1 0 110-2 1 1 0 010 2zm4.9 0a1 1 0 110-2 1 1 0 010 2z" />
    <path d="M22.7 13.4c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.4-.1 2-.3l1.8.9-.4-1.4c1.6-.9 2.6-2.4 2.6-4.1zm-8-.9a.85.85 0 110-1.7.85.85 0 010 1.7zm4.1 0a.85.85 0 110-1.7.85.85 0 010 1.7z" />
  </svg>
);
