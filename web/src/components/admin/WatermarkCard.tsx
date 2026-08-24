'use client';

import * as React from 'react';
import { apiGet, apiPut, ApiClientError } from '@/lib/apiClient';
import {
  WM_DEFAULTS, WM_LIMITS,
  normalizeWatermark, wmFingerprint, wmPlacement, wmPositionLabel,
  type WatermarkConfig,
} from '@/lib/watermarkConfig';

/* Watermark editor (FR-ADM-09b) — upload the agency logo once, choose where
   it sits, and every property photo the public sees carries it: the cover on
   /listing and every shot in the property gallery.

   The preview positions the same logo with wmPlacement(), the maths the
   server composites with, so what you see here is what gets stamped. */

const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 7 };
const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 };
const btn = (on: boolean): React.CSSProperties => ({
  height: 34, padding: '0 13px', borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
  background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)',
});

/* a neutral stand-in so the preview works before any property has photos */
const SAMPLE = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&q=70';
/* แผ่นเลื่อนสองแกน — ลากจุดไปวางตรงไหนก็ได้ในกรอบ พร้อมเส้นไขว้บอกแนว
   ลูกค้าส่งภาพตัวอย่างมาว่าอยากได้แบบนี้ แทนแถบเลื่อนสองอันแยกกัน
   กดลูกศรบนคีย์บอร์ดขยับทีละ 1% (Shift = 10%) เพื่อจัดให้ตรงเป๊ะได้ */
function XYPad({ x, y, onChange }: { x: number; y: number; onChange: (x: number, y: number) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [grab, setGrab] = React.useState(false);

  const put = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = (v: number, span: number) => Math.round(Math.min(100, Math.max(0, (v / span) * 100)));
    onChange(pct(clientX - r.left, r.width), pct(clientY - r.top, r.height));
  };

  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    onChange(Math.min(100, Math.max(0, x + m[0])), Math.min(100, Math.max(0, y + m[1])));
  };

  return (
    <div
      ref={ref}
      id="wm-pad"
      role="application"
      aria-label={`ตำแหน่งลายน้ำ แนวนอน ${x}% แนวตั้ง ${y}% — ใช้ปุ่มลูกศรเพื่อขยับ`}
      tabIndex={0}
      onKeyDown={nudge}
      onPointerDown={(e) => { e.preventDefault(); (e.target as Element).setPointerCapture?.(e.pointerId); setGrab(true); put(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (grab) put(e.clientX, e.clientY); }}
      onPointerUp={() => setGrab(false)}
      onPointerCancel={() => setGrab(false)}
      style={{
        position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 12,
        border: '1.5px solid var(--border)', background: 'var(--bg)',
        cursor: grab ? 'grabbing' : 'crosshair', touchAction: 'none', overflow: 'hidden',
      }}
    >
      {/* เส้นไขว้ลากผ่านจุด — บอกแนวว่าตรงกับขอบไหน */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: `${y}%`, height: 1, background: 'var(--border)' }} />
      <div aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: 1, background: 'var(--border)' }} />
      <div
        aria-hidden data-wm-handle
        style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
          width: 20, height: 20, borderRadius: 9999, background: '#0D6C3B',
          border: '3px solid var(--surface)', boxShadow: '0 1px 6px rgba(var(--ink-rgb),.28)',
        }}
      />
    </div>
  );
}

function Slider({ name, value, min, max, unit, onChange }: { name: string; value: number; min: number; max: number; unit: string; onChange: (n: number) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <label style={{ ...label, marginBottom: 0 }}>{name}</label>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: "'JetBrains Mono',monospace" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#0D6C3B' }} aria-label={name} />
    </div>
  );
}

export function WatermarkCard() {
  const [cfg, setCfg] = React.useState<WatermarkConfig>(WM_DEFAULTS);
  const [loaded, setLoaded] = React.useState<string>(wmFingerprint(WM_DEFAULTS));
  const [busy, setBusy] = React.useState<'' | 'upload' | 'save'>('');
  /* ไฟล์โลโก้ถูกลบออกจากคลังสื่อได้ ทั้งที่ตั้งค่ายังชี้มาที่มัน — พอเป็นแบบนั้น
     ทุกอย่างบนการ์ดนี้ยังบอกว่า "เปิดใช้งาน" แต่ไม่มีรูปไหนถูกปั๊มอีกเลย และ
     ช่องพรีวิวก็แค่ว่างเปล่า ไม่ได้บอกว่าเพราะอะไร (เกิดขึ้นจริงเมื่อ 22 ส.ค.)
     ตอนนี้ถ้ารูปโหลดไม่ขึ้น จะขึ้นคำเตือนให้เลือกไฟล์ใหม่ */
  const [logoGone, setLogoGone] = React.useState(false);
  React.useEffect(() => { setLogoGone(false); }, [cfg.src]);
  const [saved, setSaved] = React.useState(false);
  const [err, setErr] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [logoRatio, setLogoRatio] = React.useState(2); // w/h, refined once the image loads

  const set = (patch: Partial<WatermarkConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const dirty = wmFingerprint(cfg) !== loaded;

  React.useEffect(() => {
    apiGet<{ watermark?: unknown }>('/api/branding')
      .then((b) => { const w = normalizeWatermark(b.watermark); setCfg(w); setLoaded(wmFingerprint(w)); })
      .catch(() => { /* keep defaults (§2.2) */ });
  }, []);

  // the preview needs its own pixel size to place the mark with the server's maths
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pickLogo = async (file: File) => {
    setErr('');
    setBusy('upload');
    try {
      const fd = new FormData();
      fd.append('file', file);
      // the logo itself must never be stamped
      fd.append('watermarkType', 'none');
      const res = await fetch('/api/media', { method: 'POST', body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? 'อัปโหลดไม่สำเร็จ');
      set({ src: json.data?.src ?? json.src, enabled: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ');
    } finally {
      setBusy('');
    }
  };

  const save = async () => {
    setErr('');
    setBusy('save');
    try {
      await apiPut('/api/branding', { watermark: cfg });
      setLoaded(wmFingerprint(cfg));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : 'บันทึกลายน้ำไม่สำเร็จ');
    } finally {
      setBusy('');
    }
  };

  /* preview geometry — same placement function the compositor uses */
  const markW = Math.round((cfg.scale / 100) * box.w);
  const markH = Math.round(markW / (logoRatio || 2));
  const pos = box.w && cfg.src ? wmPlacement(box.w, box.h, markW, markH, cfg) : { left: 0, top: 0 };

  /* ลากโลโก้บนภาพตัวอย่างได้ตรง ๆ — คำนวณกลับจากพิกัดเป็น x/y เปอร์เซ็นต์
     ด้วยสมการเดียวกับ wmPlacement เพื่อให้ตัวอย่างกับรูปจริงตรงกันเสมอ */
  const dragTo = (clientX: number, clientY: number) => {
    const el = boxRef.current;
    if (!el || cfg.anchor === 'tiled') return;
    const r = el.getBoundingClientRect();
    const m = Math.round((cfg.margin / 100) * r.width);
    const spanX = Math.max(1, r.width - markW - m * 2);
    const spanY = Math.max(1, r.height - markH - m * 2);
    const pct = (v: number, span: number) => Math.round(Math.min(100, Math.max(0, (v / span) * 100)));
    set({
      x: pct(clientX - r.left - m - markW / 2, spanX),
      y: pct(clientY - r.top - m - markH / 2, spanY),
    });
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>ลายน้ำบนภาพทรัพย์</div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted2)', marginTop: 2, maxWidth: '52ch', lineHeight: 1.5 }}>
            อัปโหลดโลโก้ครั้งเดียว ใช้กับ<b>ภาพปกในหน้ารายการประกาศ</b> และ<b>ทุกภาพในหน้ารายละเอียดทรัพย์</b> · ไฟล์ต้นฉบับยังเก็บไว้ไม่ถูกแก้
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={cfg.enabled}
          aria-label="เปิดใช้ลายน้ำ"
          disabled={!cfg.src}
          onClick={() => set({ enabled: !cfg.enabled })}
          title={cfg.src ? undefined : 'อัปโหลดโลโก้ก่อนจึงเปิดใช้ได้'}
          style={{ width: 44, height: 25, borderRadius: 9999, border: 0, padding: 0, flexShrink: 0, cursor: cfg.src ? 'pointer' : 'not-allowed', opacity: cfg.src ? 1 : 0.45, background: cfg.enabled ? '#0D6C3B' : 'var(--border)', position: 'relative', transition: 'background .2s' }}
        >
          <span style={{ position: 'absolute', top: 3, left: cfg.enabled ? 22 : 3, width: 19, height: 19, borderRadius: 9999, background: '#fff', transition: 'left .2s' }} />
        </button>
      </div>

      <div id="wm-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 16 }}>
        {/* ---- controls ---- */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>ไฟล์ลายน้ำ</label>
            <input ref={fileRef} id="wm-file" type="file" accept="image/png,image/webp" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickLogo(f); e.target.value = ''; }} />
            {/* จอแคบ ๆ (หรือหน้าต่างครึ่งจอ) เคยบีบคอลัมน์ข้อความจนตัวหนังสือ
                เรียงลงมาทีละคำและปุ่ม "เปลี่ยนไฟล์" ทับข้อความ — ให้ห่อบรรทัดแทน */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', rowGap: 8, padding: 12, borderRadius: 12, border: '1.5px dashed var(--border)', background: 'var(--bg)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {cfg.src && !logoGone
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={cfg.src} alt="ลายน้ำ" onError={() => setLogoGone(true)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : logoGone
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><path d="M12 9v5M12 17.5v.5" /><path d="M10.3 3.9L1.9 18a2 2 0 001.7 3h16.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>}
              </div>
              <div style={{ flex: '1 1 150px', minWidth: 120, fontSize: 11, color: logoGone ? '#C0392B' : 'var(--muted3)', lineHeight: 1.5 }}>
                {logoGone
                  ? <span data-wm-missing><b>ไฟล์โลโก้หายไปแล้ว</b> — ถูกลบออกจากคลังสื่อ ตอนนี้ไม่มีรูปไหนถูกปั๊มลายน้ำเลย กด “เปลี่ยนไฟล์” เพื่อเลือกใหม่ แล้วกดบันทึกลายน้ำ</span>
                  : <>แนะนำ <b>PNG พื้นหลังโปร่ง</b> กว้างอย่างน้อย 600px · สูงสุด 10MB<br />ระบบย่อให้เป็นสัดส่วนของความกว้างรูป (ตามค่า “ขนาด” ด้านล่าง) ไฟล์เล็กเกินจะแตกบนรูปใหญ่</>}
              </div>
              <button type="button" id="wm-upload" onClick={() => fileRef.current?.click()} disabled={busy === 'upload'} style={{ ...btn(false), flexShrink: 0, opacity: busy === 'upload' ? 0.6 : 1 }}>
                {busy === 'upload' ? 'กำลังอัปโหลด…' : cfg.src ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
              </button>
            </div>
          </div>

          <div>
            <label style={label}>ตำแหน่ง — {wmPositionLabel(cfg)}</label>
            {/* เดิมเป็นตาราง 9 ช่อง เลือกได้แค่มุมกับกึ่งกลาง ลูกค้าขอ "ปรับให้เป็น
                แบบเลื่อน" — วางตรงไหนก็ได้ ทั้งลากบนภาพตัวอย่างและเลื่อนแถบ */}
            {cfg.anchor !== 'tiled' && (
              <XYPad x={cfg.x} y={cfg.y} onChange={(x, y) => set({ x, y })} />
            )}
            <div style={{ marginTop: 12 }}>
              <button type="button" id="wm-tiled" onClick={() => set({ anchor: cfg.anchor === 'tiled' ? 'free' : 'tiled' })} aria-pressed={cfg.anchor === 'tiled'} style={btn(cfg.anchor === 'tiled')}>
                เรียงทั้งภาพ
              </button>
            </div>
          </div>

          <Slider name="ขนาด (เทียบความกว้างภาพ)" value={cfg.scale} min={WM_LIMITS.scale.min} max={WM_LIMITS.scale.max} unit="%" onChange={(scale) => set({ scale })} />
          <Slider name="ความทึบ" value={cfg.opacity} min={WM_LIMITS.opacity.min} max={WM_LIMITS.opacity.max} unit="%" onChange={(opacity) => set({ opacity })} />
          {cfg.anchor !== 'tiled' && (
            <Slider name="ระยะห่างจากขอบ" value={cfg.margin} min={WM_LIMITS.margin.min} max={WM_LIMITS.margin.max} unit="%" onChange={(margin) => set({ margin })} />
          )}
        </div>

        {/* ---- live preview ---- */}
        <div style={{ minWidth: 0 }}>
          <label style={label}>ตัวอย่าง</label>
          <div ref={boxRef} id="wm-preview" style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', background: 'var(--tint)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SAMPLE} alt="ตัวอย่างภาพทรัพย์" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {cfg.enabled && cfg.src && cfg.anchor === 'tiled' && (
              <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: cfg.opacity / 100, backgroundImage: `url(${cfg.src})`, backgroundRepeat: 'repeat', backgroundSize: `${markW}px auto` }} />
            )}
            {cfg.enabled && cfg.src && cfg.anchor !== 'tiled' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cfg.src} alt="" data-wm-mark
                onLoad={(e) => { const el = e.currentTarget; if (el.naturalHeight) setLogoRatio(el.naturalWidth / el.naturalHeight); }}
                onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dragTo(e.clientX, e.clientY); }}
                onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) dragTo(e.clientX, e.clientY); }}
                onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
                title="ลากเพื่อย้ายตำแหน่ง"
                style={{ position: 'absolute', left: pos.left, top: pos.top, width: markW, opacity: cfg.opacity / 100, cursor: 'grab', touchAction: 'none' }} />
            )}
            {!cfg.src && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,14,8,.45)', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: 16 }}>
                ยังไม่มีไฟล์ลายน้ำ — เลือกไฟล์เพื่อดูตัวอย่าง
              </div>
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted3)', lineHeight: 1.5 }}>
            ลากโลโก้บนภาพนี้เพื่อย้ายตำแหน่ง หรือใช้แถบเลื่อนก็ได้ · เปลี่ยนตำแหน่งแล้วกดบันทึก ระบบจะสร้างภาพใหม่ให้ทรัพย์ที่มีอยู่แล้วทั้งหมดโดยอัตโนมัติ
          </div>
        </div>
      </div>

      {err && <div style={{ marginTop: 12, fontSize: 12, color: '#C0392B', background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.25)', borderRadius: 10, padding: '9px 12px' }}>{err}</div>}

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" id="wm-save" onClick={save} disabled={busy === 'save' || !dirty}
          style={{ height: 40, padding: '0 20px', borderRadius: 9999, border: 0, background: dirty ? '#0D6C3B' : 'var(--border)', color: dirty ? '#fff' : 'var(--muted3)', fontSize: 13, fontWeight: 700, cursor: dirty && busy !== 'save' ? 'pointer' : 'default', fontFamily: 'inherit' }}>
          {busy === 'save' ? 'กำลังบันทึก…' : saved ? 'บันทึกแล้ว' : 'บันทึกลายน้ำ'}
        </button>
        {cfg.src && (
          <button type="button" onClick={() => set({ src: null, enabled: false })} style={{ ...btn(false), color: '#C0392B' }}>ลบลายน้ำ</button>
        )}
      </div>
    </div>
  );
}
