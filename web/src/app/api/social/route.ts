/* Social status (§6.5) — the whole store in one call so the page can swap
   loadSocial() for this without restructuring:
   { channels: Channel[], records: Record<code, SocialRecord> }
   RBAC (MATRIX "Social Status"): owner, manager, agent(scope), marketing. */
import { ok, handler } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { DEFAULT_CHANNELS, type SocialRecord } from '@/lib/socialStore';

export const GET = handler(async () => {
  const user = await requireUser();
  const [channels, records, posts] = await Promise.all([
    db.socialChannel.findMany({ where: { orgId: user.orgId }, orderBy: { sort: 'asc' } }),
    db.socialRecord.findMany({ where: { orgId: user.orgId } }),
    db.socialPost.findMany({ where: { orgId: user.orgId } }),
  ]);

  const out: Record<string, SocialRecord> = {};
  for (const r of records) out[r.code] = { ...(r.text !== null ? { text: r.text } : {}), ...(r.photos.length ? { photos: r.photos } : {}), channels: {} };
  for (const p of posts) {
    if (!out[p.code]) out[p.code] = { channels: {} };
    out[p.code].channels[p.channelKey] = {
      done: p.done,
      ...(p.date ? { date: p.date } : {}),
      ...(p.url ? { url: p.url } : {}),
    };
  }

  return ok({
    channels: channels.length ? channels.map((c) => ({ key: c.key, label: c.label })) : DEFAULT_CHANNELS,
    records: out,
  });
});
