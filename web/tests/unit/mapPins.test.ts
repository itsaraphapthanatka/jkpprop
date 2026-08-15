/* The home-page map is drawn from real province outlines now, so the pins can
   be checked against the geography itself rather than against percentages
   somebody eyeballed: each pin has to fall inside the province it stands in.
   The old map failed this — Don Mueang sat over Nakhon Nayok. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PROVINCE } from '../../src/lib/thaiProvinces.ts';
import { FACTOR_PROVINCES, PIN_FACTORS } from '../../src/components/home/RegionMap.tsx';

const inRing = (lng: number, lat: number, ring: [number, number][]) => {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
const inProvince = (key: string, lng: number, lat: number) =>
  PROVINCE[key].rings.some((r) => inRing(lng, lat, r));

/* A port terminal is not always on the land a boundary dataset draws: Laem
   Chabang stands on reclaimed ground 0.58 km beyond Natural Earth's coastline,
   so it is outside Chonburi in the raw data too. Within a couple of kilometres
   it is standing on the province as far as a reader is concerned; further than
   that and it is in the wrong place. */
const kmToProvince = (key: string, lng: number, lat: number) => {
  if (inProvince(key, lng, lat)) return 0;
  let best = Infinity;
  for (const ring of PROVINCE[key].rings) {
    for (const [x, y] of ring) {
      const dx = (x - lng) * Math.cos((lat * Math.PI) / 180) * 111;
      const dy = (y - lat) * 111;
      best = Math.min(best, Math.hypot(dx, dy));
    }
  }
  return best;
};

const PINS: [string, number, number, string][] = [
  ['ดอนเมือง', 100.6068, 13.9126, 'bangkok'],
  ['สุวรรณภูมิ', 100.7501, 13.6900, 'samut_prakan'],
  ['CBD กรุงเทพฯ', 100.5340, 13.7280, 'bangkok'],
  ['ท่าเรือมหาชัย', 100.2740, 13.5470, 'samut_sakhon'],
  ['ท่าเรือแหลมฉบัง', 100.8836, 13.0827, 'chonburi'],
  ['ท่าเรือมาบตาพุด', 101.1500, 12.6800, 'rayong'],
];

describe('pins against the provinces they are drawn on', () => {
  for (const [name, lng, lat, province] of PINS) {
    test(`${name} stands on ${province}`, () => {
      const km = kmToProvince(province, lng, lat);
      assert.ok(km <= 2, `${name} is ${km.toFixed(1)} km from ${province}`);
    });
  }

  test('a pin is not inside a province on the other side of the country', () => {
    // the check has to be able to fail, or it proves nothing
    assert.ok(kmToProvince('rayong', 100.6068, 13.9126) > 50, 'Don Mueang cannot be in Rayong');
    assert.ok(kmToProvince('bangkok', 101.15, 12.68) > 50, 'Map Ta Phut cannot be in Bangkok');
  });

  test('every pin belongs to a factor, and every factor lights its province', () => {
    for (const [name, , , province] of PINS) {
      const factors = PIN_FACTORS[name];
      assert.ok(factors?.length, `${name} belongs to no factor`);
      for (const f of factors) {
        assert.ok(FACTOR_PROVINCES[f].includes(province), `${f} does not light ${province}, where ${name} stands`);
      }
    }
  });

  test('the EEC is the three provinces the law names', () => {
    assert.deepEqual([...FACTOR_PROVINCES.eec].sort(), ['chachoengsao', 'chonburi', 'rayong']);
  });
});
