/* Where a pop-up menu goes on screen.
 *
 * Admin menus are `position: fixed` rather than absolute, because every one of
 * them opens inside something that clips: the properties table sits in a card
 * with `overflow: hidden` around a horizontally scrolling div, so an absolutely
 * positioned menu lost its last item behind the card edge. Fixed positioning
 * escapes the clip but needs the coordinates worked out by hand — that is this.
 */
export type MenuBox = { top: number; left: number; width: number; maxHeight: number };

export type PlaceOpts = {
  /** fixed menu width; defaults to the trigger's width, floored at minWidth */
  width?: number;
  minWidth?: number;
  /** how tall the menu is allowed to get before it scrolls */
  maxHeight?: number;
  /** which edge of the menu lines up with the same edge of the trigger */
  align?: 'left' | 'right';
};

export function placeMenu(r: DOMRect, opts: PlaceOpts = {}): MenuBox {
  const { minWidth = 240, maxHeight: cap = 300, align = 'left' } = opts;
  const margin = 8;
  const below = window.innerHeight - r.bottom - margin;
  const above = r.top - margin;
  /* a trigger near the bottom of the window has no room under it — open
     upwards instead of letting the menu run off the fold */
  const flip = below < 160 && above > below;
  const maxHeight = Math.max(120, Math.min(cap, flip ? above : below));
  const width = opts.width ?? Math.max(r.width, minWidth);
  const wanted = align === 'right' ? r.right - width : r.left;
  return {
    top: flip ? Math.max(margin, r.top - maxHeight - 6) : r.bottom + 6,
    // never start off-screen, whichever edge it was asked to line up with
    left: Math.max(margin, Math.min(wanted, window.innerWidth - width - margin)),
    width,
    maxHeight,
  };
}
