import { Map as MapIcon, MapPin } from 'lucide-react';
import type { MapVisibilityLevel } from '@jkp/domain';
import { cn } from '@jkp/ui';

interface MapCardProps {
  locationLabel: string;
  /** Already-translated privacy note (passed from a server component). */
  note: string;
  mapVisibility: MapVisibilityLevel;
  className?: string;
}

/**
 * Location display governed by `map_visibility_level` (FR-LST-02). Pure/presentational
 * (server-rendered → location text is in the first HTML for SEO). When visibility is
 * not `exact`, shows an area circle and NO pin — and the data layer never sent real
 * coordinates. Swap the placeholder for a real map embed later (exact → pin;
 * area → circle overlay only).
 */
export function MapCard({ locationLabel, note, mapVisibility, className }: MapCardProps) {
  const exact = mapVisibility === 'exact';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-line bg-surface-muted">
        {/* subtle grid backdrop */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        {!exact && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="size-40 rounded-full border-2 border-dashed border-brand-600/40 bg-brand-600/10" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-content-secondary">
          {exact ? (
            <MapPin className="size-8 text-brand-600" strokeWidth={1.7} />
          ) : (
            <MapIcon className="size-8" strokeWidth={1.7} />
          )}
          <span className="px-4 text-center text-sm font-medium text-content-primary">
            {locationLabel}
          </span>
        </div>
      </div>
      <p className="text-sm text-content-muted">{note}</p>
    </div>
  );
}
