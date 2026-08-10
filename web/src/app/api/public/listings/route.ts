/* GET /api/public/listings — 🔵 PUBLIC listing feed for the website.
   Only `active` properties; display-ready strings so the ported markup can
   render them unchanged. Never emits coordinates, lessor contacts, or
   internalOnly fields (AGENT.md §7 + FRONTEND_API_SPEC §3).

   The query itself lives in lib/server/publicListings so the server-rendered
   pages and this endpoint cannot drift apart.

   Query: ?deal=rent|sale ?type=factory|warehouse ?province=… ?limit=… */
import { ok, handler } from '@/lib/server/api';
import { loadPublicListings } from '@/lib/server/publicListings';
import { isLocale } from '@/i18n/config';

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const rawLocale = url.searchParams.get('locale') || '';
  const items = await loadPublicListings({
    locale: isLocale(rawLocale) ? rawLocale : undefined,
    deal: url.searchParams.get('deal') || undefined,
    type: url.searchParams.get('type') || undefined,
    province: url.searchParams.get('province') || undefined,
    limit: Number(url.searchParams.get('limit') || 24),
  });

  return ok({ items, total: items.length });
});
