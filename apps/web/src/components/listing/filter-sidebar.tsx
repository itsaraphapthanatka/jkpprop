'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { Locale } from '@jkp/domain';
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  Label,
  NumberRangeInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  TextInput,
} from '@jkp/ui';
import { useRouter, usePathname } from '@/i18n/navigation';
import { activeFilterCount, hasActiveFilters, serializeFilters } from '@/data/filters';
import { localize, type ListingFilters, type Taxonomy } from '@/data/types';

/** Radix Select forbids an empty item value, so map "no selection" to a sentinel. */
const ANY = '__any__';

interface OptionItem {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  placeholder: string;
  value: string | null;
  options: OptionItem[];
  onSelect: (value: string | null) => void;
  disabled?: boolean;
}

function FilterSelect({ label, placeholder, value, options, onSelect, disabled }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select
        value={value ?? ANY}
        onValueChange={(v) => onSelect(v === ANY ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FilterSidebarProps {
  filters: ListingFilters;
  taxonomy: Taxonomy;
}

/**
 * Public search filters. The query string is the single source of truth: every
 * change serializes the *whole* filter set back to the URL (page reset to 1) and
 * navigates. There is no local result/filter state — the Server Component
 * re-renders from the new query string.
 */
export function FilterSidebar({ filters, taxonomy }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('filters');
  const locale = useLocale() as Locale;

  const update = useCallback(
    (patch: Partial<ListingFilters>) => {
      const qs = serializeFilters({ ...filters, ...patch, page: 1 });
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [filters, pathname, router],
  );

  const clearAll = useCallback(() => router.push(pathname), [pathname, router]);

  const provinceOption =
    taxonomy.provinces.find((p) => p.value === filters.province) ?? null;
  const districtOption =
    provinceOption?.districts.find((d) => d.value === filters.district) ?? null;

  const toOptions = (items: { value: string; label: Parameters<typeof localize>[0] }[]): OptionItem[] =>
    items.map((o) => ({ value: o.value, label: localize(o.label, locale) }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content-primary">{t('title')}</h2>
        {hasActiveFilters(filters) && (
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={clearAll}>
            {t('clearAll')}
          </Button>
        )}
      </div>

      <FilterSelect
        label={t('type')}
        placeholder={t('any')}
        value={filters.propertyType}
        options={toOptions(taxonomy.propertyTypes)}
        onSelect={(v) => update({ propertyType: (v as ListingFilters['propertyType']) ?? null })}
      />

      <FilterSelect
        label={t('transaction')}
        placeholder={t('any')}
        value={filters.transactionType}
        options={[
          { value: 'rent', label: t('rent') },
          { value: 'sale', label: t('sale') },
        ]}
        onSelect={(v) => update({ transactionType: (v as ListingFilters['transactionType']) ?? null })}
      />

      <FilterSelect
        label={t('province')}
        placeholder={t('any')}
        value={filters.province}
        options={toOptions(taxonomy.provinces)}
        onSelect={(v) => update({ province: v, district: null, subdistrict: null })}
      />

      <FilterSelect
        label={t('district')}
        placeholder={t('any')}
        value={filters.district}
        options={toOptions(provinceOption?.districts ?? [])}
        disabled={!filters.province}
        onSelect={(v) => update({ district: v, subdistrict: null })}
      />

      <FilterSelect
        label={t('subdistrict')}
        placeholder={t('any')}
        value={filters.subdistrict}
        options={toOptions(districtOption?.subdistricts ?? [])}
        disabled={!filters.district}
        onSelect={(v) => update({ subdistrict: v })}
      />

      <FilterSelect
        label={t('estate')}
        placeholder={t('any')}
        value={filters.estate}
        options={toOptions(taxonomy.estates)}
        onSelect={(v) => update({ estate: v })}
      />

      <FilterSelect
        label={t('zone')}
        placeholder={t('any')}
        value={filters.zoneType}
        options={toOptions(taxonomy.zoneTypes)}
        onSelect={(v) => update({ zoneType: (v as ListingFilters['zoneType']) ?? null })}
      />

      <NumberRangeInput
        label={t('size')}
        minValue={filters.sizeMin}
        maxValue={filters.sizeMax}
        placeholderMin={t('min')}
        placeholderMax={t('max')}
        onChange={({ min, max }) => update({ sizeMin: min, sizeMax: max })}
      />

      <NumberRangeInput
        label={t('rentBudget')}
        minValue={filters.rentMin}
        maxValue={filters.rentMax}
        placeholderMin={t('min')}
        placeholderMax={t('max')}
        onChange={({ min, max }) => update({ rentMin: min, rentMax: max })}
      />

      <NumberRangeInput
        label={t('saleBudget')}
        minValue={filters.saleMin}
        maxValue={filters.saleMax}
        placeholderMin={t('min')}
        placeholderMax={t('max')}
        onChange={({ min, max }) => update({ saleMin: min, saleMax: max })}
      />

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="filter-license">{t('license')}</Label>
        <Switch
          id="filter-license"
          checked={filters.factoryLicense}
          onCheckedChange={(v) => update({ factoryLicense: v })}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="filter-featured">{t('featured')}</Label>
        <Switch
          id="filter-featured"
          checked={filters.featured}
          onCheckedChange={(v) => update({ featured: v })}
        />
      </div>

      <TextInput
        label={t('keyword')}
        placeholder={t('keywordPlaceholder')}
        value={filters.q ?? ''}
        onChange={(e) => update({ q: e.target.value.trim() === '' ? null : e.target.value })}
        leadingIcon={<Search className="size-4" strokeWidth={1.7} aria-hidden />}
      />
    </div>
  );
}

/**
 * Mobile entry point: a "Filters (N)" button that opens the same sidebar inside
 * a bottom drawer. Hidden on lg+ where the sidebar is shown inline.
 */
export function MobileFilterDrawer({ filters, taxonomy }: FilterSidebarProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('filters');
  const count = activeFilterCount(filters);

  return (
    <div className="lg:hidden">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button type="button" variant="outline" size="md">
            <SlidersHorizontal className="size-4" strokeWidth={1.7} aria-hidden />
            {count > 0 ? `${t('open')} (${count})` : t('open')}
          </Button>
        </DrawerTrigger>
        <DrawerContent side="bottom" className="overflow-y-auto">
          <DrawerTitle className="sr-only">{t('title')}</DrawerTitle>
          <div className="overflow-y-auto pb-2">
            <FilterSidebar filters={filters} taxonomy={taxonomy} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
