/* The columns an import file may carry, derived from lib/propertySchema.
 *
 * Derived, not listed: the admin form, the public detail page and the import
 * template all read the same field definitions, so a field added in the Field
 * Builder shows up in the next generated template instead of silently having
 * no way in.
 */
import { PROPERTY_TYPES, type FieldDef, type PropertyType } from '../../src/lib/propertySchema';

/** Fixed columns every file has, before the type's own fields. */
export const FIXED_COLUMNS = [
  { key: 'public_code', label: 'รหัสทรัพย์', note: 'เว้นว่าง = สร้างใหม่ (ระบบออกรหัสให้) · ใส่รหัสเดิม = แก้ไขทรัพย์นั้น' },
  { key: 'title', label: 'ชื่อทรัพย์', note: 'จำเป็น' },
  { key: 'status', label: 'สถานะทรัพย์', note: 'draft | active | hidden — เว้นว่าง = draft' },
  { key: 'listing_status', label: 'สถานะประกาศ', note: 'draft | published | hidden | unavailable | archived — เว้นว่าง = ไม่สร้างประกาศ' },
] as const;

export const LISTING_STATUSES = ['draft', 'published', 'hidden', 'unavailable', 'archived'];
export const PROPERTY_STATUSES = ['draft', 'active', 'hidden'];

/* Kinds a spreadsheet cell cannot express. `summary` is generated, `map`
   carries coordinates we deliberately never publish, `group`/`location` are
   containers whose sub-fields are flattened in below. */
const SKIP_KINDS = new Set(['summary', 'map']);

export type Column = {
  key: string;
  label: string;
  kind: string;
  required: boolean;
  internalOnly: boolean;
  options?: string[];
  unit?: string;
  note?: string;
};

function flatten(f: FieldDef): Column[] {
  if (SKIP_KINDS.has(f.kind)) return [];

  // location/group fields hold their real columns in `sub`
  if ((f.kind === 'location' || f.kind === 'group') && f.sub?.length) {
    return f.sub.map((s) => ({
      key: s.key,
      label: s.label,
      kind: s.kind ?? 'text',
      required: false,
      internalOnly: !!f.internalOnly,
      options: s.options,
      unit: s.unit,
    }));
  }

  return [{
    key: f.key,
    label: f.label,
    kind: f.kind,
    required: !!f.required,
    internalOnly: !!f.internalOnly,
    options: f.options,
    unit: f.unit,
    note: f.note,
  }];
}

/** Every importable column for one property type, de-duplicated by key. */
export function columnsFor(type: PropertyType): Column[] {
  const seen = new Set<string>();
  const out: Column[] = [];
  for (const f of type.fields) {
    for (const c of flatten(f)) {
      if (seen.has(c.key)) continue;
      seen.add(c.key);
      out.push(c);
    }
  }
  return out;
}

export const typeByKey = (key: string) => PROPERTY_TYPES.find((t) => t.key === key);
