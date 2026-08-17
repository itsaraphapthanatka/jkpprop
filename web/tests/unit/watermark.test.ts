/* The watermark the public sees: where the logo lands, how the setting is
   normalised, and that compositing actually changes the served pixels. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  normalizeWatermark, wmPlacement, wmFingerprint, WM_DEFAULTS, WM_ANCHORS,
  type WatermarkConfig,
} from '../../src/lib/watermarkConfig.ts';
import { applyImageWatermark } from '../../src/lib/server/watermark.ts';

const cfg = (o: Partial<WatermarkConfig> = {}): WatermarkConfig =>
  ({ ...WM_DEFAULTS, enabled: true, src: '/api/media/logo/raw', ...o });

const photo = (w = 400, h = 300) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#808080' } }).jpeg().toBuffer();
const logo = (w = 80, h = 40) =>
  sharp({ create: { width: w, height: h, channels: 4, background: '#ff0000' } }).png().toBuffer();

describe('watermark settings', () => {
  test('a config with no image can never be enabled', () => {
    // otherwise the pipeline reports "on" and then draws nothing
    assert.equal(normalizeWatermark({ enabled: true, src: null }).enabled, false);
    assert.equal(normalizeWatermark({ enabled: true, src: '   ' }).enabled, false);
    assert.equal(normalizeWatermark({ enabled: true, src: '/x' }).enabled, true);
  });

  test('junk falls back to the defaults instead of throwing', () => {
    for (const junk of [null, undefined, 'nope', 42, [], { anchor: 'sideways' }]) {
      const c = normalizeWatermark(junk);
      assert.equal(c.anchor, WM_DEFAULTS.anchor);
      assert.equal(c.enabled, false);
    }
  });

  test('numbers are clamped, not trusted', () => {
    const c = normalizeWatermark({ src: '/x', enabled: true, scale: 999, opacity: -5, margin: 80 });
    assert.equal(c.scale, 60);
    assert.equal(c.opacity, 10);
    assert.equal(c.margin, 20);
  });

  test('fingerprint changes when any rendered property changes', () => {
    const base = cfg();
    assert.equal(wmFingerprint(base), wmFingerprint(cfg()));
    for (const patch of [{ anchor: 'center' as const }, { scale: 30 }, { opacity: 50 }, { margin: 9 }, { enabled: false }]) {
      assert.notEqual(wmFingerprint(base), wmFingerprint(cfg(patch)), JSON.stringify(patch));
    }
  });
});

describe('placement', () => {
  const W = 1000, H = 500, LW = 100, LH = 50;

  test('each corner sits against its own edge, inset by the margin', () => {
    const m = 100; // margin 10% of 1000
    assert.deepEqual(wmPlacement(W, H, LW, LH, cfg({ anchor: 'top-left', margin: 10 })), { left: m, top: m });
    assert.deepEqual(wmPlacement(W, H, LW, LH, cfg({ anchor: 'top-right', margin: 10 })), { left: W - LW - m, top: m });
    assert.deepEqual(wmPlacement(W, H, LW, LH, cfg({ anchor: 'bottom-left', margin: 10 })), { left: m, top: H - LH - m });
    assert.deepEqual(wmPlacement(W, H, LW, LH, cfg({ anchor: 'bottom-right', margin: 10 })), { left: W - LW - m, top: H - LH - m });
  });

  test('centre ignores the margin on the centred axis', () => {
    assert.deepEqual(wmPlacement(W, H, LW, LH, cfg({ anchor: 'center', margin: 10 })), { left: 450, top: 225 });
    assert.deepEqual(wmPlacement(W, H, LW, LH, cfg({ anchor: 'top-center', margin: 10 })), { left: 450, top: 100 });
    assert.deepEqual(wmPlacement(W, H, LW, LH, cfg({ anchor: 'middle-left', margin: 10 })), { left: 100, top: 225 });
  });

  test('never places the logo outside the photo, however big the margin', () => {
    for (const anchor of WM_ANCHORS) {
      const { left, top } = wmPlacement(200, 120, 180, 100, cfg({ anchor, margin: 20 }));
      assert.ok(left >= 0 && left + 180 <= 200, `${anchor} left=${left}`);
      assert.ok(top >= 0 && top + 100 <= 120, `${anchor} top=${top}`);
    }
  });
});

describe('compositing', () => {
  test('an enabled watermark changes the served bytes', async () => {
    const [p, l] = [await photo(), await logo()];
    const out = await applyImageWatermark(p, 'image/jpeg', l, cfg());
    assert.notEqual(out.length, p.length);
    assert.ok(!out.equals(p));
  });

  test('a disabled watermark returns the photo untouched', async () => {
    const [p, l] = [await photo(), await logo()];
    assert.ok((await applyImageWatermark(p, 'image/jpeg', l, cfg({ enabled: false }))).equals(p));
  });

  test('non-raster files pass through — a PDF must never be re-encoded', async () => {
    const pdf = Buffer.from('%PDF-1.4 not really');
    assert.ok((await applyImageWatermark(pdf, 'application/pdf', await logo(), cfg())).equals(pdf));
  });

  test('a corrupt logo costs the photo nothing', async () => {
    const p = await photo();
    const out = await applyImageWatermark(p, 'image/jpeg', Buffer.from('not an image'), cfg());
    assert.ok(out.equals(p));
  });

  test('output keeps the photo dimensions and format for every anchor', async () => {
    const [p, l] = [await photo(640, 480), await logo()];
    for (const anchor of WM_ANCHORS) {
      const meta = await sharp(await applyImageWatermark(p, 'image/jpeg', l, cfg({ anchor }))).metadata();
      assert.equal(meta.width, 640, anchor);
      assert.equal(meta.height, 480, anchor);
      assert.equal(meta.format, 'jpeg', anchor);
    }
  });

  test('png keeps its alpha channel instead of being flattened to jpeg', async () => {
    const p = await sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    const meta = await sharp(await applyImageWatermark(p, 'image/png', await logo(), cfg())).metadata();
    assert.equal(meta.format, 'png');
    assert.equal(meta.hasAlpha, true);
  });

  test('a logo wider than the photo leaves the photo alone', async () => {
    const p = await photo(100, 100);
    // scale 60% of 100px = 60px wide, but the source logo is 4000px tall → resize keeps ratio
    const tall = await sharp({ create: { width: 10, height: 4000, channels: 4, background: '#00f' } }).png().toBuffer();
    const out = await applyImageWatermark(p, 'image/jpeg', tall, cfg({ scale: 60 }));
    assert.ok(out.equals(p));
  });

  test('opacity is honoured — 100% differs from 20%', async () => {
    const [p, l] = [await photo(), await logo()];
    const solid = await applyImageWatermark(p, 'image/jpeg', l, cfg({ opacity: 100 }));
    const faint = await applyImageWatermark(p, 'image/jpeg', l, cfg({ opacity: 20 }));
    assert.ok(!solid.equals(faint));
  });

  test('tiled covers more of the photo than a single corner mark', async () => {
    const [p, l] = [await photo(600, 600), await logo(60, 60)];
    const corner = await sharp(await applyImageWatermark(p, 'image/jpeg', l, cfg({ anchor: 'bottom-right' }))).stats();
    const tiled = await sharp(await applyImageWatermark(p, 'image/jpeg', l, cfg({ anchor: 'tiled' }))).stats();
    // the red logo lifts the mean of the red channel; tiling lifts it further
    assert.ok(tiled.channels[0].mean > corner.channels[0].mean, `${tiled.channels[0].mean} vs ${corner.channels[0].mean}`);
  });
});
