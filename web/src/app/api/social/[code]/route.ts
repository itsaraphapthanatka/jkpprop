/* PUT /api/social/:code — save one listing's social record (§6.5).
   Rules kept from the client store:
   - `text: null` clears the manual caption → falls back to buildSummary()
   - editing the caption NEVER writes back to the property record (rule #2) */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { ChannelPost } from '@/lib/socialStore';

export const PUT = handler(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'marketing');
  const { code } = await ctx.params;

  const body = (await req.json().catch(() => null)) as { text?: string | null; photos?: unknown; channels?: Record<string, ChannelPost> } | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const text = typeof body.text === 'string' && body.text.trim() ? body.text.slice(0, 8000) : null;
  /* สไลด์ 35 · รูปสำหรับโพสต์ของประกาศนี้ — เก็บ src ที่เสิร์ฟได้เลย เหมือนช่อง
     รูปทรัพย์ · จำกัดจำนวนไว้กันกดพลาดจนแถวบวม */
  const photos = Array.isArray(body.photos)
    ? body.photos.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 30)
    : undefined;
  await db.socialRecord.upsert({
    where: { orgId_code: { orgId: user.orgId, code } },
    create: { orgId: user.orgId, code, text, ...(photos ? { photos } : {}) },
    update: { text, ...(photos ? { photos } : {}) },
  });

  const channels = body.channels && typeof body.channels === 'object' ? body.channels : {};
  const known = new Set((await db.socialChannel.findMany({ where: { orgId: user.orgId }, select: { key: true } })).map((c) => c.key));
  for (const [channelKey, post] of Object.entries(channels)) {
    if (!known.has(channelKey)) continue; // ignore unknown channels instead of creating orphans
    const data = {
      done: !!post?.done,
      date: typeof post?.date === 'string' ? post.date.slice(0, 10) : null,
      url: typeof post?.url === 'string' ? post.url.slice(0, 500) : null,
    };
    await db.socialPost.upsert({
      where: { orgId_code_channelKey: { orgId: user.orgId, code, channelKey } },
      create: { orgId: user.orgId, code, channelKey, ...data },
      update: data,
    });
  }

  await audit({ user, orgId: user.orgId, action: 'social.save', entity: 'listing', entityId: code, after: { hasText: text !== null, channels: Object.keys(channels) } });
  return ok({ ok: true });
});
