# JKP Property — Frontend Monorepo

Industrial property brokerage platform (public site + admin CMS). Next.js App
Router · TypeScript (strict) · Tailwind + handoff design tokens · next-intl (th/en/zh).

> **Planning docs:** see [`FRONTEND_PLAN.md`](./FRONTEND_PLAN.md) (the build plan)
> and [`SPEC_PACK.md`](./SPEC_PACK.md) (binding requirements — source of truth).
>
> **Design system:** per user directive (2026-07-22) this project follows the
> design system in [`JKP_Property_Handoff.md`](./JKP_Property_Handoff.md) **ONLY**
> (green-first / `green-brand-*` / doc 08 is deprecated here).

## Status — Phase FE-0 (Foundation) ✅

Scaffold is in place and builds green. What's wired:

- **npm workspaces** monorepo (`apps/*`, `packages/*`). *(pnpm not installed on
  this machine; layout stays pnpm-compatible — `pnpm import` later if desired.)*
- **`packages/tokens`** — design tokens (CSS vars / Tailwind preset / typed theme /
  JSON) codified from `JKP_Property_Handoff.md`: teal accent `#034956`, gold
  `#D9A62B`, purple (admin), pill buttons, large radius. Values the handoff
  doesn't specify are marked `(derived)` in `handoff-tokens.json`.
- **`packages/domain`** — locked STATUS_ENUMS, lead-pipeline state-machine guard,
  money/date/area formatters.
- **`packages/ui`** — component library A1–A27 (30 components, Radix-backed,
  handoff-styled) + Storybook (`npm run storybook -w @jkp/ui`). See
  `packages/ui/CONVENTIONS.md`.
- **`packages/api-client`** — `{ data, meta, errors }` envelope types + `fetchApi`
  wrapper (concrete resource types generated from OpenAPI later).
- **`apps/web`** — single Next.js app, two root layouts via route groups:
  - `(site)/[locale]/…` → locale-prefixed public site (`/th`, `/en`, `/zh`);
    `/` → 307 `/th`.
  - `(admin)/admin/…` → admin shell (no locale prefix, near-black sidebar).
  - **D1 redirects:** `/[locale]/property/*` and `/[locale]/listing-single/*`
    → 301 `/[locale]/listing/*`.
  - `sitemap.ts` (with hreflang alternates) + `robots.ts`.

Public pages render as SSG (SEO-ready); listing detail is dynamic.

## Getting started

```bash
npm install          # install all workspaces
npm run dev          # dev server → http://localhost:3000  (apps/web)
npm run build        # production build (type-checks)
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit (apps/web)
```

> Run npm scripts from the **repo root** (`C:\jkpprop`), not inside a package dir.

Environment (create `apps/web/.env.local`):

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com   # used by sitemap/robots
NEXT_PUBLIC_API_BASE_URL=/api/v1               # api-client base
```

## Layout

```
apps/web/                     # Next.js app (public + admin + api later)
  src/app/(site)/[locale]/    # public, locale-prefixed
  src/app/(admin)/admin/      # admin shell
  src/i18n/                   # next-intl routing / request / navigation
  messages/{th,en,zh}.json    # UI copy (no hardcoded strings — NFR-04)
packages/tokens               # design tokens (handoff-based)
packages/ui                   # component library (shadcn-based)
packages/domain               # enums, state machines, formatters
packages/api-client           # typed API envelope + fetch
```

## Storybook

```bash
npm run storybook -w @jkp/ui         # dev → http://localhost:6006
npm run build-storybook -w @jkp/ui   # static build
```

## Public pages (FE-2) ✅

Home, Listing search (filters/sort/pagination/compare, empty→requirement),
Listing detail (section contract + map-visibility privacy + 404 + inquiry),
compare page, and the SEO layer (per-page metadata, hreflang, JSON-LD, noindex
policy). Built on a **mock data layer** in `apps/web/src/data` (fixtures + a
filter/query engine) designed to swap to `/api/v1` — nothing else changes in the
pages when the real API lands.

## Conversion core (FE-3) ✅

3-step Requirement wizard (react-hook-form + zod, search-prefill, review, success),
Contact page + channels, and the listing-bound inquiry — all posting to a **real
intake seam**: one shared zod schema validates on both client and server, and Next
route handlers `POST /api/v1/public/{requirements,inquiries}` do server-side
validation + honeypot + rate-limit and return the `{ data, meta, errors }` envelope
(field-mapped errors). Three source channels: `contact_page`, `listing_inquiry`,
`requirement_form`. Swap the in-memory route bodies for the CRM/DB later — the forms
don't change.

## Admin / operations (FE-4) ✅

Guarded admin app (`/admin`, single-language Thai, outside `[locale]`): mock cookie
auth + RBAC + login (`/admin/login`), a dashboard (stat cards + pipeline funnel +
activity/task feeds), and the **Leads workspace** — index (URL-driven filters) and
master-detail with a status dropdown driven by the `@jkp/domain` lead **state
machine** (`nextStatuses`), assignment, notes/tasks timeline, and a
cancel-requirement dialog that requires a reason + field (FR-CRM-07). Interactions
are optimistic/simulated; auth + mutations swap to real endpoints later.
**Demo login:** any email + password → super_admin. Other admin nav entries
(shortlists/visits/deals/properties/listings/CMS/SEO/users) are later phases and
are not built yet.

## Next up — Phase FE-5

Shortlist builder + availability gate + the client shortlist token view (`/s/[token]`)
with per-item feedback. See `FRONTEND_PLAN.md` §9.
