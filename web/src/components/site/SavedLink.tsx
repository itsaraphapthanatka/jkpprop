'use client';

/* "บันทึกไว้ 3" in the masthead.
 *
 * The heart on a card was a light that came on and led nowhere: a visitor
 * pressed it on the home page, moved to another page, and had no way back to
 * what they had marked — so the only honest reading of the button was that it
 * did nothing. This is the way back, and it is on every public page.
 *
 * It is absent until something is saved, rather than sitting there reading
 * zero: a counter at nought is furniture, and the header already has enough.
 */
import Link from '@/i18n/LocaleLink';
import { useDict } from '@/i18n/useDict';
import { useFavourites } from '@/lib/favourites';

export function SavedLink({ block = false }: { block?: boolean }) {
  const d = useDict();
  const { codes } = useFavourites();
  if (!codes.length) return null;

  return (
    <Link
      id={block ? 'saved-link-mobile' : 'saved-link'}
      href="/listing?saved=1"
      className={block ? undefined : 'nav-link'}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        ...(block
          ? { padding: '15px 10px', borderRadius: 12, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }
          : { fontSize: 14, fontWeight: 600, color: 'var(--text)' }),
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
      </svg>
      {d.listing.saved} {codes.length}
    </Link>
  );
}
