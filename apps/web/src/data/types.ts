import type {
  Locale,
  MapVisibilityLevel,
  PropertyType,
  TransactionType,
  ZoneType,
} from '@jkp/domain';

/** A string translated into all supported locales. */
export interface LocalizedText {
  th: string;
  en: string;
  zh: string;
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.th;
}

/** Card-level projection of a listing (search grid, rails, related). */
export interface ListingSummary {
  id: string;
  publicCode: string;
  slug: string;
  title: LocalizedText;
  propertyType: PropertyType;
  transactionType: TransactionType;
  rentPrice: number | null; // THB per month
  salePrice: number | null; // THB
  usableAreaSqm: number; // primary public area metric
  landAreaSqm: number | null;
  province: LocalizedText;
  /** Public-safe location summary (respects mapVisibility). */
  locationLabel: LocalizedText;
  provinceSlug: string;
  zoneType: ZoneType | null;
  estate: LocalizedText | null;
  featured: boolean;
  available: boolean;
  coverImage: string;
  photoCount: number;
  updatedAt: string; // ISO 8601
  mapVisibility: MapVisibilityLevel;
}

export interface ListingSpecs {
  landAreaSqm: number | null;
  builtUpAreaSqm: number | null;
  usableAreaSqm: number;
  officeAreaSqm: number | null;
  clearHeightM: number | null;
  floorLoadingTonPerSqm: number | null;
  powerKva: number | null;
}

/** Area-level circle shown on the map when exact coords are not public. */
export interface AreaCircle {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

/** Full detail projection of a listing. */
export interface ListingDetail extends ListingSummary {
  description: LocalizedText;
  gallery: string[];
  specs: ListingSpecs;
  /** i18n keys under the `features` namespace. */
  features: string[];
  factoryLicensePossible: boolean;
  availabilityNote: LocalizedText | null;
  /** Only present when mapVisibility === 'exact'. Never sent otherwise (FR-LST-02). */
  latitude: number | null;
  longitude: number | null;
  /** Present when mapVisibility !== 'exact'. */
  areaCircle: AreaCircle | null;
  district: LocalizedText | null;
  subdistrict: LocalizedText | null;
  relatedIds: string[];
}

export type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc';

export const SORT_KEYS: SortKey[] = ['newest', 'price_asc', 'price_desc', 'size_asc', 'size_desc'];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Parsed, validated search state — the query string is the source of truth. */
export interface ListingFilters {
  propertyType: PropertyType | null;
  transactionType: Exclude<TransactionType, 'both'> | null; // user picks rent|sale; 'both' matches both
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  estate: string | null;
  zoneType: ZoneType | null;
  sizeMin: number | null;
  sizeMax: number | null;
  rentMin: number | null;
  rentMax: number | null;
  saleMin: number | null;
  saleMax: number | null;
  factoryLicense: boolean;
  featured: boolean;
  q: string | null;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export interface SearchResult {
  items: ListingSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ---- Taxonomy (filter options + landing labels) ---- */
export interface TaxOption<V extends string = string> {
  value: V;
  label: LocalizedText;
}

export interface SubdistrictOption extends TaxOption {}
export interface DistrictOption extends TaxOption {
  subdistricts: SubdistrictOption[];
}
export interface ProvinceOption extends TaxOption {
  districts: DistrictOption[];
}

export interface Taxonomy {
  propertyTypes: TaxOption<PropertyType>[];
  zoneTypes: TaxOption<ZoneType>[];
  provinces: ProvinceOption[];
  estates: TaxOption[];
}
