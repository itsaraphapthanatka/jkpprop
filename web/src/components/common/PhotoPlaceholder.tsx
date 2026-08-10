/* Shown on a card when a property has no photo yet.
 *
 * Deliberately not a stock photo. The cards used to fall back to an Unsplash
 * warehouse image, which reads as "here is the building" for a listing whose
 * building nobody has photographed — on an agency site that is a claim about
 * a real property, not a decoration. This is visibly a placeholder. */
export function PhotoPlaceholder({ label = 'ยังไม่มีรูป' }: { label?: string }) {
  return (
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'linear-gradient(135deg,#EEEBE4 0%,#E3DFD6 100%)',
        color: '#9C978C',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M21 15l-5-4-4 3" />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.02em' }}>{label}</span>
    </div>
  );
}
