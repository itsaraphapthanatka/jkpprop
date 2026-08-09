/* GET /api/media/:id/raw — the file the website shows.

   FR-ADM-09: this always returns the watermarked derivative. The untouched
   original is reachable only with ?original=1 by a signed-in user, so a
   public URL can never expose it. */
import { handler, ApiError } from '@/lib/server/api';
import { currentUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { getObject, originalKey } from '@/lib/server/mediaStore';

export const runtime = 'nodejs';

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
  const buf = (await getObject(asset.id, asset.mime, key)) ?? (wantsOriginal ? await getObject(asset.id, asset.mime) : null);
  if (!buf) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(buf.length),
      // the original is per-user, so it must never land in a shared cache
      'Cache-Control': wantsOriginal ? 'private, no-store' : 'public, max-age=31536000, immutable',
    },
  });
});
