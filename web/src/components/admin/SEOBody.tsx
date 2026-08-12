'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { apiGet, apiPut, apiDelete, apiFetch, ApiClientError } from '@/lib/apiClient';

/* Ported from AdminSEO.dc.html — SEO · GEO · AEO Booster add-on page.
   Interactive: subscribe/unsubscribe toggle + llms.txt / robots.txt
   uploads. The topbar status pill is derived from the same state as
   the body, so this client component owns the state and renders the
   AdminShell chrome (passing the pill via `actions`). */

type UpKey = 'llms' | 'robots';

const fi = (p: string, c: string) => ({
  __html: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="1.8">' + p + '</svg>',
});

const upDef: { key: UpKey; name: string; desc: string; file: string; meta: string; iconBg: string; icon: { __html: string } }[] = [
  { key: 'llms', name: 'llms.txt', desc: 'ไฟล์แนะนำโครงเว็บ+เนื้อหาให้ AI model อ่าน', file: 'llms.txt', meta: '4.4 KB · อัปโหลดเมื่อสักครู่', iconBg: '#EEF4F3', icon: fi('<path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>', '#034956') },
  { key: 'robots', name: 'robots.txt', desc: 'เปิดทางให้ AI bot + search engine เข้าเว็บ', file: 'robots.txt', meta: '0.4 KB · อัปโหลดเมื่อสักครู่', iconBg: '#E8F3EC', icon: fi('<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6M12 17v6M4.2 4.2l4.3 4.3M15.5 15.5l4.3 4.3M1 12h6M17 12h6"></path>', '#0D6C3B') },
];

const seoCss = `
@media (max-width:760px){ #up-grid{grid-template-columns:1fr !important;} }
.up-remove:hover{background:#F9E4E1;color:#C0392B;}
.up-drop:hover{border-color:#0D6C3B;}
`;

type SeoFileMeta = { filename: string; sizeBytes: number; uploadedAt: number };

const fileMeta = (m: SeoFileMeta) => {
  const kb = (m.sizeBytes / 1024).toFixed(1);
  const mins = Math.floor((Date.now() - m.uploadedAt) / 60000);
  const when = mins < 1 ? 'เมื่อสักครู่' : mins < 60 ? `${mins} นาทีที่แล้ว` : mins < 1440 ? `${Math.floor(mins / 60)} ชม.ที่แล้ว` : `${Math.floor(mins / 1440)} วันก่อน`;
  return `${kb} KB · อัปโหลด${when}`;
};

export function SEOBody() {
  const [subscribed, setSubscribed] = React.useState(false);
  const [up, setUp] = React.useState({ llms: false, robots: false });
  const [meta, setMeta] = React.useState<Record<string, SeoFileMeta>>({});
  const [busy, setBusy] = React.useState('');
  const pickRef = React.useRef<HTMLInputElement | null>(null);
  const pickTarget = React.useRef<UpKey>('llms');

  const reload = React.useCallback(async () => {
    try {
      const r = await apiGet<{ subscribed: boolean; files: Record<string, SeoFileMeta> }>('/api/seo');
      setSubscribed(!!r.subscribed);
      setMeta(r.files || {});
      setUp({ llms: !!r.files?.llms, robots: !!r.files?.robots });
    } catch { /* not signed in / offline */ }
  }, []);
  React.useEffect(() => { void reload(); }, [reload]);

  const toggleSubscription = async () => {
    const next = !subscribed;
    setSubscribed(next); // optimistic
    try {
      await apiPut('/api/seo', { subscribed: next });
    } catch (e) {
      setSubscribed(!next);
      window.alert(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    }
  };

  const pickFile = (key: UpKey) => { pickTarget.current = key; pickRef.current?.click(); };

  const doUpload = async (file: File) => {
    const key = pickTarget.current;
    setBusy(key);
    try {
      const form = new FormData();
      form.append('file', file);
      await apiFetch(`/api/seo/files/${key}`, { method: 'POST', body: form });
      await reload();
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setBusy('');
    }
  };

  const doRemove = async (key: UpKey) => {
    setBusy(key);
    try {
      await apiDelete(`/api/seo/files/${key}`);
      await reload();
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusy('');
    }
  };

  const done = up.llms && up.robots;
  const some = up.llms || up.robots;
  const active = subscribed && done;
  const partial = some && !done;

  const statusText = !subscribed ? 'ยังไม่เปิดใช้บริการ' : active ? 'บริการทำงานอยู่' : 'รออัปโหลดไฟล์';
  const statusColor = !subscribed ? '#9A741C' : active ? '#0D6C3B' : '#9A741C';
  const statusDot = active ? '#0D6C3B' : '#D9A62B';
  const statusBg = active ? '#E8F3EC' : '#FBF3E1';

  const subBtnLabel = subscribed ? 'ยกเลิกบริการ' : 'เปิดใช้บริการ';
  const subBtnStyle: React.CSSProperties = {
    height: 40, padding: '0 20px', borderRadius: 9999, fontSize: 13, fontWeight: 800,
    display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
    ...(subscribed
      ? { background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.28)', color: '#fff' }
      : { background: '#2DFB91', color: '#022310' }),
  };

  const uploads = upDef.map((u) => {
    const d = up[u.key];
    return {
      ...u,
      done: d,
      pending: !d,
      // real size/timestamp once the file exists; the const's string is only a placeholder
      meta: meta[u.key] ? fileMeta(meta[u.key]) : busy === u.key ? 'กำลังอัปโหลด…' : u.meta,
      cardStyle: { background: 'var(--surface)', border: '1.5px solid ' + (d ? '#0D6C3B' : 'var(--border)'), borderRadius: 16, padding: 20 } as React.CSSProperties,
      upload: () => pickFile(u.key),
      remove: () => { void doRemove(u.key); },
    };
  });

  const statusPill = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 9999, background: statusBg }}>
      <span style={{ width: 8, height: 8, borderRadius: 9999, background: statusDot }} />
      <span style={{ fontSize: '12.5px', fontWeight: 700, color: statusColor }}>{statusText}</span>
    </div>
  );

  return (
    <AdminShell active="seo" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'SEO · GEO · AEO' }]} />} title="SEO · GEO · AEO" actions={statusPill} css={seoCss}>
      <div style={{ maxWidth: 880 }}>
        {/* one hidden picker shared by both dropzones (.txt only, 1MB — the
            server enforces the same limits) */}
        <input
          ref={pickRef}
          type="file"
          accept=".txt,text/plain"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void doUpload(f); e.target.value = ''; }}
        />
        {/* ADD-ON BANNER */}
        <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', borderRadius: 20, padding: '26px 28px', color: '#fff', marginBottom: 20 }}>
          <div style={{ position: 'absolute', top: -40, right: -20, width: 180, height: 180, borderRadius: 9999, background: 'rgba(45,251,145,.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 520 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 26, padding: '0 12px', borderRadius: 9999, background: 'rgba(45,251,145,.16)', border: '1px solid rgba(45,251,145,.35)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2.2"><path d="M13 2L3 14h7l-1 8 11-14h-7z" /></svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#2DFB91' }}>บริการเสริม (Add-on)</span>
              </div>
              <h2 style={{ margin: '12px 0 8px', fontSize: 22, fontWeight: 800 }}>SEO · GEO · AEO Booster</h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#C3FED5', lineHeight: 1.7 }}>ดันเว็บให้ติดอันดับ Google และให้ AI (ChatGPT, Perplexity, Google AI) ดึงไปตอบและอ้างอิง — เนื้อหา + schema + llms.txt เสิร์ฟและอัปเดตอัตโนมัติจากระบบของเรา</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={subBtnStyle} onClick={toggleSubscription}>{subBtnLabel}</div>
            </div>
          </div>
        </div>

        {!subscribed && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            </div>
            <div style={{ marginTop: 14, fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ยังไม่ได้เปิดใช้บริการ</div>
            <p style={{ margin: '6px auto 0', maxWidth: 400, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>กด &quot;เปิดใช้บริการ&quot; ด้านบนเพื่อสมัคร Add-on — จากนั้นอัปโหลด llms.txt และ robots.txt เพื่อเริ่มใช้งานทันที</p>
          </div>
        )}

        {subscribed && (
          <>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              อัปโหลด 2 ไฟล์นี้เพื่อเปิดใช้งานบริการ — เมื่ออัปโหลดครบ ระบบจะเริ่มทำงานทันที
            </div>
            <div id="up-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {uploads.map((u) => (
                <div key={u.key} style={u.cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: u.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={u.icon} />
                    {u.done && (
                      <span style={{ height: 24, padding: '0 11px', borderRadius: 9999, background: '#E8F3EC', color: '#0D6C3B', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>อัปโหลดแล้ว
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{u.name}</div>
                  <div style={{ marginTop: 3, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>{u.desc}</div>
                  {u.done && (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{u.file}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{u.meta}</div>
                      </div>
                      <div onClick={u.remove} className="up-remove" style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)', cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </div>
                    </div>
                  )}
                  {u.pending && (
                    <div
                      onClick={u.upload}
                      /* the box says "drag a file here" and had no drop
                         handler, so dropping one made the browser navigate
                         away from the admin and open the .txt instead */
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files?.[0];
                        if (!f) return;
                        pickTarget.current = u.key;
                        void doUpload(f);
                      }}
                      className="up-drop" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 22, border: '1.5px dashed var(--border)', borderRadius: 12, cursor: 'pointer', textAlign: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</div>
                      <div style={{ fontSize: 11, color: 'var(--muted3)' }}>รองรับ .txt · สูงสุด 1MB</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ACTIVATION STATE */}
            {done && (
              <div style={{ marginTop: 18, background: 'linear-gradient(135deg,#0B7A45,#043F20)', borderRadius: 16, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
                <div style={{ width: 46, height: 46, borderRadius: 9999, background: 'rgba(45,251,145,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15.5px', fontWeight: 800 }}>บริการทำงานแล้ว 🎉</div>
                  <div style={{ fontSize: '12.5px', color: '#C3FED5' }}>llms.txt + robots.txt อัปโหลดครบ — AI bot และ search engine เริ่มดึงเนื้อหาของคุณได้ทันที · ระบบอัปเดตให้อัตโนมัติทุกครั้งที่แก้คอนเทนต์</div>
                </div>
              </div>
            )}
            {partial && (
              <div style={{ marginTop: 18, background: '#FBF3E1', border: '1px solid #EAD9A8', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A741C" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                <span style={{ fontSize: '12.5px', color: '#9A741C', fontWeight: 600 }}>อัปโหลดอีก 1 ไฟล์เพื่อเปิดใช้งานบริการให้สมบูรณ์</span>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
