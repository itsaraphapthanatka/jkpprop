'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, Dialog, DialogContent, DialogTitle } from '@jkp/ui';

/**
 * Gallery (FE-2 detail) — main image + thumbnail strip; clicking a thumbnail
 * swaps the main image, clicking the main image opens a lightbox (Dialog).
 * Presentational only: alt text is the (already-localized) listing title, so no
 * copy is hardcoded here.
 */
interface GalleryProps {
  images: string[];
  alt: string;
}

export function Gallery({ images, alt }: GalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) return null;

  const safeIndex = Math.min(active, images.length - 1);
  const mainSrc = images[safeIndex] ?? images[0]!;

  return (
    <section aria-label={alt}>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className={cn(
          'group relative block aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-surface-muted',
          'outline-none focus-visible:shadow-focus',
        )}
      >
        <Image
          src={mainSrc}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover transition-transform duration-base ease-standard group-hover:scale-[1.02]"
        />
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => {
            const isActive = i === safeIndex;
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-md border bg-surface-muted',
                  'transition-all duration-fast ease-standard outline-none focus-visible:shadow-focus',
                  isActive
                    ? 'border-brand-600 ring-2 ring-brand-600/40'
                    : 'border-line hover:border-brand-600/60',
                )}
              >
                <Image src={src} alt={alt} fill sizes="80px" className="object-cover" />
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[min(96vw,1100px)] p-0">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-muted">
            <Image src={mainSrc} alt={alt} fill sizes="96vw" className="object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
