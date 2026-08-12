/* A "lat,lng" string from the CMS, turned into numbers we can trust.
 *
 * The contact page showed a stock photograph of a map. This makes it a real
 * location — but the value is typed by hand into a text box and ends up in a
 * URL, so it is parsed into two numbers and rebuilt, never passed through.
 */
export type GeoPoint = { lat: number; lng: number };

/** Accepts "13.7563,100.5018", with or without spaces. Null if it isn't one. */
export function parseGeoPoint(raw: string | null | undefined): GeoPoint | null {
  if (!raw) return null;
  const m = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(raw);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/* Rebuilt from the parsed numbers, so nothing a person typed reaches the URL.
   `output=embed` needs no API key and no billing account. */
export const mapEmbedUrl = ({ lat, lng }: GeoPoint, zoom = 16): string =>
  `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=th&output=embed`;

/** Where "open in Maps" should go — the app on a phone, the site otherwise. */
export const mapLinkUrl = ({ lat, lng }: GeoPoint): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
