'use client';

/* Settings › อีเมล — ตั้งค่าเซิร์ฟเวอร์อีเมลขาออกเอง
 *
 * เดิมค่าพวกนี้อยู่ในไฟล์ตั้งค่าของเซิร์ฟเวอร์ ทีมที่ดูแลเว็บเข้าไปแก้เองไม่ได้
 * ต้องรอทีมพัฒนาทุกครั้งที่เปลี่ยนผู้ให้บริการหรือรหัสหมดอายุ
 */
import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiGet, apiPut, apiPost, ApiClientError } from '@/lib/apiClient';

type Settings = {
  host: string; port: number; secure: boolean; username: string;
  fromEmail: string; fromName: string; hasPassword: boolean;
  lastTestAt: number | null; lastTestOk: boolean | null; lastTestError: string;
};

const EMPTY: Settings = {
  host: '', port: 587, secure: false, username: '', fromEmail: '', fromName: '',
  hasPassword: false, lastTestAt: null, lastTestOk: null, lastTestError: '',
};

/* ค่าที่ผู้ให้บริการแต่ละเจ้าใช้ — กรอกเองทั้งหมดก็ได้ ปุ่มนี้แค่ช่วยไม่ให้ต้อง
   ไปเปิดคู่มือ · รหัสผ่านยังต้องเอามาจากผู้ให้บริการเอง */
const PRESETS: { key: string; label: string; host: string; port: number; secure: boolean; hint: string }[] = [
  { key: 'resend', label: 'Resend', host: 'smtp.resend.com', port: 587, secure: false, hint: 'ชื่อผู้ใช้คือ resend · รหัสผ่านคือ API key ที่ขึ้นต้นด้วย re_' },
  { key: 'gmail', label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 587, secure: false, hint: 'ต้องเปิด 2 ชั้นก่อน แล้วสร้าง App Password มาใช้ — ไม่ใช่รหัสผ่านบัญชี' },
  { key: 'sendgrid', label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false, hint: 'ชื่อผู้ใช้คือ apikey เสมอ · รหัสผ่านคือ API key' },
  { key: 'ses', label: 'Amazon SES', host: 'email-smtp.ap-southeast-1.amazonaws.com', port: 587, secure: false, hint: 'ใช้ SMTP credentials ของ SES ไม่ใช่ access key ของ AWS' },
];

const label: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const input: React.CSSProperties = { width: '100%', height: 42, padding: '0 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px' };

export function MailSettingsBody() {
  const [s, setS] = React.useState<Settings>(EMPTY);
  const [pw, setPw] = React.useState('');
  const [hint, setHint] = React.useState('');
  const [busy, setBusy] = React.useState('');
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [testTo, setTestTo] = React.useState('');

  React.useEffect(() => {
    apiGet<Settings>('/api/mail-settings').then((r) => setS({ ...EMPTY, ...r })).catch(() => setS(EMPTY));
  }, []);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((o) => ({ ...o, [k]: v }));

  /* ห้ามตั้งชื่อขึ้นต้นด้วย use — ตัวตรวจกฎของ React จะถือว่าเป็น Hook แล้วห้าม
     เรียกใน callback ทำให้ build ล้ม */
  const applyPreset = (p: typeof PRESETS[number]) => {
    setS((o) => ({ ...o, host: p.host, port: p.port, secure: p.secure }));
    setHint(p.hint);
  };

  const save = async () => {
    if (busy) return;
    setBusy('save');
    setMsg(null);
    try {
      const r = await apiPut<{ hasPassword: boolean }>('/api/mail-settings', { ...s, password: pw });
      setPw('');
      set('hasPassword', r.hasPassword);
      setMsg({ ok: true, text: 'บันทึกแล้ว — กด “ส่งอีเมลทดสอบ” เพื่อดูว่าใช้ได้จริงไหม' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ' });
    } finally { setBusy(''); }
  };

  const test = async () => {
    if (busy) return;
    setBusy('test');
    setMsg(null);
    try {
      const r = await apiPost<{ to: string }>('/api/mail-settings/test', { to: testTo.trim() });
      setMsg({ ok: true, text: `ส่งสำเร็จ — ตรวจกล่องจดหมายของ ${r.to} (ดูโฟลเดอร์สแปมด้วย)` });
      set('lastTestOk', true);
      set('lastTestAt', Date.now());
      set('lastTestError', '');
    } catch (e) {
      const text = e instanceof ApiClientError ? e.message : 'ส่งไม่สำเร็จ';
      setMsg({ ok: false, text });
      set('lastTestOk', false);
      set('lastTestAt', Date.now());
      set('lastTestError', text);
    } finally { setBusy(''); }
  };

  const ready = s.host.trim() && s.fromEmail.trim();

  return (
    <AdminShell active="settings" eyebrow="ระบบ / Settings" title="อีเมล" actions={null}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>

        <div style={{ ...card, background: 'var(--bg)', fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.75 }}>
          ระบบใช้ค่าตรงนี้ส่ง <b style={{ color: 'var(--text)' }}>อีเมลเชิญเข้าระบบ</b> และ <b style={{ color: 'var(--text)' }}>ลิงก์ตั้งรหัสผ่านใหม่</b>
          <br />ยังไม่ตั้งค่าก็ใช้งานระบบได้ตามปกติ — แค่ต้องคัดลอกลิงก์ส่งให้ผู้ใช้เอง
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>ผู้ให้บริการ</div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12 }}>กดเพื่อเติมค่าเซิร์ฟเวอร์ให้อัตโนมัติ หรือกรอกเองก็ได้</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button key={p.key} type="button" data-mail-preset={p.key} onClick={() => applyPreset(p)}
                style={{ height: 34, padding: '0 14px', borderRadius: 9999, border: '1px solid ' + (s.host === p.host ? 'var(--accent)' : 'var(--border)'), background: s.host === p.host ? 'var(--tint)' : 'var(--surface)', color: s.host === p.host ? 'var(--accent)' : 'var(--text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {p.label}
              </button>
            ))}
          </div>
          {hint && <div style={{ marginTop: 12, padding: '10px 13px', borderRadius: 10, background: '#FBF3E1', color: '#9A741C', fontSize: '12.5px', lineHeight: 1.65 }}>{hint}</div>}
        </div>

        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={label} htmlFor="ms-host">เซิร์ฟเวอร์ (SMTP host)</label><input id="ms-host" value={s.host} onChange={(e) => set('host', e.target.value)} placeholder="smtp.resend.com" style={input} /></div>
            <div><label style={label} htmlFor="ms-port">พอร์ต</label><input id="ms-port" inputMode="numeric" value={String(s.port)} onChange={(e) => set('port', Number(e.target.value.replace(/[^\d]/g, '')) || 0)} placeholder="587" style={input} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={label} htmlFor="ms-user">ชื่อผู้ใช้</label><input id="ms-user" value={s.username} onChange={(e) => set('username', e.target.value)} autoComplete="off" style={input} /></div>
            <div>
              <label style={label} htmlFor="ms-pass">รหัสผ่าน / API key</label>
              <input id="ms-pass" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password"
                placeholder={s.hasPassword ? '•••••••• (ตั้งไว้แล้ว)' : 'ยังไม่ได้ตั้ง'} style={input} />
              <div style={{ marginTop: 5, fontSize: 11.5, color: 'var(--muted2)' }}>
                {s.hasPassword ? 'เว้นว่างไว้ = ใช้รหัสเดิมต่อ' : 'ระบบไม่เคยส่งรหัสนี้กลับออกมาแสดงอีก'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={label} htmlFor="ms-from">อีเมลผู้ส่ง</label><input id="ms-from" value={s.fromEmail} onChange={(e) => set('fromEmail', e.target.value)} placeholder="noreply@jkppropertyagency.com" style={input} /></div>
            <div><label style={label} htmlFor="ms-fromname">ชื่อผู้ส่ง</label><input id="ms-fromname" value={s.fromName} onChange={(e) => set('fromName', e.target.value)} placeholder="JKP Property" style={input} /></div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '13.5px', color: 'var(--text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={s.secure} onChange={(e) => set('secure', e.target.checked)} style={{ width: 16, height: 16 }} />
            เข้ารหัสตั้งแต่เชื่อมต่อ (SSL/TLS — ใช้กับพอร์ต 465)
          </label>

          <button type="button" data-mail-save onClick={() => void save()} disabled={busy === 'save'}
            style={{ marginTop: 18, height: 42, padding: '0 22px', borderRadius: 9999, border: 0, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy === 'save' ? 0.7 : 1 }}>
            {busy === 'save' ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>ส่งอีเมลทดสอบ</div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.7 }}>
            บันทึกแล้วไม่ได้แปลว่าส่งได้ — ปลายทางอาจปฏิเสธรหัสผ่าน ปิดพอร์ต หรือไม่ยอมให้ส่งจากอีเมลผู้ส่งที่ยังไม่ได้ยืนยันโดเมน
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="ส่งไปที่อีเมลไหน (เว้นว่าง = อีเมลของคุณ)" style={{ ...input, flex: 1, minWidth: 240 }} />
            <button type="button" data-mail-test onClick={() => void test()} disabled={!ready || busy === 'test'}
              style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: ready ? 'var(--text)' : 'var(--muted3)', fontSize: 13.5, fontWeight: 700, cursor: ready && !busy ? 'pointer' : 'default', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {busy === 'test' ? 'กำลังส่ง…' : 'ส่งอีเมลทดสอบ'}
            </button>
          </div>

          {s.lastTestAt && (
            <div data-mail-laststatus style={{ marginTop: 14, padding: '11px 14px', borderRadius: 10, background: s.lastTestOk ? '#E8F3EC' : '#F9E4E1', color: s.lastTestOk ? '#0D6C3B' : '#C0392B', fontSize: '12.5px', lineHeight: 1.65 }}>
              {s.lastTestOk
                ? `ทดสอบล่าสุดสำเร็จ · ${new Date(s.lastTestAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}`
                : `ทดสอบล่าสุดไม่สำเร็จ · ${s.lastTestError || 'ไม่ทราบสาเหตุ'}`}
            </div>
          )}
        </div>

        {msg && (
          <div data-mail-msg style={{ padding: '12px 15px', borderRadius: 12, background: msg.ok ? '#E8F3EC' : '#F9E4E1', color: msg.ok ? '#0D6C3B' : '#C0392B', fontSize: '13.5px', lineHeight: 1.7 }}>{msg.text}</div>
        )}
      </div>
    </AdminShell>
  );
}
