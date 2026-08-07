/* GET /api/media/:id/raw — stream the file from disk. Public read: the
   website serves listing photos from here. Immutable cache (content never
   changes for a given id). */
import { readFile } from 'fs/promises';
import { handler, ApiError } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { diskPathFor } from '@/lib/server/mediaStore';

export const runtime = 'nodejs';

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);
  const buf = await readFile(diskPathFor(asset.id, asset.mime)).catch(() => null);
  if (!buf) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(buf.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});
