'use client';

/* The topbar "อัปโหลด" button.
 *
 * It was a styled div with no handler, so the most prominent control on the
 * Media page did nothing — the only working way in was the dropzone further
 * down. The file input itself lives in MediaBody, which owns the upload
 * state, so this reaches it by id rather than duplicating that logic or
 * lifting it into a context for one button. */
export function UploadButton() {
  const pick = () => document.querySelector<HTMLInputElement>('#media-file-input')?.click();
  return (
    <button
      type="button"
      onClick={pick}
      className="admin-primary-btn"
      style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', border: 0, whiteSpace: 'nowrap' }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>อัปโหลด
    </button>
  );
}
