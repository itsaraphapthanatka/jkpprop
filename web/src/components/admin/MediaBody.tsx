'use client';

import * as React from 'react';
import { apiGet, apiDelete, apiFetch, ApiClientError } from '@/lib/apiClient';

/* Ported from AdminMedia.dc.html <main> — Media Manager with folder
   sidebar, storage meter, search + tag filters, upload dropzone, and a
   selectable image grid. Interactive: folder selection, tag filtering,
   and per-image multi-select all drive the rendered grid/state. */

type MediaItem = {
  id: string;
  cat: string;
  name: string;
  meta: string;
  src: string;
  inUse: boolean;
  credit: string;
  creditHref: string;
};

const FOLDER_DEFS: { name: string; count: string }[] = [
  { name: 'ทั้งหมด', count: '1,284' },
  { name: 'Hero / Banner', count: '24' },
  { name: 'ทรัพย์', count: '1,180' },
  { name: 'บทความ', count: '62' },
  { name: 'ทีมงาน', count: '18' },
];

const TAG_DEFS: string[] = ['ทั้งหมด', 'Hero', 'ทรัพย์', 'ทีมงาน'];

const MD: MediaItem[] = [
  { id: 'm1', cat: 'hero', name: 'hero-warehouse-night.jpg', meta: '1920×1080 · 480KB', src: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=70', inUse: true, credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels' },
  { id: 'm2', cat: 'property', name: 'factory-interior.jpg', meta: '1600×900 · 380KB', src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=70', inUse: true, credit: 'Photo by ThisisEngineering on Unsplash', creditHref: 'https://unsplash.com/@thisisengineering' },
  { id: 'm3', cat: 'property', name: 'aerial-logistics.jpg', meta: '2000×1200 · 620KB', src: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400&q=70', inUse: false, credit: 'Photo by Guillaume Bolduc on Unsplash', creditHref: 'https://unsplash.com/@guibolduc' },
  { id: 'm4', cat: 'team', name: 'team-handshake.jpg', meta: '1400×933 · 340KB', src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=70', inUse: true, credit: 'Photo by Sebastian Herrmann on Unsplash', creditHref: 'https://unsplash.com/@herrherrmann' },
  { id: 'm5', cat: 'property', name: 'warehouse-racks.jpg', meta: '1600×1067 · 410KB', src: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&q=70', inUse: false, credit: 'Photo by Ruchindra Gunasekara on Unsplash', creditHref: 'https://unsplash.com/@ruchindra' },
  { id: 'm6', cat: 'hero', name: 'city-skyline.jpg', meta: '1920×1280 · 540KB', src: 'https://images.unsplash.com/photo-1536599424071-0b215a388ba7?w=400&q=70', inUse: false, credit: 'Photo by Manson Yim on Unsplash', creditHref: 'https://unsplash.com/@mansonyim' },
  { id: 'm7', cat: 'team', name: 'founder-portrait.jpg', meta: '1200×1200 · 290KB', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=70', inUse: true, credit: 'Photo by LinkedIn Sales Solutions on Unsplash', creditHref: 'https://unsplash.com/@linkedinsalesnavigator' },
  { id: 'm8', cat: 'property', name: 'cold-storage.jpg', meta: '1600×900 · 360KB', src: 'https://images.unsplash.com/photo-1601599963565-b7ba29c8e4e0?w=400&q=70', inUse: false, credit: 'Photo by CHUTTERSNAP on Unsplash', creditHref: 'https://unsplash.com/@chuttersnap' },
];

const folderCat = ['all', 'hero', 'property', 'article', 'team'];
const tagCat = ['all', 'hero', 'property', 'team'];

type ApiMedia = { id: string; name: string; mime: string; size: number; src: string; createdAt: number };

const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

export function MediaBody() {
  const [folder, setFolder] = React.useState(0);
  const [tag, setTag] = React.useState(0);
  const [sel, setSel] = React.useState<Record<string, boolean>>({});

  // real uploads from the API — shown ahead of the porting-era demo grid
  const [uploads, setUploads] = React.useState<ApiMedia[]>([]);
  const [totalBytes, setTotalBytes] = React.useState(0);
  const [busy, setBusy] = React.useState('');
  const [error, setError] = React.useState('');
  // FR-ADM-09: the style is chosen at upload time and baked into the file
  // that gets served publicly
  const [watermark, setWatermark] = React.useState<'none' | 'corner' | 'tiled'>('corner');
  const fileInput = React.useRef<HTMLInputElement | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const r = await apiGet<{ items: ApiMedia[]; totalBytes: number }>('/api/media');
      setUploads(Array.isArray(r.items) ? r.items : []);
      setTotalBytes(r.totalBytes || 0);
    } catch { /* keep current state (§2.2) */ }
  }, []);
  React.useEffect(() => { void reload(); }, [reload]);

  const uploadFiles = async (files: FileList | File[]) => {
    setError('');
    for (const f of Array.from(files)) {
      setBusy(`กำลังอัปโหลด ${f.name}…`);
      try {
        const form = new FormData();
        form.append('file', f);
        form.append('watermarkType', watermark);
        await apiFetch('/api/media', { method: 'POST', body: form });
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : `อัปโหลด ${f.name} ไม่สำเร็จ`);
      }
    }
    setBusy('');
    await reload();
  };

  const removeSelected = async () => {
    const ids = uploads.filter((u) => sel[u.id]).map((u) => u.id);
    if (!ids.length || busy) return;
    setBusy('กำลังลบ…');
    setError('');
    for (const id of ids) {
      try { await apiDelete(`/api/media/${id}`); } catch (e) {
        setError(e instanceof ApiClientError ? e.message : 'ลบไฟล์ไม่สำเร็จ');
        break;
      }
    }
    setSel({});
    setBusy('');
    await reload();
  };

  const selCount = uploads.filter((u) => sel[u.id]).length;
  const fCat = folderCat[folder] || 'all';
  const tCat = tagCat[tag] || 'all';
  const media = MD.filter((m) => (fCat === 'all' || m.cat === fCat) && (tCat === 'all' || m.cat === tCat));

  return (
    <div id="media-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
      {/* FOLDERS */}
      <div id="media-folders" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em', padding: '6px 10px' }}>โฟลเดอร์</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {FOLDER_DEFS.map((f, i) => {
              const on = i === folder;
              const style: React.CSSProperties = {
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10,
                fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer',
                color: on ? '#0D6C3B' : 'var(--muted)',
                background: on ? 'rgba(13,108,59,.06)' : 'transparent',
              };
              return (
                <div key={f.name} onClick={() => setFolder(i)} style={style}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                  <span style={{ flex: 1 }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted3)' }}>{f.count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>พื้นที่ใช้งาน</div>
          <div style={{ marginTop: 8, height: 8, borderRadius: 9999, background: 'var(--bg)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '42%', background: '#0D6C3B', borderRadius: 9999 }} />
          </div>
          <div style={{ marginTop: 8, fontSize: '11.5px', color: 'var(--muted2)' }}>{(totalBytes / 1073741824).toFixed(2)} GB / 10 GB · {uploads.length + MD.length} ไฟล์</div>
        </div>
      </div>

      {/* GRID */}
      <div>
        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input placeholder="ค้นหารูป / แท็ก" style={{ border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
          </div>
          {TAG_DEFS.map((label, i) => {
            const on = tag === i;
            const style: React.CSSProperties = {
              height: 40, padding: '0 15px', borderRadius: 10, fontSize: '12.5px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              background: on ? '#273c33' : 'var(--surface)',
              color: on ? '#fff' : 'var(--muted)',
              border: '1px solid ' + (on ? '#273c33' : 'var(--border)'),
            };
            return (
              <div key={label} onClick={() => setTag(i)} style={style}>{label}</div>
            );
          })}
        </div>

        {/* watermark style — applied before the file is served publicly */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)' }}>ลายน้ำตอนอัปโหลด</span>
          {([['corner', 'มุมภาพ'], ['tiled', 'ทั้งภาพ'], ['none', 'ไม่ใส่']] as const).map(([key, label]) => {
            const on = watermark === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setWatermark(key)}
                style={{ height: 32, padding: '0 13px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}
              >{label}</button>
            );
          })}
          <span style={{ fontSize: 11, color: 'var(--muted3)' }}>ไฟล์ต้นฉบับถูกเก็บไว้ให้ทีมงานเสมอ · หน้าเว็บเห็นเฉพาะไฟล์ที่ใส่ลายน้ำแล้ว</span>
        </div>

        {/* upload dropzone — click to pick, or drop files */}
        <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ''; }} />
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files); }}
          style={{ border: '1.5px dashed var(--border)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18, background: 'var(--surface)', cursor: 'pointer' }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{busy || 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก'}</div>
            <div style={{ fontSize: 12, color: error ? '#C0392B' : 'var(--muted3)' }}>{error || 'JPG, PNG, WebP · สูงสุด 10MB ต่อไฟล์'}</div>
          </div>
        </div>

        {/* selection toolbar for real uploads */}
        {selCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>เลือกแล้ว {selCount} ไฟล์</span>
            <div onClick={removeSelected} style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: '#C0392B', color: '#fff', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
              ลบที่เลือก
            </div>
          </div>
        )}

        {/* image grid — real uploads first, then the demo set */}
        <div id="media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {uploads.map((m) => {
            const on = !!sel[m.id];
            const cardStyle: React.CSSProperties = {
              borderRadius: 14, overflow: 'hidden',
              border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
              background: 'var(--surface)', cursor: 'pointer',
              transition: 'transform .2s,box-shadow .2s',
              boxShadow: on ? '0 8px 20px rgba(13,108,59,.15)' : undefined,
            };
            return (
              <div key={m.id} onClick={() => setSel((prev) => ({ ...prev, [m.id]: !prev[m.id] }))} style={cardStyle}>
                <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--tint)' }}>
                  {m.mime === 'application/pdf' ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)' }}>
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.src} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                  {on && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 9999, background: '#0D6C3B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                  )}
                </div>
                <div style={{ padding: '9px 11px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted3)' }}>{fmtSize(m.size)}</div>
                </div>
              </div>
            );
          })}
          {media.map((m) => {
            const on = !!sel[m.id];
            const cardStyle: React.CSSProperties = {
              borderRadius: 14, overflow: 'hidden',
              border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
              background: 'var(--surface)', cursor: 'pointer',
              transition: 'transform .2s,box-shadow .2s',
              boxShadow: on ? '0 8px 20px rgba(13,108,59,.15)' : undefined,
            };
            return (
              <div key={m.id} onClick={() => setSel((prev) => ({ ...prev, [m.id]: !prev[m.id] }))} style={cardStyle}>
                <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--tint)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.src} alt="รูป" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {on && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 9999, background: '#0D6C3B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                  )}
                  {m.inUse && (
                    <span style={{ position: 'absolute', bottom: 8, left: 8, height: 20, padding: '0 8px', borderRadius: 9999, background: 'rgba(2,29,14,.78)', color: '#2DFB91', fontSize: '9.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>ใช้งานอยู่
                    </span>
                  )}
                </div>
                <div style={{ padding: '9px 11px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted3)' }}>{m.meta}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
