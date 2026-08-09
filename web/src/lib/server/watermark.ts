/* ============================================================
   FR-ADM-09 — two watermark styles, applied before anything is served
   publicly. The untouched original stays in storage for admin use.

   `corner` — one brand mark bottom-right, unobtrusive, for hero shots
   `tiled`  — repeated diagonal marks, hard to crop out, for spec photos

   Both are drawn as an SVG overlay rather than by compositing the logo
   file, so the result scales with the image and does not depend on the
   logo's own dimensions.
   ============================================================ */
import sharp from 'sharp';

export const WATERMARK_TYPES = ['none', 'corner', 'tiled'] as const;
export type WatermarkType = (typeof WATERMARK_TYPES)[number];

export const isWatermarkType = (v: string): v is WatermarkType =>
  (WATERMARK_TYPES as readonly string[]).includes(v);

/** Only raster images can be watermarked — a PDF passes through untouched. */
export const canWatermark = (mime: string) =>
  mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] as string));

function cornerSvg(w: number, h: number, text: string): string {
  const size = Math.max(14, Math.round(Math.min(w, h) * 0.045));
  const pad = Math.round(size * 0.9);
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <style>.wm{font-family:sans-serif;font-weight:700;font-size:${size}px;fill:#ffffff;fill-opacity:.82}</style>
  <text class="wm" x="${w - pad}" y="${h - pad}" text-anchor="end"
        style="paint-order:stroke;stroke:#04140C;stroke-opacity:.35;stroke-width:${Math.max(1, size / 8)}px">${esc(text)}</text>
</svg>`;
}

function tiledSvg(w: number, h: number, text: string): string {
  const size = Math.max(12, Math.round(Math.min(w, h) * 0.032));
  const step = size * 9;
  const rows: string[] = [];
  for (let y = -h; y < h * 2; y += step) {
    for (let x = -w; x < w * 2; x += step) {
      rows.push(`<text class="wm" x="${x}" y="${y}">${esc(text)}</text>`);
    }
  }
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <style>.wm{font-family:sans-serif;font-weight:700;font-size:${size}px;fill:#ffffff;fill-opacity:.28}</style>
  <g transform="rotate(-30 ${w / 2} ${h / 2})">${rows.join('')}</g>
</svg>`;
}

/**
 * Returns the bytes to serve publicly. `none`, a non-raster file, or an
 * unreadable image all fall through to the original — a watermark failure
 * must never cost the upload.
 */
export async function applyWatermark(
  input: Buffer,
  mime: string,
  type: WatermarkType,
  brand = 'JKP Property',
): Promise<Buffer> {
  if (type === 'none' || !canWatermark(mime)) return input;
  try {
    const img = sharp(input, { failOn: 'none' });
    const { width, height } = await img.metadata();
    if (!width || !height) return input;

    const svg = type === 'tiled' ? tiledSvg(width, height, brand) : cornerSvg(width, height, brand);
    const out = img.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);

    if (mime === 'image/png') return await out.png().toBuffer();
    if (mime === 'image/webp') return await out.webp().toBuffer();
    return await out.jpeg({ quality: 88 }).toBuffer();
  } catch {
    return input;
  }
}
