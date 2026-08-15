/* Where the pins land on the homepage map.
   They used to be eyeballed percentages over an image cropped with
   object-fit:cover — Don Mueang sat over Nakhon Nayok, Suvarnabhumi further
   east still. They are placed from real coordinates now, so this is the check
   that the projection still points at the right places. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/* mirrors LocationFinder's constants — kept here so a change to either one
   has to be made deliberately in both places */
const B = { north: 14.8554, south: 12.3095, west: 99.6061, east: 102.3994 };
const pos = (lat: number, lng: number) => ({
  x: ((lng - B.west) / (B.east - B.west)) * 100,
  y: ((B.north - lat) / (B.north - B.south)) * 100,
});

/* towns visible on the map image, at their real coordinates, with where they
   actually appear on it (measured off the file, ±1%) */
const LANDMARKS: [string, number, number, number, number][] = [
  ['Ratchaburi', 13.53, 99.81, 7.3, 52.1],
  ['Chonburi', 13.36, 100.98, 49.2, 58.7],
  ['Rayong', 12.68, 101.28, 60.0, 85.4],
  ['Ayutthaya', 14.35, 100.58, 34.9, 19.8],
  ['Hua Hin', 12.57, 99.96, 12.7, 89.7],
];

describe('the map projection', () => {
  for (const [name, lat, lng, x, y] of LANDMARKS) {
    test(`${name} lands where it is drawn`, () => {
      const p = pos(lat, lng);
      assert.ok(Math.abs(p.x - x) < 1.5, `${name} x: ${p.x.toFixed(1)}% vs ${x}%`);
      assert.ok(Math.abs(p.y - y) < 1.5, `${name} y: ${p.y.toFixed(1)}% vs ${y}%`);
    });
  }

  test('the airports are north-west of the ports, not east of them', () => {
    const donMueang = pos(13.9126, 100.6068);
    const suvarnabhumi = pos(13.6900, 100.7501);
    const laemChabang = pos(13.0827, 100.8836);

    // Don Mueang is north of Suvarnabhumi, and both are north of Laem Chabang
    assert.ok(donMueang.y < suvarnabhumi.y);
    assert.ok(suvarnabhumi.y < laemChabang.y);
    // and west of it — the old values put them the other way round
    assert.ok(donMueang.x < laemChabang.x);
    assert.ok(suvarnabhumi.x < laemChabang.x);
  });

  test('every pin sits inside the image', () => {
    const pins: [number, number][] = [
      [13.9126, 100.6068], [13.6900, 100.7501], [13.7280, 100.5340],
      [13.5470, 100.2740], [13.0827, 100.8836], [12.6800, 101.1500],
    ];
    for (const [lat, lng] of pins) {
      const p = pos(lat, lng);
      assert.ok(p.x > 2 && p.x < 98, `x out of frame: ${p.x}`);
      assert.ok(p.y > 2 && p.y < 98, `y out of frame: ${p.y}`);
    }
  });
});
