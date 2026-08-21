'use client';

/* แถบติดต่อที่ติดขอบล่างจอมือถือ
 *
 * สไลด์ 18 · ลูกค้าวางภาพเว็บอ้างอิงคู่กับเว็บเรา ชี้ที่แถบล่างของเขาแล้วเขียนว่า
 * "ขอเหมือนกัน" กับ "ไม่มี Popup" — บนมือถือ กล่องติดต่อของเราไปกองอยู่ท้ายหน้า
 * คนอ่านต้องเลื่อนผ่านสเปค รูป และแผนที่ทั้งหมดก่อนจึงจะเจอช่องทางติดต่อ
 * ส่วน WeChat ไม่มีลิงก์ให้เปิด (เป็นไอดี ไม่ใช่ URL) จึงต้องมีป๊อปอัปให้คัดลอก
 *
 * ปุ่มขึ้นเฉพาะช่องทางที่กรอกไว้จริงใน /admin/company — ปุ่มที่กดแล้วไม่ไปไหน
 * แย่กว่าไม่มีปุ่ม
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDict } from '@/i18n/useDict';

type Channel = {
  key: string;
  label: string;
  /** ปุ่มพื้นสีแบรนด์ของช่องทางนั้น */
  bg: string;
  glyph: React.ReactNode;
  href?: string;
  /** WeChat ไม่มีลิงก์ กดแล้วเปิดป๊อปอัปให้คัดลอกไอดีแทน */
  copy?: string;
};

const GLYPH: Record<string, React.ReactNode> = {
  line: (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  ),
  wechat: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M8.7 3C4.6 3 1.3 5.8 1.3 9.2c0 1.9 1 3.6 2.6 4.7l-.5 1.7 2-1a9 9 0 002.6.4h.6a5.6 5.6 0 01-.2-1.5c0-3.2 3.1-5.7 6.9-5.7h.5C15.4 5.1 12.4 3 8.7 3zM6.3 7.6a1 1 0 110-2 1 1 0 010 2zm4.9 0a1 1 0 110-2 1 1 0 010 2z" />
      <path d="M22.7 13.4c0-2.7-2.7-4.9-6-4.9s-6 2.2-6 4.9 2.7 4.9 6 4.9c.7 0 1.4-.1 2-.3l1.8.9-.4-1.4c1.6-.9 2.6-2.4 2.6-4.1zm-8-.9a.85.85 0 110-1.7.85.85 0 010 1.7zm4.1 0a.85.85 0 110-1.7.85.85 0 010 1.7z" />
    </svg>
  ),
  whatsapp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  ),
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 3.925 23.094 9.101 24v-8.437H6.353v-3.49h2.748V9.63c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H14.96c-1.49 0-1.955.93-1.955 1.886v2.038h3.328l-.532 3.49h-2.796V24C20.075 23.094 24 18.1 24 12.073z" /></svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.41.6.22 1 .49 1.4.9.4.4.68.8.9 1.4.16.4.35 1 .41 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.41 2.2-.22.6-.49 1-.9 1.4-.4.4-.8.68-1.4.9-.4.16-1 .35-2.2.41-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.41-.6-.22-1-.49-1.4-.9-.4-.4-.68-.8-.9-1.4-.16-.4-.35-1-.41-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.41-2.2.22-.6.49-1 .9-1.4.4-.4.8-.68 1.4-.9.4-.16 1-.35 2.2-.41C8.4 2.2 8.8 2.2 12 2.2zm0 3.1A6.7 6.7 0 1018.7 12 6.7 6.7 0 0012 5.3zm0 11a4.3 4.3 0 114.3-4.3 4.3 4.3 0 01-4.3 4.3zm6.9-11.2a1.57 1.57 0 11-1.57-1.56 1.57 1.57 0 011.57 1.56z" /></svg>
  ),
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 1.9.6 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.1a2 2 0 012.1-.5c.9.3 1.8.5 2.8.6a2 2 0 011.7 2z" />
    </svg>
  ),
};

const BG: Record<string, string> = {
  line: 'linear-gradient(145deg,#06C755 0%,#00B900 100%)',
  wechat: 'linear-gradient(145deg,#3DC94F 0%,#07C160 100%)',
  whatsapp: 'linear-gradient(145deg,#5BE58A 0%,#25D366 100%)',
  facebook: 'linear-gradient(145deg,#3B82F6 0%,#1877F2 100%)',
  /* เว็บอ้างอิงใช้ปุ่มโทรสีเหลืองอำพัน แต่ลูกค้าเคยแจ้งไว้เองว่า "ไอคอนมีสีเหลือง
     ปนมา" และให้ใช้สีเดียวกับที่อื่น ปุ่มโทรกับ Instagram จึงใช้เขียว-เทอร์ควอยซ์
     ของแบรนด์ ส่วน Line / WeChat / WhatsApp / Facebook ใช้สีทางการของแต่ละเจ้า
     เพราะคนจำจากสีของมัน ไม่ใช่การตกแต่ง (ฟุตเตอร์ก็วาด Instagram แบบเส้นสีเดียว
     ไม่ใช้ไล่สีทางการมาตั้งแต่แรก) */
  instagram: 'linear-gradient(145deg,#0D6C3B 0%,#034956 100%)',
  phone: 'linear-gradient(145deg,#0D6C3B 0%,#034956 100%)',
};

const LABEL: Record<string, string> = {
  line: 'Line', wechat: 'WeChat', whatsapp: 'WhatsApp',
  facebook: 'Facebook', instagram: 'Instagram',
};

export function ContactBar({ socials = [], wechatId = '', phone = '' }: {
  socials?: { key: string; url: string }[];
  wechatId?: string;
  phone?: string;
}) {
  const d = useDict();
  const [sheet, setSheet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /* ปิดด้วย Esc — ป๊อปอัปที่ปิดได้ทางเดียวคือกดให้ตรงปุ่มเล็ก ๆ ใช้ยากบนมือถือ */
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  const tel = phone.replace(/[^+\d]/g, '');
  const channels: Channel[] = [
    ...socials
      .filter((s) => s.url && LABEL[s.key])
      .map((s) => ({ key: s.key, label: LABEL[s.key], bg: BG[s.key], glyph: GLYPH[s.key], href: s.url })),
    ...(wechatId ? [{ key: 'wechat', label: 'WeChat', bg: BG.wechat, glyph: GLYPH.wechat, copy: wechatId }] : []),
    ...(tel ? [{ key: 'phone', label: phone, bg: BG.phone, glyph: GLYPH.phone, href: `tel:${tel}` }] : []),
  ];

  // ไม่มีช่องทางไหนถูกตั้งค่าไว้เลย ก็ไม่ต้องมีแถบ
  if (!channels.length) return null;

  const open = channels.find((c) => c.key === sheet);

  const btn = (c: Channel) => {
    const inner = (
      <span
        style={{
          width: 40, height: 40, borderRadius: 11, background: c.bg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 9px rgba(0,0,0,.18)',
        }}
      >
        {c.glyph}
      </span>
    );
    return c.href ? (
      <a
        key={c.key} href={c.href} data-bar-channel={c.key}
        target={c.key === 'phone' ? undefined : '_blank'}
        rel={c.key === 'phone' ? undefined : 'noopener noreferrer'}
        aria-label={d.inquiry.contactVia + c.label}
      >
        {inner}
      </a>
    ) : (
      <button
        key={c.key} type="button" data-bar-channel={c.key}
        onClick={() => { setSheet(c.key); setCopied(false); }}
        aria-label={d.inquiry.contactVia + c.label}
        style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}
      >
        {inner}
      </button>
    );
  };

  return (
    <>
      <div
        id="contact-bar"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 420,
          display: 'none', alignItems: 'center', gap: 12,
          padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -6px 22px rgba(var(--ink-rgb),.14)',
        }}
      >
        <Image
          width={226} height={100} src="/assets/jkp-logo-green.png" alt="JKP Property"
          style={{ height: 26, width: 'auto', display: 'block', flexShrink: 0 }}
        />
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{d.common.contactUs}</span>
        {/* ปุ่มชิดขวา และเลื่อนได้เองถ้าช่องทางเยอะจนไม่พอ ไม่ดันแถบให้ล้นจอ */}
        <div
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9,
            overflowX: 'auto', paddingLeft: 4, scrollbarWidth: 'none',
          }}
        >
          {channels.map(btn)}
        </div>
      </div>

      {/* ป๊อปอัปของช่องทางที่ไม่มีลิงก์ให้เปิด — ตอนนี้คือ WeChat */}
      {open?.copy && (
        <div
          id="contact-bar-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={open.label}
          onClick={() => setSheet(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 430,
            background: 'rgba(var(--ink-rgb),.55)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 420, margin: 12,
              background: 'var(--surface)', borderRadius: 20, padding: '20px 20px 22px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ width: 52, height: 52, borderRadius: 15, background: open.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{open.glyph}</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{open.label}</div>
            <div data-bar-wechat-id style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', fontFamily: "'JetBrains Mono',monospace" }}>{open.copy}</div>
            <button
              type="button"
              data-bar-copy
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(open.copy!);
                  setCopied(true);
                } catch { setCopied(false); }
              }}
              style={{ width: '100%', height: 46, borderRadius: 12, border: 0, background: 'var(--pine)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {copied ? d.faq.copied : d.inquiry.copyId}
            </button>
            <button
              type="button"
              data-bar-close
              onClick={() => setSheet(null)}
              style={{ width: '100%', height: 44, borderRadius: 12, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {d.consent.back}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
