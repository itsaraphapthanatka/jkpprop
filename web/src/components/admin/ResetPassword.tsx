'use client';

/* ตั้งรหัสผ่านใหม่จากลิงก์ในอีเมล — ปลายทางของทั้งลิงก์เชิญเข้าระบบและ
   ลิงก์ลืมรหัสผ่าน · โทเคนอยู่ใน ?token= ตรวจกับเซิร์ฟเวอร์ตอนกดบันทึก */
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell, authInputWrap, authInput, authLeadIcon, authLabel, authBtn } from './AuthShell';

const MIN_LEN = 8;

export function ResetPassword() {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (pw.length < MIN_LEN) { setErr(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_LEN} ตัวอักษร`); return; }
    if (pw !== pw2) { setErr('รหัสผ่านสองช่องไม่ตรงกัน'); return; }
    setLoading(true);
    setErr('');
    try {
      const r = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
        setErr(j?.error?.message || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
        return;
      }
      setDone(true);
      /* ตั้งรหัสแล้ว session เดิมถูกล้างทั้งหมด — ส่งไปหน้าเข้าสู่ระบบ */
      window.setTimeout(() => router.push('/admin/login'), 1600);
    } catch {
      setErr('ต่อกับเซิร์ฟเวอร์ไม่ได้ — ลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <div style={{ marginTop: 26, textAlign: 'center' }}>
      <Link href="/admin/login" className="auth-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13.5px', fontWeight: 600, color: 'var(--muted2)' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
        กลับไปหน้าเข้าสู่ระบบ
      </Link>
    </div>
  );

  if (!token) {
    return (
      <AuthShell>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>ลิงก์ไม่ถูกต้อง</h2>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
          ลิงก์ที่เปิดมาไม่มีรหัสยืนยัน — กรุณากดลิงก์จากอีเมลอีกครั้ง หรือขอลิงก์ใหม่ที่หน้า “ลืมรหัสผ่าน”
        </p>
        {backToLogin}
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div data-rp-done style={{ width: 56, height: 56, borderRadius: 9999, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>ตั้งรหัสผ่านใหม่แล้ว</h2>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>กำลังพาไปหน้าเข้าสู่ระบบ…</p>
        {backToLogin}
      </AuthShell>
    );
  }

  const field = (id: string, label: string, value: string, onChange: (v: string) => void) => (
    <div style={{ marginBottom: 18 }}>
      <label style={authLabel} htmlFor={id}>{label}</label>
      <div style={authInputWrap}>
        <span style={authLeadIcon}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
        </span>
        <input id={id} className="auth-input" type="password" autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" style={authInput} />
      </div>
    </div>
  );

  return (
    <AuthShell>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>ตั้งรหัสผ่านใหม่</h2>
      <p style={{ margin: '6px 0 26px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>ตั้งรหัสผ่านของคุณเอง อย่างน้อย {MIN_LEN} ตัวอักษร</p>

      <form onSubmit={submit}>
        {field('rp-pw', 'รหัสผ่านใหม่', pw, setPw)}
        {field('rp-pw2', 'ยืนยันรหัสผ่านใหม่', pw2, setPw2)}

        {err && <div data-rp-error style={{ marginBottom: 16, padding: '10px 13px', borderRadius: 10, background: '#F9E4E1', color: '#C0392B', fontSize: 13, lineHeight: 1.6 }}>{err}</div>}

        <button type="submit" className="auth-btn" disabled={loading} style={{ ...authBtn, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.85 : 1 }}>
          {loading ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}
        </button>
      </form>

      {backToLogin}
    </AuthShell>
  );
}
