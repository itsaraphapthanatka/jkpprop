# @jkp/ui — Component conventions (FE-1)

Read this before authoring any component. Design system = **`JKP_Property_Handoff.md` ONLY**
(green-first is deprecated). See `packages/ui/src/components/button.tsx` as the reference.

## Rules

- **Named exports only.** No default exports. File names kebab-case (`text-input.tsx`).
- Add **`'use client';`** at the very top of any file using hooks, state, event handlers, Radix, cmdk, sonner, or react-day-picker.
- Import the class helper: `import { cn } from '../lib/cn';`
- Use `class-variance-authority` (`cva`) for multi-variant components (see button.tsx).
- **No hardcoded hex.** Use only the token utilities listed below (or `var(--…)` for edge cases).
- **No new dependencies.** Everything you need is installed (list below). Do not edit `index.ts` or `package.json`. Only create files under `src/components/`.
- Every interactive element: **visible focus ring** (`focus-visible:shadow-focus` or `focus-visible:shadow-focus-contrast` on filled controls), respect disabled state, keyboard accessible.
- Status/state must be conveyed with **icon + text**, never color alone.
- Icons: `lucide-react`, default `strokeWidth={1.7}`, size 20 (`className="size-5"` or width/height). Icon-only buttons need `aria-label`.
- Do **not** run installs or builds. Only write files.

## Installed deps you may import

Runtime: `@radix-ui/react-{slot,label,checkbox,radio-group,switch,tabs,accordion,dialog,tooltip,select,popover}`, `cmdk`, `sonner`, `react-day-picker`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
Story types: `@storybook/react` (`Meta`, `StoryObj`).

## Token utilities (from the handoff Tailwind preset — use these exact classes)

- **Brand/green:** `bg-brand-600` (primary), `hover:bg-brand-700`, `active:bg-brand-800`, `bg-brand-50` (soft), `text-brand-600/700`, `border-brand-600`. Neon: `bg-brand-neon` (on dark only).
- **Accent (deep teal `#034956`):** `text-accent`, `bg-accent`, `border-accent` — eyebrow, links, price, emphasis.
- **Gold `#D9A62B`:** `text-gold`, `bg-gold` — phone/sort/recommend.
- **pine** `bg-pine`/`text-pine`; **purple** `bg-purple`/`text-purple` (admin); **sidebar** `bg-sidebar`; **footer** `bg-footer`.
- **Surfaces:** `bg-surface-base|alt|card|tint|muted`.
- **Text:** `text-content-primary|secondary|muted|muted3|inverse|brand|accent`.
- **Borders:** `border-line` (default), `border-line-subtle`, `border-line-brand`; card border width: `border-card` (1.5px).
- **Status:** `bg-success|warning|danger|info`, subtle bg `bg-danger-subtle` (etc.), readable text `text-danger-text` (etc.). Danger = `#C0392B`, warning = gold, info = teal.
- **Radius:** `rounded-xs`(8) `rounded-sm`(12) `rounded-md`(16) `rounded-lg`(20) `rounded-xl`(24) `rounded-full`(pill).
- **Shadow:** `shadow-xs|sm|md|lg`, `shadow-glow` (button hover), `shadow-focus`, `shadow-focus-contrast`, `shadow-focus-error`.
- **Type:** `text-xs`(13) `text-sm`(14) `text-base`(16) `text-lg`(18) `text-xl`(20) `text-price`(21) `text-2xl`(22) `text-3xl`(24) `text-4xl`(34) `text-5xl`(44). Weight `font-{normal,medium,semibold,bold,extrabold}`. Eyebrow: `text-xs font-bold uppercase tracking-eyebrow text-accent`.
- **Motion:** `duration-fast|base|slow` (200/300/350ms), `ease-standard|emphasis`.
- **Z-index:** `z-{sticky,header,dropdown,drawer,modal,popover,toast,tooltip}`.
- **Gradient:** `bg-gradient-emerald` (CTA cards).

## Handoff component patterns (must follow)

- **Buttons & chips = pill** (`rounded-full`). Buttons: hover lift (`hover:-translate-y-0.5`) + `hover:shadow-glow` on filled variants.
- **Cards** = `border-card border-line rounded-lg bg-surface-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-base`.
- **Inputs** = `h-10 rounded-md border border-line bg-surface-card px-4`, focus `focus-visible:border-brand-600 focus-visible:shadow-focus`, error `border-danger shadow-focus-error`, disabled muted. Label above field (`<Label>`), never placeholder-as-label. Errors below via `aria-describedby` + `aria-invalid`.
- **Badges** = small pill `h-[22px] px-2 rounded-full text-xs font-medium`. **StatusChip** = badge + **leading dot** + text.
- **Modal** = center, `rounded-lg` (20), max-w ~460–520, header/body/footer split, scrim `bg-[var(--scrim-overlay)]`, focus trap (Radix Dialog).
- **Drawer** = slide from right (desktop) / bottom (mobile), widths 320/400.
- **Tabs** = 2px brand underline indicator; active `text-brand-600`.
- Reduced motion is handled globally; still avoid motion-only signals.

## Stories (CSF3)

Each component file gets a sibling `*.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Thing } from './thing';

const meta = { title: 'Primitives/Thing', component: Thing } satisfies Meta<typeof Thing>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { /* … */ } };
```

Show the meaningful states (default / hover note / disabled / error / sizes / variants) as separate exports where relevant.
