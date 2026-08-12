/* The coordinate is typed by hand in the CMS and ends up inside a URL, so it
   is parsed into numbers and the URL rebuilt — never interpolated raw. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseGeoPoint, mapEmbedUrl, mapLinkUrl } from '../../src/lib/geoPoint.ts';

describe('parseGeoPoint', () => {
  test('accepts what a person actually pastes from Google Maps', () => {
    assert.deepEqual(parseGeoPoint('13.7563,100.5018'), { lat: 13.7563, lng: 100.5018 });
    assert.deepEqual(parseGeoPoint('  13.7563 , 100.5018  '), { lat: 13.7563, lng: 100.5018 });
    assert.deepEqual(parseGeoPoint('-6.5,-38.25'), { lat: -6.5, lng: -38.25 });
  });

  test('rejects anything that is not a coordinate pair', () => {
    for (const bad of ['', '  ', 'กรุงเทพ', '13.7563', '13.7563,100.5018,5', 'abc,def',
      '13.7563;100.5018', '<script>', "13,100');alert(1)//"]) {
      assert.equal(parseGeoPoint(bad), null, `accepted ${JSON.stringify(bad)}`);
    }
  });

  test('rejects impossible positions', () => {
    assert.equal(parseGeoPoint('91,100'), null);
    assert.equal(parseGeoPoint('13,181'), null);
    assert.equal(parseGeoPoint('-90.1,0'), null);
  });

  test('the URLs are built from the numbers, so nothing typed can leak in', () => {
    const p = parseGeoPoint('13.7563,100.5018')!;
    const embed = mapEmbedUrl(p);
    assert.match(embed, /^https:\/\/www\.google\.com\/maps\?q=13\.7563,100\.5018&/);
    assert.doesNotMatch(embed, /[<>"']/);
    assert.match(mapLinkUrl(p), /query=13\.7563,100\.5018$/);
  });
});
