import { redirect } from 'next/navigation';

/* Retired in favour of /admin/sections.
 *
 * This screen was ported from the design prototype and kept its own built-in
 * list of sections: five for the home page and two for About, against the
 * nine and six the site actually renders. It loaded the real list from the
 * API on open, but fell back to that stale list in silence when the request
 * failed — and its "เผยแพร่" button deletes any section missing from what it
 * sends. Publishing from a failed load would have removed four home blocks
 * and four About blocks, copy and all, and renamed the team section.
 *
 * Everything it could do, /admin/sections does — plus the repeating lists
 * (team, steps, KPI figures), the per-section field labels and the media
 * picker, none of which this screen knew about. Its one unique feature, the
 * live preview pane, is covered by the "ดูตัวอย่าง" link that opens the real
 * page in the language being edited.
 *
 * A redirect rather than a deletion so old bookmarks and the two links that
 * pointed here still land somewhere useful. PageBuilderBody.tsx is left in
 * the tree unreferenced; delete it once nobody misses the preview pane.
 */
export const metadata = { title: 'Page Builder · JKP CMS', robots: { index: false } };

export default function AdminPageBuilderPage() {
  // temporary, not permanent: a 308 would sit in browser caches for good and
  // make reviving the preview pane here harder than it needs to be
  redirect('/admin/sections');
}
