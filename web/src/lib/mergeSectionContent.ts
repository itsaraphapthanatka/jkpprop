/* Merging one page-section's multilingual content, kept apart from the route
   so it can be unit-tested without dragging Prisma in. */

export type SectionItem = { title?: string; desc?: string; role?: string; img?: string };
export type SectionBlock = {
  eyebrow?: string; headline?: string; sub?: string; cta?: string; note?: string;
  items?: SectionItem[];
};
export type SectionContent = Record<string, SectionBlock>;

/* Merge per locale rather than replacing the whole JSON.
 *
 * The Page Builder screen only ever sends the language it is editing, with a
 * comment claiming "the other two keep whatever is stored" — which was never
 * true against a straight overwrite: publishing there erased the English and
 * Chinese copy someone had entered in /admin/sections. Merging makes that
 * comment true, and also stops a screen that knows nothing about `items` from
 * deleting the team roster.
 *
 * A field can still be cleared, because an empty string is sent and stored as
 * an empty string. Only dropping an entire locale is no longer expressible,
 * and nothing in the product asks for that.
 *
 * `items` is a list, so it replaces wholesale instead of merging — otherwise a
 * row deleted in the editor would come back on the next save. */
export function mergeSectionContent(stored: SectionContent, incoming: SectionContent): SectionContent {
  const out: SectionContent = { ...stored };
  for (const [locale, block] of Object.entries(incoming ?? {})) {
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue;
    out[locale] = { ...(stored[locale] ?? {}), ...block };
  }
  return out;
}
