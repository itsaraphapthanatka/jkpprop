/* ============================================================
   Watermark settings — the agency uploads a logo once and picks where it
   sits; every property photo the public sees carries it.

   Shared by the admin editor and the server compositor so the preview and
   the rendered bytes agree on the geometry.

   ตำแหน่งเก็บเป็น x/y เป็นเปอร์เซ็นต์ของที่ว่างในภาพ (0 = ชิดซ้าย/บน,
   100 = ชิดขวา/ล่าง) จึงเลื่อนไปวางตรงไหนก็ได้ ไม่ใช่เลือกได้แค่ 9 จุด —
   ลูกค้าขอว่า "ปรับให้เป็นแบบเลื่อน" · ค่าเก่าที่เป็นชื่อมุมทั้ง 9 ยังรับได้อยู่
   และถูกแปลงเป็น x/y ให้อัตโนมัติ ของที่ตั้งไว้แล้วจึงไม่ขยับ
   ============================================================ */

export const WM_ANCHORS = ['free', 'tiled'] as const;
export type WmAnchor = (typeof WM_ANCHORS)[number];

export const WM_ANCHOR_LABEL: Record<WmAnchor, string> = {
  free: 'วางตำแหน่งเอง',
  tiled: 'เรียงทั้งภาพ',
};

/* ชื่อมุมทั้ง 9 ของเดิม — เก็บไว้แปลงค่าที่บันทึกไว้ก่อนหน้านี้เท่านั้น
   ไม่ได้ให้เลือกในหน้าจออีกแล้ว */
const LEGACY_XY: Record<string, [number, number]> = {
  'top-left': [0, 0], 'top-center': [50, 0], 'top-right': [100, 0],
  'middle-left': [0, 50], center: [50, 50], 'middle-right': [100, 50],
  'bottom-left': [0, 100], 'bottom-center': [50, 100], 'bottom-right': [100, 100],
};

/** อ่านออกให้คน — "ซ้ายบน" · "กึ่งกลาง" · "78% × 12%" */
export function wmPositionLabel(c: WatermarkConfig): string {
  if (c.anchor === 'tiled') return WM_ANCHOR_LABEL.tiled;
  const h = c.x === 0 ? 'ซ้าย' : c.x === 100 ? 'ขวา' : c.x === 50 ? 'กลาง' : '';
  const v = c.y === 0 ? 'บน' : c.y === 100 ? 'ล่าง' : c.y === 50 ? 'กลาง' : '';
  if (h && v) return h === v ? 'กึ่งกลาง' : `${h}${v}`;
  return `${c.x}% × ${c.y}%`;
}

export type WatermarkConfig = {
  enabled: boolean;
  src: string | null; // media src of the uploaded logo
  /** 'free' = วางตาม x/y · 'tiled' = เรียงเต็มภาพ (ไม่ใช้ x/y) */
  anchor: WmAnchor;
  /** ตำแหน่งแนวนอน 0–100 (% ของที่ว่าง) — ไม่ใช้กับ tiled */
  x: number;
  /** ตำแหน่งแนวตั้ง 0–100 (% ของที่ว่าง) — ไม่ใช้กับ tiled */
  y: number;
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
  anchor: 'free',
  x: 100,
  y: 100,
  scale: 18,
  opacity: 70,
  margin: 3,
};

export const WM_LIMITS = {
  x: { min: 0, max: 100 },
  y: { min: 0, max: 100 },
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
  /* ค่าที่บันทึกไว้ก่อนมีสไลเดอร์เก็บตำแหน่งเป็นชื่อมุม — แปลงเป็น x/y ให้
     ลายน้ำที่ตั้งไว้แล้วอยู่ที่เดิมเป๊ะ ไม่ใช่เด้งไปมุมอื่นตอนอัปเดตระบบ */
  const legacy = typeof o.anchor === 'string' ? LEGACY_XY[o.anchor] : undefined;
  return {
    // a watermark with no image can never be "on" — otherwise the pipeline
    // would report enabled and then silently draw nothing
    enabled: o.enabled === true && !!src,
    src,
    anchor: o.anchor === 'tiled' ? 'tiled' : 'free',
    x: legacy ? legacy[0] : num(o.x, WM_DEFAULTS.x, WM_LIMITS.x.min, WM_LIMITS.x.max),
    y: legacy ? legacy[1] : num(o.y, WM_DEFAULTS.y, WM_LIMITS.y.min, WM_LIMITS.y.max),
    scale: num(o.scale, WM_DEFAULTS.scale, WM_LIMITS.scale.min, WM_LIMITS.scale.max),
    opacity: num(o.opacity, WM_DEFAULTS.opacity, WM_LIMITS.opacity.min, WM_LIMITS.opacity.max),
    margin: num(o.margin, WM_DEFAULTS.margin, WM_LIMITS.margin.min, WM_LIMITS.margin.max),
  };
}

/** Fields that change the rendered pixels — used to decide a version bump. */
export const wmFingerprint = (c: WatermarkConfig) =>
  [c.enabled ? 1 : 0, c.src ?? '', c.anchor, c.x, c.y, c.scale, c.opacity, c.margin].join('|');

/**
 * Where the logo lands, in pixels, for a given image and logo size.
 * Kept pure so the admin preview can position an <img> with the same maths
 * the server uses to composite.
 */
export function wmPlacement(
  imgW: number, imgH: number, logoW: number, logoH: number, c: WatermarkConfig,
): { left: number; top: number } {
  const m = Math.round((c.margin / 100) * imgW);
  /* ที่ว่างที่เลื่อนได้จริง = ภาพ ลบโลโก้ ลบระยะขอบทั้งสองด้าน
     ถ้าโลโก้ใหญ่จนไม่เหลือที่ (spanX ติดลบ) ให้ยึดขอบไว้แทนที่จะหลุดออกนอกภาพ */
  const spanX = Math.max(0, imgW - logoW - m * 2);
  const spanY = Math.max(0, imgH - logoH - m * 2);
  const left = m + Math.round((spanX * c.x) / 100);
  const top = m + Math.round((spanY * c.y) / 100);
  return { left: clamp(left, 0, Math.max(0, imgW - logoW)), top: clamp(top, 0, Math.max(0, imgH - logoH)) };
}
