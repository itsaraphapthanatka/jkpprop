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

type Social = { label: string; bg: string; grad: string; glyph: React.ReactNode };

/* Official brand marks (white glyph on the brand's green gradient badge),
   matching the "gradient circle + white logo" style of the social-media
   logo collection. Paths are the standard monochrome brand glyphs. */
const SOCIALS: Social[] = [
  {
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
    label: 'WeChat',
    bg: '#DDF0DD',
    grad: 'linear-gradient(145deg,#3DC94F 0%,#07C160 100%)',
    glyph: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-3.014-5.837-6.628-6.123-.144-.01-.288-.01-.434-.007zm-3.628 3.386c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
      </svg>
    ),
  },
  {
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

function SocialButton({ s }: { s: Social }) {
  const d = useDict();
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#"
      aria-label={d.inquiry.contactVia + s.label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        padding: '14px 0',
        borderRadius: 14,
        background: s.bg,
        transition: 'transform .2s,box-shadow .2s',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 10px 22px rgba(var(--deep-rgb),.18)' : 'none',
      }}
    >
      <span style={{ width: 42, height: 42, borderRadius: 9999, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 12px rgba(0,0,0,.15)' }}>{s.glyph}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--deep)' }}>{s.label}</span>
    </a>
  );
}

/* `code` identifies the property being asked about. It was a module-level
   constant, so an enquiry sent from any property page arrived naming
   JKP-SPK0042 — the sales team could not tell what the lead was about. */
export function InquiryBox({ code = '', topOffset = 88, stacked = false }: { code?: string; topOffset?: number; stacked?: boolean }) {
  const d = useDict();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(`${d.inquiry.interestedIn} ${code}`.trim());
  const [sent, setSent] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

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

        {/* socials */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {SOCIALS.map((s) => (
            <SocialButton key={s.label} s={s} />
          ))}
        </div>

        {/* divider */}
        <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{d.inquiry.orFillIn}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* form */}
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            {sent ? (
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
        </form>
      </div>
    </div>
  );
}
