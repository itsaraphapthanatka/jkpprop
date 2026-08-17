/* ============================================================
   Public photo URLs carry the watermark settings version.

   /api/media/:id/raw is served with a one-year immutable cache, which is
   right for bytes that never change — but the logo watermark is composited
   from a setting an admin can move. Appending ?v=<version> means a settings
   change hands out a different URL, so browsers and CDNs pick up the new
   stamp instead of showing last year's copy.

   Every surface that hands a photo URL to a visitor has to do this, not just
   the JSON API: when only /api/public/properties/:code applied it, the site
   composited correctly and still looked unstamped, because the HTML linked
   the un-versioned URL. The surfaces are loadPublicListings (home, listing,
   related cards, /api/public/listings) and the property detail page.
   ============================================================ */
import { db } from '@/lib/server/db';

/** 0 when no watermark is configured — the URL then stays clean. */
export async function watermarkVersion(orgId: string): Promise<number> {
  const b = await db.branding.findUnique({
    where: { orgId },
    select: { wmEnabled: true, wmSrc: true, wmVersion: true },
  });
  return b?.wmEnabled && b.wmSrc ? b.wmVersion : 0;
}

/** Appends ?v= to a stored media src, leaving absolute CDN URLs valid too. */
export function withVersion(src: string, version: number): string {
  if (!version || !src) return src;
  return src + (src.includes('?') ? '&' : '?') + 'v=' + version;
}

export const withVersionAll = (srcs: string[], version: number) =>
  srcs.map((s) => withVersion(s, version));
