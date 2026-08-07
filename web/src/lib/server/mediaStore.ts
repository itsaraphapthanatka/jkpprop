/* Disk storage for media assets — files live in web/uploads/ (outside
   public/ so production builds serve them through the raw route, not a
   build-time snapshot). */
import { mkdir } from 'fs/promises';
import path from 'path';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // "สูงสุด 10MB ต่อไฟล์" (Media UI)

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export const diskPathFor = (id: string, mime: string) =>
  path.join(UPLOAD_DIR, `${id}.${EXT_BY_MIME[mime] ?? 'bin'}`);
