import * as React from 'react';

/* ============================================================
   Shared split-screen auth layout for the admin CMS (login,
   forgot-password). NOT from a design file — built to match the
   JKP design system + admin aesthetic: dark #0A0E0C brand panel
   with neon (#2DFB91) accents on the left, a light form panel on
   the right. Pass the form content as children.
   ============================================================ */

export const AUTH_CSS = `
.auth-input:focus{border-color:var(--accent) !important;box-shadow:0 0 0 3px rgba(3,73,86,.12);}
.auth-input::placeholder{color:var(--muted3);}
.auth-btn{transition:transform .2s,box-shadow .2s,opacity .2s;}
.auth-btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(13,108,59,.4);}
.auth-eye:hover{color:var(--text) !important;}
.auth-link:hover{color:var(--accent) !important;}
.auth-back:hover{color:var(--text) !important;}
@media (max-width:860px){
  #auth-split{grid-template-columns:1fr !important;}
  #auth-brand{display:none !important;}
  #auth-mobilelogo{display:flex !important;}
}
`;

const feature = (label: string, desc: string) => (
  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
    <div style={{ width: 30, height: 30, borderRadius: 9999, background: 'rgba(45,251,145,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: '12.5px', color: '#8FA096', lineHeight: 1.6 }}>{desc}</div>
    </div>
  </div>
);

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="auth-root" style={{ ['--bg' as string]: '#F6F5F1' } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div id="auth-split" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr .95fr' }}>

        {/* LEFT — brand panel */}
        <div id="auth-brand" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#0A0E0C 0%,#0A0E0C 42%,#0F2318 100%)', padding: '56px 56px 44px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: -80, right: -60, width: 320, height: 320, borderRadius: 9999, background: 'radial-gradient(circle,rgba(45,251,145,.16),rgba(45,251,145,0) 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -120, left: -80, width: 340, height: 340, borderRadius: 9999, background: 'radial-gradient(circle,rgba(3,73,86,.5),rgba(3,73,86,0) 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jkp-logo-white.png" alt="JKP Property" style={{ height: 34, width: 'auto', display: 'block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6B63', borderLeft: '1px solid rgba(255,255,255,.14)', paddingLeft: 10 }}>CMS</span>
          </div>

          <div style={{ position: 'relative', marginTop: 'auto', marginBottom: 'auto', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 22, height: 2, background: '#2DFB91', borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: '#2DFB91', textTransform: 'uppercase' }}>JKP Property CMS</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1.25 }}>ยินดีต้อนรับกลับ<br />สู่ระบบจัดการ</h1>
            <p style={{ margin: '14px 0 0', fontSize: '14.5px', color: '#B9C2BD', lineHeight: 1.7, maxWidth: 400 }}>บริหารทรัพย์ ลีด ดีล และเนื้อหาเว็บไซต์ของนายหน้าโรงงานและโกดังอุตสาหกรรมได้ครบในที่เดียว</p>

            <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {feature('จัดการทรัพย์ ลีด และดีลครบวงจร', 'ตั้งแต่รับ requirement จนปิดการขาย')}
              {feature('รองรับหลายภาษา ไทย · อังกฤษ · จีน', 'เนื้อหาและเอกสารพร้อมสำหรับลูกค้าต่างชาติ')}
              {feature('ระบบสิทธิ์ผู้ใช้และบันทึกการทำงาน', 'ควบคุมการเข้าถึงและตรวจสอบย้อนหลังได้')}
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#5E6B63' }}>
            <span>© 2026 JKP Property</span>
            <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, border: '1px solid rgba(255,255,255,.12)', borderRadius: 5, padding: '2px 7px' }}>v1.0</code>
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div id="auth-mobilelogo" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 26 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/jkp-logo-green.png" alt="JKP Property" style={{ height: 34, width: 'auto', display: 'block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted3)', borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>CMS</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Shared field styles reused by the auth forms. */
export const authInputWrap: React.CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center' };
export const authInput: React.CSSProperties = { width: '100%', height: 48, padding: '0 14px 0 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', fontSize: 14, color: 'var(--text)', outline: 'none', transition: 'border-color .15s,box-shadow .15s' };
export const authLeadIcon: React.CSSProperties = { position: 'absolute', left: 15, display: 'flex', pointerEvents: 'none', color: 'var(--muted2)' };
export const authLabel: React.CSSProperties = { display: 'block', marginBottom: 7, fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' };
export const authBtn: React.CSSProperties = { width: '100%', height: 50, borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 };
