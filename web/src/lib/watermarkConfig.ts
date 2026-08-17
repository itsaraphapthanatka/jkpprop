/* ============================================================
   Watermark settings — the agency uploads a logo once and picks where it
   sits; every property photo the public sees carries it.

   Shared by the admin editor and the server compositor so the preview and
   the rendered bytes agree on the geometry. Position is expressed as a
   9-point anchor plus a margin, both relative to the image, so one setting
   works for any photo size.
   ============================================================ */

export const WM_ANCHORS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
  'tiled',
] as const;
export type WmAnchor = (typeof WM_ANCHORS)[number];

export const WM_ANCHOR_LABEL: Record<WmAnchor, string> = {
  'top-left': 'ซ้ายบน', 'top-center': 'กลางบน', 'top-right': 'ขวาบน',
  'middle-left': 'ซ้ายกลาง', center: 'กลางภาพ', 'middle-right': 'ขวากลาง',
  'bottom-left': 'ซ้ายล่าง', 'bottom-center': 'กลางล่าง', 'bottom-right': 'ขวาล่าง',
  tiled: 'เรียงทั้งภาพ',
};

export type WatermarkConfig = {
  enabled: boolean;
  src: string | null; // media src of the uploaded logo
  anchor: WmAnchor;
  /** ความกว้างของลายน้ำ เทียบกับความกว้างภาพ (%) */
  scale: number;
  /** ความทึบ (%) */
  opacity: number;
  /** ระยะห่างจากขอบ เทียบกับความกว้างภาพ (%) — ไม่ใช้กับ tiled */
  margin: number;
};

export const WM_DEFAULTS: WatermarkConfig = {
  enabled: false,
  src: null,
  anchor: 'bottom-right',
  scale: 18,
  opacity: 70,
  margin: 3,
};

export const WM_LIMITS = {
  scale: { min: 4, max: 60 },
  opacity: { min: 10, max: 100 },
  margin: { min: 0, max: 20 },
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const num = (v: unknown, fallback: number, lo: number, hi: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? clamp(Math.round(n), lo, hi) : fallback;
};

export const isWmAnchor = (v: unknown): v is WmAnchor =>
  typeof v === 'string' && (WM_ANCHORS as readonly string[]).includes(v);

/** Accepts anything (API body, DB row, corrupt JSON) and returns a usable config. */
export function normalizeWatermark(raw: unknown): WatermarkConfig {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const src = typeof o.src === 'string' && o.src.trim() ? o.src.trim() : null;
  return {
    // a watermark with no image can never be "on" — otherwise the pipeline
    // would report enabled and then silently draw nothing
    enabled: o.enabled === true && !!src,
    src,
    anchor: isWmAnchor(o.anchor) ? o.anchor : WM_DEFAULTS.anchor,
    scale: num(o.scale, WM_DEFAULTS.scale, WM_LIMITS.scale.min, WM_LIMITS.scale.max),
    opacity: num(o.opacity, WM_DEFAULTS.opacity, WM_LIMITS.opacity.min, WM_LIMITS.opacity.max),
    margin: num(o.margin, WM_DEFAULTS.margin, WM_LIMITS.margin.min, WM_LIMITS.margin.max),
  };
}

/** Fields that change the rendered pixels — used to decide a version bump. */
export const wmFingerprint = (c: WatermarkConfig) =>
  [c.enabled ? 1 : 0, c.src ?? '', c.anchor, c.scale, c.opacity, c.margin].join('|');

/**
 * Where the logo lands, in pixels, for a given image and logo size.
 * Kept pure so the admin preview can position an <img> with the same maths
 * the server uses to composite.
 */
export function wmPlacement(
  imgW: number, imgH: number, logoW: number, logoH: number, c: WatermarkConfig,
): { left: number; top: number } {
  const m = Math.round((c.margin / 100) * imgW);
  const [vy, vx] = (c.anchor === 'tiled' ? 'center' : c.anchor).split('-') as [string, string?];
  const horizontal = vx ?? 'center'; // 'center' has no second part
  const left = horizontal === 'left' ? m : horizontal === 'right' ? imgW - logoW - m : Math.round((imgW - logoW) / 2);
  const top = vy === 'top' ? m : vy === 'bottom' ? imgH - logoH - m : Math.round((imgH - logoH) / 2);
  return { left: clamp(left, 0, Math.max(0, imgW - logoW)), top: clamp(top, 0, Math.max(0, imgH - logoH)) };
}
