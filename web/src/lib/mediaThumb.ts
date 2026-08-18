/* A thumbnail, not the 1600px original. /admin/media used to pull 114 MB of
   full-size photos to fill a grid of small boxes. */
export const thumb = (src: string, w: 160 | 320 | 640 = 320) =>
  src.startsWith('/api/media/') && src.includes('/raw')
    ? `${src}${src.includes('?') ? '&' : '?'}w=${w}`
    : src;
