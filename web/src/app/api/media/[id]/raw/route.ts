/* GET /api/media/:id/raw — the file the website shows.

   FR-ADM-09: this always returns the watermarked derivative. The untouched
   original is reachable only with ?original=1 by a signed-in user, so a
   public URL can never expose it.

   FR-ADM-09b: on top of the upload-time text stamp, the org's uploaded logo
   is composited here using the current /admin/branding setting. Doing it on
   read (rather than baking it at upload) is what lets an admin move the logo
   and have every existing photo follow. The result is cached under a key
   carrying the settings version, so it is composited once per version, and
   public URLs carry ?v= so browser caches turn over too. */
import { handler, ApiError } from '@/lib/server/api';
import { currentUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { getObject, putObject, originalKey, watermarkedKey, mediaIdFromSrc } from '@/lib/server/mediaStore';
import { applyImageWatermark, canWatermark } from '@/lib/server/watermark';
import { normalizeWatermark, type WatermarkConfig } from '@/lib/watermarkConfig';

export const runtime = 'nodejs';

type Wm = { cfg: WatermarkConfig; version: number };

async function watermarkFor(orgId: string): Promise<Wm | null> {
  const b = await db.branding.findUnique({ where: { orgId } });
  if (!b || !b.wmEnabled || !b.wmSrc) return null;
  const cfg = normalizeWatermark({
    enabled: b.wmEnabled, src: b.wmSrc, anchor: b.wmAnchor,
    scale: b.wmScale, opacity: b.wmOpacity, margin: b.wmMargin,
  });
  return cfg.enabled ? { cfg, version: b.wmVersion } : null;
}

/** The logo's own bytes, from the media asset its src points at. */
async function logoBytes(src: string): Promise<Buffer | null> {
  const id = mediaIdFromSrc(src);
  if (!id) return null;
  const asset = await db.mediaAsset.findUnique({ where: { id }, select: { id: true, mime: true } });
  if (!asset) return null;
  // the logo's own untouched upload, so a text stamp never rides along
  return (await getObject(asset.id, asset.mime, originalKey(asset.id, asset.mime)))
    ?? (await getObject(asset.id, asset.mime));
}

export const GET = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  const wantsOriginal = new URL(req.url).searchParams.get('original') === '1';
  if (wantsOriginal && !(await currentUser())) {
    throw new ApiError('UNAUTHENTICATED', 'ต้องเข้าสู่ระบบเพื่อดูไฟล์ต้นฉบับ', 401);
  }

  const key = wantsOriginal ? originalKey(asset.id, asset.mime) : undefined;
  // assets uploaded before watermarking existed only have the public object
  let buf = (await getObject(asset.id, asset.mime, key)) ?? (wantsOriginal ? await getObject(asset.id, asset.mime) : null);
  if (!buf) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  // the logo stamp applies to the public copy only — never to an admin download,
  // and never to the logo asset itself (that would stamp the watermark on itself)
  if (!wantsOriginal && canWatermark(asset.mime)) {
    const wm = await watermarkFor(asset.orgId);
    if (wm && mediaIdFromSrc(wm.cfg.src ?? '') !== asset.id) {
      const cacheKey = watermarkedKey(asset.id, asset.mime, wm.version);
      const cached = await getObject(asset.id, asset.mime, cacheKey);
      if (cached) {
        buf = cached;
      } else {
        const logo = await logoBytes(wm.cfg.src as string);
        if (logo) {
          const stamped = await applyImageWatermark(buf, asset.mime, logo, wm.cfg);
          if (!stamped.equals(buf)) {
            buf = stamped;
            // best-effort cache — a storage hiccup must not fail the request
            await putObject(asset.id, asset.mime, stamped, cacheKey).catch(() => {});
          }
        }
      }
    }
  }

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(buf.length),
      // the original is per-user, so it must never land in a shared cache.
      // public bytes are immutable *for a given ?v=* — the DTOs append the
      // watermark version, so a settings change hands out a fresh URL.
      'Cache-Control': wantsOriginal ? 'private, no-store' : 'public, max-age=31536000, immutable',
    },
  });
});
