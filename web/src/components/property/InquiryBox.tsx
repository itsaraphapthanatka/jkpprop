'use client';

import { useState } from 'react';
import { useDict } from '@/i18n/useDict';


const inputStyle: React.CSSProperties = {
  height: 44,
  padding: '0 14px',
  borderRadius: 11,
  border: '1px solid var(--border)',
  fontSize: '13.5px',
  background: 'var(--bg)',
  outline: 'none',
};

type Social = { key: 'line' | 'whatsapp' | 'facebook' | 'wechat'; label: string; bg: string; grad: string; glyph: React.ReactNode };

/* Official brand marks (white glyph on the brand's green gradient badge),
   matching the "gradient circle + white logo" style of the social-media
   logo collection. Paths are the standard monochrome brand glyphs. */
const SOCIALS: Social[] = [
  {
    key: 'line',
    label: 'Line',
    bg: '#E3F5DC',
    grad: 'linear-gradient(145deg,#06C755 0%,#00B900 100%)',
    glyph: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
  },
  {
    /* WeChat has no field in /admin/company to hold an ID, so there is nothing
       to link to — a button that goes nowhere is worse than one that is absent.
       Add a field there and it can come back. */
    key: 'facebook',
    label: 'Facebook',
    bg: '#DEEAFB',
    grad: 'linear-gradient(145deg,#3B82F6 0%,#1877F2 100%)',
    glyph: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 3.925 23.094 9.101 24v-8.437H6.353v-3.49h2.748V9.63c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H14.96c-1.49 0-1.955.93-1.955 1.886v2.038h3.328l-.532 3.49h-2.796V24C20.075 23.094 24 18.1 24 12.073z" /></svg>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    bg: '#DCF3E5',
    grad: 'linear-gradient(145deg,#5BE58A 0%,#25D366 100%)',
    glyph: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  },
];

/* WhatsApp can carry the first line of the message; the others cannot, and
   pretending otherwise would just produce a broken link */
function waPrefill(key: string, url: string, code: string, prefix: string) {
  if (key !== 'whatsapp' || !code) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}text=${encodeURIComponent(`${prefix} ${code}`.trim())}`;
}

function SocialButton({ s, href, onCopy, note }: {
  s: Social;
  href?: string;
  /** WeChat has no link to open, so its tile copies the ID instead */
  onCopy?: () => void;
  note?: string;
}) {
  const d = useDict();
  const [hover, setHover] = useState(false);
  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 7,
    padding: '14px 0',
    borderRadius: 14,
    border: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: s.bg,
    transition: 'transform .2s,box-shadow .2s',
    transform: hover ? 'translateY(-3px)' : 'none',
    boxShadow: hover ? '0 10px 22px rgba(var(--deep-rgb),.18)' : 'none',
  };
  const on = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };
  const inner = (
    <>
      <span style={{ width: 42, height: 42, borderRadius: 9999, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 12px rgba(0,0,0,.15)' }}>{s.glyph}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--deep)' }}>{s.label}</span>
      {note && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)', maxWidth: '92%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note}</span>}
    </>
  );

  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={d.inquiry.contactVia + s.label} style={style} {...on}>{inner}</a>
    : <button type="button" data-testid="inquiry-wechat" onClick={onCopy} aria-label={d.inquiry.contactVia + s.label} style={style} {...on}>{inner}</button>;
}

/* WeChat's own tile: the mark is here rather than in SOCIALS because there is
   no URL field for it — it is reached by copying an ID, not by a link. */
const WECHAT: Social = {
  key: 'wechat',
  label: 'WeChat',
  bg: '#DDF0DD',
  grad: 'linear-gradient(145deg,#3DC94F 0%,#07C160 100%)',
  glyph: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M8.7 3C4.6 3 1.3 5.8 1.3 9.2c0 1.9 1 3.6 2.6 4.7l-.5 1.7 2-1a9 9 0 002.6.4h.6a5.6 5.6 0 01-.2-1.5c0-3.2 3.1-5.7 6.9-5.7h.5C15.4 5.1 12.4 3 8.7 3zM6.3 7.6a1 1 0 110-2 1 1 0 010 2zm4.9 0a1 1 0 110-2 1 1 0 010 2z" />
      <path d="M22.7 13.4c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.4-.1 2-.3l1.8.9-.4-1.4c1.6-.9 2.6-2.4 2.6-4.1zm-8-.9a.85.85 0 110-1.7.85.85 0 010 1.7zm4.1 0a.85.85 0 110-1.7.85.85 0 010 1.7z" />
    </svg>
  ),
};

/* `code` identifies the property being asked about. It was a module-level
   constant, so an enquiry sent from any property page arrived naming
   JKP-SPK0042 — the sales team could not tell what the lead was about. */
export function InquiryBox({ code = '', typeLabel = '', socials = [], wechatId = '', callNumber = '', topOffset = 88, stacked = false }: {
  code?: string;
  /** what kind of property is being asked about, for the lead record */
  typeLabel?: string;
  /** the company's own chat accounts — only the ones that are set are shown */
  socials?: { key: string; url: string }[];
  /** เบอร์หลักของบริษัท — ลูกค้าแจ้งว่าหน้านี้ 'ไม่มีปุ่มโทร' */
  callNumber?: string;
  /** WeChat has no link; the button copies the ID */
  wechatId?: string;
  topOffset?: number;
  stacked?: boolean;
}) {
  const d = useDict();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(`${d.inquiry.interestedIn} ${code}`.trim());
  /* สไลด์ 16 · ต้องเลือกได้ว่าติดต่อมาในฐานะลูกค้าหรือนายหน้า — เดิมกล่องนี้
     ส่งค่า "ลูกค้า" ไปตายตัว นายหน้าที่ถามมาจึงถูกบันทึกเป็นลูกค้าทุกราย */
  const [who, setWho] = useState(d.requirement.customer);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [btnHover, setBtnHover] = useState(false);

  /* This used to be `setSent(true)` and nothing else: the visitor typed their
     name and number, saw "ส่งเรียบร้อย", and no one at the company ever heard
     about it. It posts to the same endpoint the requirement form on /contact
     uses, so the enquiry lands in the leads queue with the property code on it. */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, email, message,
          respondentType: who,
          typeLabel,
          req: [{ k: 'ทรัพย์ที่สนใจ', v: code }],
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message || d.inquiry.failed);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.inquiry.failed);
    } finally {
      setBusy(false);
    }
  };

  /* a chat button is drawn only when there is an account behind it */
  const channels = SOCIALS
    .map((s) => ({ s, url: socials.find((c) => c.key === s.key)?.url ?? '' }))
    .filter((c) => c.url);
  const [wechatCopied, setWechatCopied] = useState(false);
  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(wechatId);
      setWechatCopied(true);
      setTimeout(() => setWechatCopied(false), 2000);
    } catch { /* refused — the ID is on screen either way */ }
  };
  const tiles = channels.length + (wechatId ? 1 : 0);

  return (
    <div id="pd-inquiry" style={{ position: stacked ? 'static' : 'sticky', top: stacked ? 'auto' : topOffset, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{d.inquiry.heading}</div>

        {/* agent */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: 'var(--bg)' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--pine)', color: 'var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>JKP</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>JKP Property</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{d.inquiry.hours}</div>
          </div>
        </div>

        {/* ปุ่มโทร — เดิมหน้านี้มีแต่ช่องแชตกับฟอร์ม คนที่อยากโทรต้องไปหาเบอร์
            เองที่หน้าติดต่อ */}
        {callNumber && (
          <a
            href={`tel:${callNumber.replace(/[^+\d]/g, '')}`}
            data-call-btn
            style={{ marginTop: 12, height: 46, borderRadius: 12, background: 'var(--pine)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />
            </svg>
            {callNumber}
          </a>
        )}

        {/* socials */}
        {tiles > 0 && (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, tiles)}, 1fr)`, gap: 8 }}>
            {channels.map(({ s, url }) => (
              <SocialButton key={s.label} s={s} href={waPrefill(s.key, url, code, d.inquiry.interestedIn)} />
            ))}
            {wechatId && (
              <SocialButton s={WECHAT} onCopy={copyWechat} note={wechatCopied ? d.faq.copied : wechatId} />
            )}
          </div>
        )}

        {/* divider */}
        <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{d.inquiry.orFillIn}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* form */}
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{d.requirement.respondentStatus}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                {[d.requirement.customer, d.requirement.agent].map((opt) => {
                  const on = who === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      data-who={opt === d.requirement.agent ? 'agent' : 'customer'}
                      data-on={on ? '1' : '0'}
                      aria-pressed={on}
                      onClick={() => setWho(opt)}
                      style={{ flex: 1, height: 40, borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? 'var(--deep)' : 'var(--border)'), background: on ? 'rgba(var(--deep-rgb),.06)' : 'var(--bg)', color: on ? 'var(--deep)' : 'var(--text)' }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <input placeholder={d.inquiry.namePh} value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <input placeholder={d.inquiry.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder={d.inquiry.phonePh} value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <textarea
              placeholder={`${d.inquiry.interestedIn} ${code} ${d.inquiry.wantMore}`.trim()}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ height: 88, padding: '12px 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--bg)', outline: 'none', resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={busy || sent}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              marginTop: 14,
              width: '100%',
              height: 50,
              border: 0,
              borderRadius: 12,
              background: sent ? 'var(--accent)' : 'var(--deep)',
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: '14.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'transform .2s,box-shadow .2s,background .2s',
              transform: btnHover ? 'translateY(-2px)' : 'none',
              boxShadow: btnHover ? '0 12px 26px rgba(var(--deep-rgb),.35)' : 'none',
            }}
          >
            {busy ? d.inquiry.sending : sent ? (
              <>
                {d.inquiry.sent}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </>
            ) : (
              <>
                {d.inquiry.send}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </>
            )}
          </button>

          {error && (
            <p id="pd-inquiry-error" role="alert" style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.6, color: '#B3261E' }}>{error}</p>
          )}
          {sent && !error && (
            <p id="pd-inquiry-sent" role="status" style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--accent)' }}>{d.inquiry.sentNote}</p>
          )}
        </form>
      </div>
    </div>
  );
}
