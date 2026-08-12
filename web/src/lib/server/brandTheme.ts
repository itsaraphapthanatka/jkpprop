/* Turn the row behind /admin/branding into CSS the public site can use.
 *
 * The colour picker has always saved to the database and the API even says
 * it is "public-readable so the site can theme itself" — but nothing on the
 * public side ever read it. The colours were hard-coded into a few hundred
 * inline styles, so picking a preset changed a database row and nothing else.
 */
import { db } from './db';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#2DFB91" → "45,251,145", for the rgba() glows the design is built from. */
function toRgb(hex: string): string | null {
  if (!HEX.test(hex)) return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Scale a colour towards black — the dark panels and image overlays are a
    much deeper version of the pine, and they have to move with it. */
function darken(hex: string, keep: number): string | null {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  return rgb.split(',').map((v) => Math.round(Number(v) * keep)).join(',');
}

/**
 * A `:root { … }` block overriding only the brand tokens, or '' when the org
 * is still on the defaults already in globals.css.
 */
export async function brandThemeCss(): Promise<string> {
  const b = await db.branding.findFirst().catch(() => null);
  if (!b) return '';

  const vars: string[] = [];
  const put = (name: string, hex: string | null | undefined) => {
    if (!hex || !HEX.test(hex)) return; // never interpolate an unvalidated value into CSS
    vars.push(`--${name}:${hex}`);
    const rgb = toRgb(hex);
    if (rgb) vars.push(`--${name}-rgb:${rgb}`);
  };

  put('primary', b.primary);
  put('accent', b.accent);
  put('neon', b.neon);
  put('pine', b.pine);

  if (b.pine && HEX.test(b.pine)) {
    const ink = darken(b.pine, 0.16);
    const ink2 = darken(b.pine, 0.13);
    if (ink) vars.push(`--ink:rgb(${ink})`, `--ink-rgb:${ink}`);
    if (ink2) vars.push(`--ink2-rgb:${ink2}`);
  }

  return vars.length ? `:root{${vars.join(';')}}` : '';
}
