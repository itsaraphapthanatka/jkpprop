'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Heart, MapPin, Star } from 'lucide-react';
import { Badge, cn } from '@jkp/ui';
import { formatArea, type Locale } from '@jkp/domain';
import { Link } from '@/i18n/navigation';
import { localize, type ListingSummary } from '@/data/types';
import { PriceDisplay } from './price-display';
import { CompareCheckbox } from './compare';

interface ListingCardProps {
  listing: ListingSummary;
  context?: 'rent' | 'sale' | null;
  showCompare?: boolean;
  className?: string;
}

export function ListingCard({ listing, context = null, showCompare = false, className }: ListingCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('card');
  const tc = useTranslations('common');
  const [fav, setFav] = useState(false);

  const title = localize(listing.title, locale);
  const location = localize(listing.locationLabel, locale);
  const txnLabel =
    listing.transactionType === 'rent'
      ? t('forRent')
      : listing.transactionType === 'sale'
        ? t('forSale')
        : t('forBoth');

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border-card border-line bg-surface-card shadow-sm',
        'transition-all duration-base ease-standard hover:-translate-y-0.5 hover:shadow-md',
        'focus-within:shadow-focus',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        <Image
          src={listing.coverImage}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge variant="brand">{txnLabel}</Badge>
          {listing.featured && (
            <Badge variant="gold">
              <Star className="size-3" strokeWidth={1.7} fill="currentColor" aria-hidden />
            </Badge>
          )}
        </div>
        <button
          type="button"
          aria-label={t('favorite')}
          aria-pressed={fav}
          onClick={() => setFav((v) => !v)}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-surface-card/90 text-content-secondary backdrop-blur transition-colors hover:text-danger focus-visible:shadow-focus"
        >
          <Heart className={cn('size-5', fav && 'fill-danger text-danger')} strokeWidth={1.7} />
        </button>
        {!listing.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-surface-card px-3 py-1 text-sm font-semibold text-content-primary">
              {t('unavailable')}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-mono text-xs text-content-muted">{listing.publicCode}</span>
        <Link
          href={`/listing/${listing.slug}`}
          className="line-clamp-2 font-semibold text-content-primary transition-colors hover:text-accent focus-visible:shadow-focus"
        >
          {title}
        </Link>
        <p className="flex items-center gap-1 text-sm text-content-secondary">
          <MapPin className="size-4 shrink-0 text-content-muted" strokeWidth={1.7} />
          <span className="line-clamp-1">{location}</span>
        </p>

        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-content-secondary">
          <div className="flex gap-1">
            <dt className="text-content-muted">{t('usableArea')}:</dt>
            <dd className="font-medium text-content-primary">
              {formatArea(listing.usableAreaSqm, locale)} {t('sqm')}
            </dd>
          </div>
          {listing.landAreaSqm != null && (
            <div className="flex gap-1">
              <dt className="text-content-muted">{t('landArea')}:</dt>
              <dd className="font-medium text-content-primary">
                {formatArea(listing.landAreaSqm, locale)} {t('sqm')}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-auto pt-2">
          <PriceDisplay
            rentPrice={listing.rentPrice}
            salePrice={listing.salePrice}
            transactionType={listing.transactionType}
            context={context}
            size="md"
          />
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-line-subtle pt-3">
          {showCompare ? <CompareCheckbox id={listing.id} /> : <span />}
          <Link
            href={`/listing/${listing.slug}`}
            className="inline-flex items-center gap-1 rounded-full border border-brand-600 px-4 py-1.5 text-sm font-semibold text-brand-600 transition-all hover:-translate-y-0.5 hover:bg-brand-50 focus-visible:shadow-focus"
          >
            {tc('viewDetails')}
            <ArrowRight className="size-4" strokeWidth={1.7} />
          </Link>
        </div>
      </div>
    </article>
  );
}
