/* GET /api/media/:id/raw — the file the website shows.

   FR-ADM-09: this always returns the watermarked derivative. The untouched
   original is reachable only with ?original=1 by a signed-in user, so a
   public URL can never expose it.

   FR-ADM-09b: on top of the upload-time text stamp, the org's uploaded logo
   is composited here using the current /admin/branding setting. Doing it on
   read (rather than baking it at upload) is what lets an admin move the logo
   and have every existing photo follow. The result is cached under a key
   carrying the settings version, so it is composited once per version, and
   public URLs carry ?v= so browser caches turn over too. */
import { handler, ApiError } from '@/lib/server/api';
import { currentUser, SESSION_COOKIE } from '@/lib/server/auth';
import { cookies } from 'next/headers';
import { db } from '@/lib/server/db';
import { getObject, putObject, originalKey, watermarkedKey, thumbKey, isThumbWidth, mediaIdFromSrc } from '@/lib/server/mediaStore';
import { applyImageWatermark, canWatermark } from '@/lib/server/watermark';
import { normalizeWatermark, type WatermarkConfig } from '@/lib/watermarkConfig';

export const runtime = 'nodejs';

type Wm = { cfg: WatermarkConfig; version: number };

/* หน้าเดียวขอรูปหลายสิบใบ ส่วนคำตอบของสองอย่างข้างล่างเปลี่ยนก็ต่อเมื่อมีคน
   ไปแก้หน้า Branding หรือแนบรูปเข้า/ออกจากประกาศ ซึ่งช้ากว่านั้นมาก จึงจำไว้
   สั้น ๆ แทนที่จะถามฐานข้อมูลใหม่ทุกใบ · ผลข้างเคียงคือแก้ตั้งค่าลายน้ำแล้ว
   อาจใช้เวลาถึงหนึ่งนาทีจึงเห็นผล (แต่ URL เปลี่ยนตาม wmVersion ทันทีอยู่แล้ว) */
const MEMO_TTL_MS = 60_000;
const wmMemo = new Map<string, { at: number; wm: Wm | null }>();

/* ลูกค้าแจ้งเพิ่มว่า "ลายน้ำแสดงแค่รูปทรัพย์ ที่หน้าบ้าน" — คนในทีมที่เปิดหลังบ้าน
   ดูรูปเพื่อทำงาน (ตรวจรูป เลือกรูปลง Shortlist คัดรูปไปโพสต์) ควรเห็นรูปจริง
   ไม่ใช่รูปที่มีโลโก้บังอยู่ · ตัดสินจาก "มีเซสชันที่ใช้ได้จริงไหม" ไม่ใช่แค่มีคุกกี้
   ติดมา ไม่งั้นใครก็ตั้งคุกกี้มั่ว ๆ แล้วได้รูปสะอาดไป
   ยกเว้น ?wm=1 ที่บังคับให้ปั๊ม — ZIP ในหน้า Social Status ใช้ตัวนี้ เพราะรูปที่
   โหลดออกไปลงโซเชียลต้องมีลายน้ำ แม้คนกดจะเป็นคนในทีม */
const sessionMemo = new Map<string, { at: number; ok: boolean }>();

async function hasLiveSession(): Promise<boolean> {
  /* ไม่มีคุกกี้ = คนนอกแน่นอน ตอบได้เลยโดยไม่ต้องแตะฐานข้อมูล ซึ่งเป็นเส้นทาง
     ของคำขอเกือบทั้งหมด (คนเข้าเว็บทั่วไป) */
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const hit = sessionMemo.get(token);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.ok;
  /* currentUser() เช็คครบทั้งวันหมดอายุ บัญชีที่ถูกปิด และ co_agent ที่หมดอายุ
     — เขียนเช็คเองซ้ำแล้วจะพลาดข้อใดข้อหนึ่งเมื่อกติกาเปลี่ยน */
  const ok = !!(await currentUser());
  sessionMemo.set(token, { at: Date.now(), ok });
  return ok;
}

async function watermarkFor(orgId: string): Promise<Wm | null> {
  const hit = wmMemo.get(orgId);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.wm;
  const wm = await loadWatermark(orgId);
  wmMemo.set(orgId, { at: Date.now(), wm });
  return wm;
}

async function loadWatermark(orgId: string): Promise<Wm | null> {
  const b = await db.branding.findUnique({ where: { orgId } });
  if (!b || !b.wmEnabled || !b.wmSrc) return null;
  const cfg = normalizeWatermark({
    enabled: b.wmEnabled, src: b.wmSrc, anchor: b.wmAnchor,
    scale: b.wmScale, opacity: b.wmOpacity, margin: b.wmMargin,
  });
  return cfg.enabled ? { cfg, version: b.wmVersion } : null;
}

/* ลูกค้าแจ้งว่า "ลายน้ำขึ้นเฉพาะ Listing และ download ในหน้า Social Status
   เท่านั้น ภาพอื่นบนเว็บไซต์ ไม่ต้องโชว์"

   เดิมปั๊มลายน้ำให้ทุกไฟล์ที่เสิร์ฟออกหน้าเว็บ รูปหน้าปกของ "คำถามพบบ่อย"
   "เกี่ยวกับเรา" รูปทีมงาน และรูปออฟฟิศจึงโดนปั๊มไปด้วย ทั้งที่ไม่ใช่รูปทรัพย์
   ที่ต้องกันคนเอาไปใช้ต่อ · ตอนนี้ปั๊มเฉพาะรูปที่ถูกอ้างถึงใน values.photos
   ของประกาศ ส่วน ZIP ในหน้า Social Status ดึงจาก URL เดียวกันนี้ ลายน้ำจึง
   ยังติดไปด้วยตามที่ต้องการ

   จำผลไว้ในหน่วยความจำสั้น ๆ เพราะหน้าเดียวขอรูปหลายสิบใบ และคำตอบเปลี่ยน
   ก็ต่อเมื่อมีคนแนบรูปเข้า/ออกจากประกาศ ซึ่งช้ากว่านั้นมาก */
const listingPhotoMemo = new Map<string, { at: number; is: boolean }>();

async function isListingPhoto(orgId: string, assetId: string): Promise<boolean> {
  const hit = listingPhotoMemo.get(assetId);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.is;
  const n = await db.property.count({
    where: { orgId, values: { path: ['photos'], array_contains: `/api/media/${assetId}/raw` } },
  });
  const is = n > 0;
  listingPhotoMemo.set(assetId, { at: Date.now(), is });
  return is;
}

/** The logo's own bytes, from the media asset its src points at. */
async function logoBytes(src: string): Promise<Buffer | null> {
  const id = mediaIdFromSrc(src);
  if (!id) return null;
  const asset = await db.mediaAsset.findUnique({ where: { id }, select: { id: true, mime: true } });
  if (!asset) return null;
  // the logo's own untouched upload, so a text stamp never rides along
  return (await getObject(asset.id, asset.mime, originalKey(asset.id, asset.mime)))
    ?? (await getObject(asset.id, asset.mime));
}

export const GET = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  const wantsOriginal = new URL(req.url).searchParams.get('original') === '1';
  const versioned = !!new URL(req.url).searchParams.get('v');
  if (wantsOriginal && !(await currentUser())) {
    throw new ApiError('UNAUTHENTICATED', 'ต้องเข้าสู่ระบบเพื่อดูไฟล์ต้นฉบับ', 401);
  }

  const key = wantsOriginal ? originalKey(asset.id, asset.mime) : undefined;
  // assets uploaded before watermarking existed only have the public object
  let buf = (await getObject(asset.id, asset.mime, key)) ?? (wantsOriginal ? await getObject(asset.id, asset.mime) : null);
  if (!buf) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  /* the logo stamp applies to the public copy only — never to an admin download,
     never to the logo asset itself (that would stamp the watermark on itself),
     and only to รูปของประกาศ (ดู isListingPhoto ข้างบน) */
  const forceWm = new URL(req.url).searchParams.get('wm') === '1';
  /* คำนวณแยกไว้ เพราะต้องใช้ตอนตั้ง Cache-Control ด้วย: คำตอบของ URL เดียวกัน
     ต่างกันตามว่าคนขอเข้าสู่ระบบอยู่หรือไม่ ถ้าปล่อยให้เป็น public แคชที่อยู่
     ตรงกลาง (nginx / CDN) จะเก็บรูปสะอาดของคนในทีมไปแจกให้คนนอกได้ */
  const signedIn = !wantsOriginal && !forceWm && await hasLiveSession();
  const stampable = !wantsOriginal && !signedIn && canWatermark(asset.mime)
    && await isListingPhoto(asset.orgId, asset.id);
  if (stampable) {
    const wm = await watermarkFor(asset.orgId);
    if (wm && mediaIdFromSrc(wm.cfg.src ?? '') !== asset.id) {
      const cacheKey = watermarkedKey(asset.id, asset.mime, wm.version);
      const cached = await getObject(asset.id, asset.mime, cacheKey);
      if (cached) {
        buf = cached;
      } else {
        const logo = await logoBytes(wm.cfg.src as string);
        if (logo) {
          const stamped = await applyImageWatermark(buf, asset.mime, logo, wm.cfg);
          if (!stamped.equals(buf)) {
            buf = stamped;
            // best-effort cache — a storage hiccup must not fail the request
            await putObject(asset.id, asset.mime, stamped, cacheKey).catch(() => {});
          }
        }
      }
    }
  }

  /* A grid of 150px boxes was being filled with 1600px originals: opening
     /admin/media pulled 412 photos, 114 MB, twenty-six seconds. ?w= serves a
     resized copy of the same (watermarked) image, cached like the rest. */
  const wanted = Number(new URL(req.url).searchParams.get('w') ?? 0);
  if (!wantsOriginal && wanted && isThumbWidth(wanted) && canWatermark(asset.mime)) {
    /* รูปที่ไม่ใช่ของประกาศไม่มีลายน้ำ ต้องเก็บ cache คนละคีย์กัน ไม่งั้นรูปที่
       เคยปั๊มไว้ตอนก่อนหน้านี้จะถูกเสิร์ฟกลับมาเป็นตัวย่อ */
    const wm = stampable ? await watermarkFor(asset.orgId) : null;
    const key = thumbKey(asset.id, asset.mime, wanted, wm?.version ?? 0);
    const cached = await getObject(asset.id, asset.mime, key);
    if (cached) {
      buf = cached;
    } else {
      const sharp = (await import('sharp')).default;
      // withoutEnlargement: a small upload stays its own size rather than
      // being blown up into a bigger file than the original
      const small = await sharp(buf).resize({ width: wanted, withoutEnlargement: true })
        .jpeg({ quality: 72 }).toBuffer().catch(() => null);
      if (small) {
        buf = small;
        await putObject(asset.id, asset.mime, small, key).catch(() => {});
      }
    }
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(buf.length),
        /* ตัวย่อของคนที่เข้าสู่ระบบไม่มีลายน้ำ ห้ามให้แคชกลางเก็บไปแจกต่อ */
        'Cache-Control': signedIn ? 'private, max-age=300' : 'public, max-age=31536000, immutable',
      },
    });
  }

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(buf.length),
      /* the original is per-user, so it must never land in a shared cache.
         public bytes are immutable *for a given ?v=* — the DTOs append the
         watermark version, so a settings change hands out a fresh URL.
         URL ที่ไม่มี ?v= (รูปหน้าเว็บทั่วไป เช่น หน้าปกของ "เกี่ยวกับเรา") ไม่มี
         ทางบอกเบราว์เซอร์ให้ทิ้งของเก่าได้เลยถ้าสัญญาว่า immutable ไว้หนึ่งปี —
         ซึ่งเป็นเหตุผลที่การเลิกปั๊มลายน้ำรูปพวกนี้ไม่มีผลกับคนที่เคยเปิดหน้าไว้
         จึงให้ไปถามเซิร์ฟเวอร์ก่อนทุกครั้งแทน */
      'Cache-Control': wantsOriginal
        ? 'private, no-store'
        : signedIn ? 'private, max-age=300'
          : versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=300, must-revalidate',
    },
  });
});
