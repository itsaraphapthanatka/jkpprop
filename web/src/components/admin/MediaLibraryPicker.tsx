'use client';

/* Pick files that are already in คลังสื่อ.
 *
 * The media fields on the property form said "ลากไฟล์มาวาง หรือเลือกจากคลัง"
 * and offered only an upload button — so a photo already in the library had to
 * be uploaded a second time to be attached to a property, and it arrived as a
 * separate copy with its own watermark run.
 */
import * as React from 'react';
import { apiGet, ApiClientError } from '@/lib/apiClient';

export type MediaItem = { id: string; name: string; mime: string; src: string; createdAt: number };

const isImage = (m: MediaItem) => m.mime.startsWith('image/');

export function MediaLibraryPicker({ attached, onAttach, onClose }: {
  /** already on the field — shown ticked, and picking them again is a no-op */
  attached: string[];
  onAttach: (srcs: string[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = React.useState<MediaItem[] | null>(null);
  const [err, setErr] = React.useState('');
  const [picked, setPicked] = React.useState<string[]>([]);
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    apiGet<{ items: MediaItem[] }>('/api/media')
      .then((r) => setItems(Array.isArray(r.items) ? r.items : []))
      .catch((e) => { setItems([]); setErr(e instanceof ApiClientError ? e.message : 'โหลดคลังสื่อไม่สำเร็จ'); });
  }, []);

  const shown = (items ?? []).filter((m) => !q.trim() || m.name.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (src: string) => setPicked((p) => (p.includes(src) ? p.filter((s) => s !== src) : [...p, src]));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div id="media-picker" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 18, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>เลือกจากคลังสื่อ</div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>ไฟล์ที่อัปโหลดไว้แล้ว — เลือกได้หลายไฟล์</div>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9999, background: 'var(--tint)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </div>
        </div>

        <div style={{ padding: '12px 22px 0' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อไฟล์" style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12.5px', fontFamily: 'inherit', outline: 'none' }} />
        </div>

        <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
          {items === null && <div style={{ fontSize: 12.5, color: 'var(--muted2)' }}>กำลังโหลด…</div>}
          {items !== null && shown.length === 0 && (
            <div style={{ fontSize: '12.5px', color: 'var(--muted2)', lineHeight: 1.8, padding: '18px 0', textAlign: 'center' }}>
              {err ? <span style={{ color: '#C0392B' }}>{err}</span>
                : items.length === 0
                  ? <>ยังไม่มีไฟล์ในคลังสื่อ — <a href="/admin/media" target="_blank" rel="noreferrer" style={{ color: '#0D6C3B', fontWeight: 700 }}>เปิดหน้าคลังสื่อเพื่ออัปโหลด →</a><br />หรือกดปุ่ม &ldquo;อัปโหลด&rdquo; เพื่อเลือกไฟล์จากเครื่องได้เลย</>
                  : 'ไม่พบไฟล์ที่ตรงกับคำค้น'}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
            {shown.map((m) => {
              const on = picked.includes(m.src);
              const already = attached.includes(m.src);
              return (
                <div
                  key={m.id}
                  data-media={m.src}
                  onClick={() => !already && toggle(m.src)}
                  title={already ? 'แนบอยู่แล้ว' : m.name}
                  style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid ' + (on ? '#0D6C3B' : 'var(--border)'), cursor: already ? 'default' : 'pointer', opacity: already ? 0.45 : 1, background: 'var(--bg)', position: 'relative' }}
                >
                  {isImage(m) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.src} alt={m.name} style={{ width: '100%', height: 84, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                    </div>
                  )}
                  <div style={{ padding: '6px 8px', fontSize: 10.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{already ? `${m.name} · แนบแล้ว` : m.name}</div>
                  {on && (
                    <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          <span style={{ marginRight: 'auto', fontSize: '11.5px', color: 'var(--muted2)' }}>เลือกไว้ {picked.length} ไฟล์</span>
          <button type="button" onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ยกเลิก</button>
          <button
            type="button"
            id="media-picker-attach"
            disabled={!picked.length}
            onClick={() => { onAttach(picked); onClose(); }}
            style={{ height: 38, padding: '0 18px', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: picked.length ? 'pointer' : 'default', opacity: picked.length ? 1 : 0.5, fontFamily: 'inherit' }}
          >แนบ {picked.length || ''} ไฟล์</button>
        </div>
      </div>
    </div>
  );
}
