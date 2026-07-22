'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatMoney, type Locale, type TransactionType } from '@jkp/domain';
import { cn } from '@jkp/ui';

interface PriceDisplayProps {
  rentPrice: number | null;
  salePrice: number | null;
  transactionType: TransactionType;
  /** Active search context — emphasises the matching price for `both` listings. */
  context?: 'rent' | 'sale' | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PRIMARY_SIZE = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' } as const;

export function PriceDisplay({
  rentPrice,
  salePrice,
  transactionType,
  context = null,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('price');

  const rent = formatMoney(rentPrice, { locale });
  const sale = formatMoney(salePrice, { locale });

  const showRent =
    transactionType === 'rent' ||
    transactionType === 'both' ||
    context === 'rent';
  const showSale =
    transactionType === 'sale' ||
    transactionType === 'both' ||
    context === 'sale';

  // Which price leads: honour the search context first, else the listing's own type.
  const rentLeads = context === 'rent' || (context !== 'sale' && transactionType !== 'sale');

  const Rent = (
    <span className="font-mono font-extrabold text-accent">
      {rent ?? t('contact')}
      {rent && <span className="ml-0.5 text-sm font-semibold text-content-muted">{t('perMonth')}</span>}
    </span>
  );
  const Sale = (
    <span className="font-mono font-extrabold text-accent">{sale ?? t('contact')}</span>
  );

  const primaryClass = cn(PRIMARY_SIZE[size]);
  const secondaryClass = 'text-sm text-content-secondary';

  if (transactionType === 'both' && showRent && showSale) {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <div className={primaryClass}>{rentLeads ? Rent : Sale}</div>
        <div className={secondaryClass}>
          <span className="text-content-muted">{rentLeads ? t('saleLabel') : t('rentLabel')}: </span>
          {rentLeads ? Sale : Rent}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(primaryClass, className)}>{showSale && !showRent ? Sale : Rent}</div>
  );
}
