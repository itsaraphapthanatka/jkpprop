/* Server-enforced rules, over HTTP — the checks that must hold even when the
   caller ignores the UI entirely.

   Needs a running server + seeded database:
     npm run dev            (or npm start)
     npm run test:api       (BASE_URL overrides the default port)

   Skips itself if nothing is listening, so `npm test` stays green offline.
*/
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const jar: Record<string, string> = {};

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(res.status, 200, `login failed for ${email}`);
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith('jkp_session='));
  assert.ok(cookie, 'no session cookie issued');
  return cookie.split(';')[0];
}

const call = (path: string, cookie?: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
      ...init?.headers,
    },
  });

const json = async (res: Response) => res.json() as Promise<Record<string, never> & { error?: { code: string; message: string } }>;

/* Probed at module load, not in a before() hook: node:test evaluates each
   test's `skip` option while the file is being registered, which happens
   before any hook runs. */
const reachable = await fetch(`${BASE}/api/branding`).then((r) => r.ok).catch(() => false);
if (reachable) {
  jar.owner = await login('owner@jkp.local', 'jkp12345');
  jar.agent = await login('agent@jkp.local', 'jkp12345');
} else {
  console.log(`\n  ⚠ ${BASE} ไม่ตอบสนอง — ข้าม API tests (รัน npm run dev ก่อน)\n`);
}

const skip = () => (reachable ? false : 'server not running');

describe('authentication', () => {
  test('admin API refuses anonymous callers', { skip: skip() }, async () => {
    const res = await call('/api/leads');
    assert.equal(res.status, 401);
    assert.equal((await json(res)).error?.code, 'UNAUTHENTICATED');
  });

  test('wrong password gives the same message as an unknown user (no enumeration)', { skip: skip() }, async () => {
    const bad = await json(await call('/api/auth/login', undefined, { method: 'POST', body: JSON.stringify({ email: 'owner@jkp.local', password: 'nope' }) }));
    const missing = await json(await call('/api/auth/login', undefined, { method: 'POST', body: JSON.stringify({ email: 'nobody@jkp.local', password: 'nope' }) }));
    assert.equal(bad.error?.message, missing.error?.message);
  });

  test('/admin redirects to the login page without a session', { skip: skip() }, async () => {
    const res = await fetch(`${BASE}/admin`, { redirect: 'manual' });
    assert.equal(res.status, 307);
    assert.ok(res.headers.get('location')?.includes('/admin/login'));
  });
});

describe('temporary passwords cannot become permanent ones', () => {
  test('an invited user must replace the issued password before anything else', { skip: skip() }, async () => {
    const email = `pwtest-${Date.now()}@jkp.local`;
    const invited = await (await call('/api/users/invite', jar.owner, {
      method: 'POST', body: JSON.stringify({ email, name: 'ทดสอบ', role: 'ops' }),
    })).json() as { tempPassword: string };

    const first = await (await call('/api/auth/login', undefined, {
      method: 'POST', body: JSON.stringify({ email, password: invited.tempPassword }),
    })).json() as { mustChangePassword?: boolean };
    assert.equal(first.mustChangePassword, true, 'the flag must be raised on a temp password');

    const cookie = await login(email, invited.tempPassword);

    // rejected: too short, mismatched confirmation, wrong current password
    for (const body of [
      { currentPassword: invited.tempPassword, newPassword: 'short1', confirmPassword: 'short1' },
      { currentPassword: invited.tempPassword, newPassword: 'longenough1', confirmPassword: 'different22' },
      { currentPassword: 'not-the-password', newPassword: 'longenough1', confirmPassword: 'longenough1' },
    ]) {
      assert.equal((await call('/api/me/password', cookie, { method: 'POST', body: JSON.stringify(body) })).status, 400);
    }

    const chosen = 'chosen-password-1';
    assert.equal((await call('/api/me/password', cookie, {
      method: 'POST', body: JSON.stringify({ currentPassword: invited.tempPassword, newPassword: chosen, confirmPassword: chosen }),
    })).status, 200);

    // the handed-over password stops working; the chosen one clears the flag
    assert.equal((await call('/api/auth/login', undefined, {
      method: 'POST', body: JSON.stringify({ email, password: invited.tempPassword }),
    })).status, 401);
    const after = await (await call('/api/auth/login', undefined, {
      method: 'POST', body: JSON.stringify({ email, password: chosen }),
    })).json() as { mustChangePassword?: boolean };
    assert.equal(after.mustChangePassword, false);
  });
});

describe('RBAC is enforced at the API, not the UI', () => {
  test('a non-owner cannot list users', { skip: skip() }, async () => {
    const res = await call('/api/users', jar.agent);
    assert.equal(res.status, 403);
  });

  test('a user without the audit privilege cannot read the audit log', { skip: skip() }, async () => {
    assert.equal((await call('/api/audit', jar.agent)).status, 403);
    assert.equal((await call('/api/audit', jar.owner)).status, 200);
  });

  test('granting a forbidden privilege is refused even by direct API call', { skip: skip() }, async () => {
    const users = await (await call('/api/users', jar.owner)).json() as { items: { id: string; role: string }[] };
    const agent = users.items.find((u) => u.role === 'agent');
    assert.ok(agent, 'seed must include an agent');
    const res = await call(`/api/users/${agent!.id}/permissions`, jar.owner, {
      method: 'PUT',
      body: JSON.stringify({ role: 'agent', scope: 'own', privileges: ['pii', 'export'] }),
    });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error?.code, 'FORBIDDEN_PRIV');
  });

  test('an external role without an expiry date is refused', { skip: skip() }, async () => {
    const users = await (await call('/api/users', jar.owner)).json() as { items: { id: string; role: string }[] };
    const agent = users.items.find((u) => u.role === 'agent')!;
    const res = await call(`/api/users/${agent.id}/permissions`, jar.owner, {
      method: 'PUT',
      body: JSON.stringify({ role: 'co_agent', scope: 'all', privileges: [] }),
    });
    assert.equal(res.status, 400);
    assert.match((await json(res)).error?.message ?? '', /วันหมดอายุ/);
  });
});

describe('PII masking (PDPA)', () => {
  test('a caller with the pii privilege sees the full number', { skip: skip() }, async () => {
    const r = await (await call('/api/leads', jar.owner)).json() as { items: { phone: string; piiMasked: boolean }[] };
    if (!r.items.length) return; // nothing submitted yet
    assert.equal(r.items[0].piiMasked, false);
    assert.ok(!r.items[0].phone.includes('xxx'));
  });
});

describe('public endpoints never leak internal data', () => {
  test('listing feed omits coordinates and lessor contacts', { skip: skip() }, async () => {
    const r = await (await call('/api/public/listings')).json() as { items: Record<string, unknown>[] };
    for (const item of r.items) {
      for (const key of ['location_map', 'lessor_phone', 'lessor_name', 'internal_note']) {
        assert.ok(!(key in item), `${key} must not reach the public feed`);
      }
    }
  });

  test('property detail strips coordinates and the internal note', { skip: skip() }, async () => {
    const list = await (await call('/api/public/listings')).json() as { items: { code: string }[] };
    if (!list.items.length) return;
    const detail = await (await call(`/api/public/properties/${list.items[0].code}`)).json() as { values: Record<string, unknown> };
    assert.ok(!('location_map' in detail.values));
    assert.ok(!('lessor_phone' in detail.values));
    assert.ok(!('internal_note' in detail.values));
  });

  test('the public lead form rejects a submission with no phone number', { skip: skip() }, async () => {
    const res = await call('/api/public/leads', undefined, {
      method: 'POST',
      body: JSON.stringify({ name: 'ทดสอบ', respondentType: 'เป็น ลูกค้า (ผู้เช่า)' }),
    });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error?.code, 'VALIDATION');
  });

  test('the honeypot field silently absorbs bots', { skip: skip() }, async () => {
    const res = await call('/api/public/leads', undefined, {
      method: 'POST',
      body: JSON.stringify({ name: 'bot', phone: '1', respondentType: 'x', website: 'spam.example' }),
    });
    assert.equal(res.status, 200); // looks successful to the bot, stores nothing
  });
});

describe('property rules', () => {
  test('public_code is generated from the province and is immutable', { skip: skip() }, async () => {
    const created = await (await call('/api/properties', jar.owner, {
      method: 'POST',
      body: JSON.stringify({ typeKey: 'warehouse', title: 'ทดสอบ code gen', values: { province: 'ชลบุรี' } }),
    })).json() as { id: string; publicCode: string };
    assert.match(created.publicCode, /^JKP-CBI\d{4}$/);

    const res = await call(`/api/properties/${created.id}`, jar.owner, {
      method: 'PATCH',
      body: JSON.stringify({ publicCode: 'JKP-HACK0001' }),
    });
    assert.equal(res.status, 400);
    assert.equal((await json(res)).error?.code, 'IMMUTABLE');

    await call(`/api/properties/${created.id}`, jar.owner, { method: 'DELETE' });
  });

  test('Bangkok properties get the un-suffixed prefix', { skip: skip() }, async () => {
    const created = await (await call('/api/properties', jar.owner, {
      method: 'POST',
      body: JSON.stringify({ typeKey: 'factory', title: 'ทดสอบ bkk', values: { province: 'กรุงเทพมหานคร' } }),
    })).json() as { id: string; publicCode: string };
    assert.match(created.publicCode, /^JKP\d{4}$/);
    await call(`/api/properties/${created.id}`, jar.owner, { method: 'DELETE' });
  });

  test('publishing without a photo is blocked', { skip: skip() }, async () => {
    const created = await (await call('/api/properties', jar.owner, {
      method: 'POST',
      body: JSON.stringify({ typeKey: 'warehouse', title: 'ยังไม่มีรูป', values: { province: 'ระยอง' } }),
    })).json() as { id: string; publicCode: string };

    const res = await call(`/api/listings/${created.publicCode}`, jar.owner, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    });
    assert.equal((await json(res)).error?.code, 'PUBLISH_GATE');
    await call(`/api/properties/${created.id}`, jar.owner, { method: 'DELETE' });
  });
});

describe('pipeline gates', () => {
  test('a shortlist containing an unavailable listing cannot be sent (FR-AVL-04)', { skip: skip() }, async () => {
    const prop = await (await call('/api/properties', jar.owner, {
      method: 'POST',
      body: JSON.stringify({ typeKey: 'warehouse', title: 'ทดสอบ gate', values: { province: 'ระยอง' }, status: 'active' }),
    })).json() as { id: string; publicCode: string };

    const sl = await (await call('/api/shortlists', jar.owner, {
      method: 'POST',
      body: JSON.stringify({ name: 'ทดสอบ gate', codes: [prop.publicCode] }),
    })).json() as { id: string };

    // take the listing off the market, then try to send
    await call(`/api/listings/${prop.publicCode}`, jar.owner, { method: 'PATCH', body: JSON.stringify({ status: 'hidden' }) });
    const blocked = await call(`/api/shortlists/${sl.id}`, jar.owner, { method: 'PATCH', body: JSON.stringify({ status: 'sent' }) });
    assert.equal((await json(blocked)).error?.code, 'AVAILABILITY_REQUIRED');

    await call(`/api/properties/${prop.id}`, jar.owner, { method: 'DELETE' });
  });

  test('a closed deal locks, refuses new offers, and needs a reason to unlock', { skip: skip() }, async () => {
    const deal = await (await call('/api/deals', jar.owner, {
      method: 'POST',
      body: JSON.stringify({ title: 'ทดสอบ lock', amount: 1000 }),
    })).json() as { id: string };

    assert.equal((await call(`/api/deals/${deal.id}/offers`, jar.owner, {
      method: 'POST', body: JSON.stringify({ side: 'ฝั่งลูกค้า', amount: '฿1,000' }),
    })).status, 201);

    await call(`/api/deals/${deal.id}`, jar.owner, { method: 'PATCH', body: JSON.stringify({ status: 'won' }) });

    const afterClose = await call(`/api/deals/${deal.id}/offers`, jar.owner, {
      method: 'POST', body: JSON.stringify({ side: 'ตกลง', amount: '฿2,000' }),
    });
    assert.equal((await json(afterClose)).error?.code, 'DEAL_LOCKED');

    const noReason = await call(`/api/deals/${deal.id}`, jar.owner, { method: 'PATCH', body: JSON.stringify({ unlock: true }) });
    assert.equal(noReason.status, 400);

    const withReason = await call(`/api/deals/${deal.id}`, jar.owner, {
      method: 'PATCH', body: JSON.stringify({ unlock: true, reason: 'ทดสอบ' }),
    });
    assert.equal(withReason.status, 200);
  });
});

describe('watermarking (FR-ADM-09)', () => {
  /* a 4x4 PNG is enough: the point is that the served bytes differ from the
     stored ones, and that the original needs a session */
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR42mNk+M9QzwAFjDAGACwLA/8AAAAASUVORK5CYII=',
    'base64',
  );

  const upload = async (watermarkType: string) => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(tinyPng)], 'wm.png', { type: 'image/png' }));
    form.append('watermarkType', watermarkType);
    const res = await fetch(`${BASE}/api/media`, { method: 'POST', headers: { cookie: jar.owner }, body: form });
    assert.equal(res.status, 200, 'upload should succeed');
    return (await res.json()) as { id: string; watermarkType: string };
  };

  test('a watermarked upload serves different bytes than it stores', { skip: skip() }, async () => {
    const asset = await upload('corner');
    assert.equal(asset.watermarkType, 'corner');

    const shown = Buffer.from(await (await call(`/api/media/${asset.id}/raw`)).arrayBuffer());
    const original = Buffer.from(await (await call(`/api/media/${asset.id}/raw?original=1`, jar.owner)).arrayBuffer());
    assert.ok(!shown.equals(original), 'the public file must not be the original');
    assert.ok(original.equals(tinyPng), 'the stored original must be untouched');

    await call(`/api/media/${asset.id}`, jar.owner, { method: 'DELETE' });
  });

  test('the original is not reachable without a session', { skip: skip() }, async () => {
    const asset = await upload('tiled');
    assert.equal((await call(`/api/media/${asset.id}/raw?original=1`)).status, 401);
    assert.equal((await call(`/api/media/${asset.id}/raw`)).status, 200, 'the watermarked file stays public');
    await call(`/api/media/${asset.id}`, jar.owner, { method: 'DELETE' });
  });

  test('none leaves the file alone', { skip: skip() }, async () => {
    const asset = await upload('none');
    const shown = Buffer.from(await (await call(`/api/media/${asset.id}/raw`)).arrayBuffer());
    assert.ok(shown.equals(tinyPng));
    await call(`/api/media/${asset.id}`, jar.owner, { method: 'DELETE' });
  });

  test('an unknown watermark style is rejected', { skip: skip() }, async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(tinyPng)], 'wm.png', { type: 'image/png' }));
    form.append('watermarkType', 'rainbow');
    const res = await fetch(`${BASE}/api/media`, { method: 'POST', headers: { cookie: jar.owner }, body: form });
    assert.equal(res.status, 400);
  });
});

describe('input validation the UI only advertises', () => {
  test('at least one property type must stay enabled', { skip: skip() }, async () => {
    const res = await call('/api/property-types/config', jar.owner, {
      method: 'PUT',
      body: JSON.stringify({ disabled: ['house', 'condo', 'land', 'factory', 'warehouse', 'showroom'] }),
    });
    assert.equal(res.status, 400);
  });

  test('at least one notification window must stay selected', { skip: skip() }, async () => {
    const res = await call('/api/notify-config', jar.owner, {
      method: 'PUT',
      body: JSON.stringify({ enabled: true, months: [], includeExpired: false }),
    });
    assert.equal(res.status, 400);
  });

  test('brand colours must be #RRGGBB', { skip: skip() }, async () => {
    const res = await call('/api/branding', jar.owner, { method: 'PUT', body: JSON.stringify({ primary: 'red' }) });
    assert.equal(res.status, 400);
  });
});
