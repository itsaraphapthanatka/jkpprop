'use client';

import { useState } from 'react';

const PROPERTY_CODE = 'JKP-SPK0042';

const inputStyle: React.CSSProperties = {
  height: 44,
  padding: '0 14px',
  borderRadius: 11,
  border: '1px solid var(--border)',
  fontSize: '13.5px',
  background: 'var(--bg)',
  outline: 'none',
};

type Social = { label: string; bg: string; badgeBg: string; badge: React.ReactNode };

const SOCIALS: Social[] = [
  { label: 'Line', bg: '#E3F5DC', badgeBg: '#06C755', badge: <span style={{ fontSize: 13, fontWeight: 800 }}>L</span> },
  { label: 'WeChat', bg: '#DDF0DD', badgeBg: '#1AAD19', badge: <span style={{ fontSize: 12, fontWeight: 800 }}>微</span> },
  {
    label: 'WhatsApp',
    bg: '#DCF3E5',
    badgeBg: '#25D366',
    badge: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
        <path d="M21 11.5a8.4 8.4 0 01-9 8.4c-1.5 0-2.9-.4-4.1-1L3 20l1.2-4.8A8.3 8.3 0 013 11.5 8.5 8.5 0 0112 3a8.5 8.5 0 019 8.5z" />
      </svg>
    ),
  },
];

function SocialButton({ s }: { s: Social }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '12px 0',
        borderRadius: 12,
        background: s.bg,
        transition: 'transform .2s',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <span style={{ width: 30, height: 30, borderRadius: 8, background: s.badgeBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.badge}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#0D6C3B' }}>{s.label}</span>
    </a>
  );
}

export function InquiryBox({ topOffset = 88 }: { topOffset?: number }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(`สนใจทรัพย์ ${PROPERTY_CODE}`);
  const [sent, setSent] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div id="pd-inquiry" style={{ position: 'sticky', top: topOffset, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>ขอข้อมูลเพิ่มเติม</div>

        {/* agent */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: 'var(--bg)' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#273c33', color: '#2DFB91', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>JKP</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>JKP Property</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>ทีมขายพร้อมดูแล จ–ศ 9:00–18:00</div>
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
          <span style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>หรือกรอกฟอร์ม</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* form */}
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="ชื่อของคุณ" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <input placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder="เบอร์โทรศัพท์" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <textarea
              placeholder={`สนใจทรัพย์ ${PROPERTY_CODE} ต้องการข้อมูลเพิ่มเติม…`}
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
              background: sent ? '#034956' : '#0D6C3B',
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
              boxShadow: btnHover ? '0 12px 26px rgba(13,108,59,.35)' : 'none',
            }}
          >
            {sent ? (
              <>
                ส่งแล้ว
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </>
            ) : (
              <>
                ส่งคำถาม
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
