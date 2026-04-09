# Domain B: Website Template + Booking — Agent Brief

> Feed this file to your AI agent alongside `CLAUDE.md`. It defines what Domain B owns, can modify, and must not touch.

---

## Scope

You own the **generated website template** and the **booking module**: the Next.js 15 app that every PM's site is built from, including the three-layer module architecture, all booking components, the E2B custom template image, and the `.agent-rules.md` that governs what the AI can modify.

## Key Deliverable

**A working template that boots in E2B, renders listing search/detail/checkout pages with ZEPL data, and respects the three-layer boundary.**

## What You Own

| Area | Details |
|---|---|
| Template repo | `booking-site-template/` — the Next.js 15 app that gets forked per PM |
| Three-layer architecture | Presentation / Adapter / Data separation for all modules |
| Booking module — presentation | `src/modules/booking/components/` and `pages/` — ListingCard, SearchBar, AvailabilityCalendar, etc. |
| Booking module — adapter | `src/modules/booking/engine/` — hooks (useListingSearch, useListing, useQuote, useAvailability), transforms, Display types |
| Shared components | `src/components/` — Header, Footer, Navigation, Hero, Testimonials, etc. |
| `.agent-rules.md` | The rules file that defines AI editing boundaries. Domain A consumes this. |
| E2B custom template image | The template definition that pre-installs all deps for fast sandbox boot |
| Tailwind theming | `tailwind.config.ts` — design tokens customized per customer |
| shadcn/ui base | Component library files live in the repo, AI can modify them |

## What You Consume (Do NOT Modify)

| Dependency | Owner | Contract |
|---|---|---|
| `@onseason/zepl-client` | Domain D | Typed SDK for ZEPL API. Your adapter hooks import from this. Pin to semver range. |
| `payload.config.ts` | Domain C | CMS schema. Your cross-module block renderers must match the block schemas C defines. |
| `site.config.json` | Domain D (via Onseason) | Per-customer config injected at build time. |

## The Three-Layer Rule (Your Core Responsibility)

```
Presentation (LLM CAN modify)
  |-- components/*.tsx — JSX, Tailwind, layout
  |-- pages/*.tsx — page composition
  |
Adapter (PROTECTED — you maintain, LLM cannot touch)
  |-- engine/hooks/*.ts — TanStack Query wrappers calling ZEPL client
  |-- engine/transforms/*.ts — SDK types -> Display types
  |-- engine/types.ts — DisplayListing, DisplaySearch, etc.
  |
Data (PROTECTED — centrally managed)
  |-- @onseason/zepl-client — npm package from Domain D
  |-- Payload CMS local API — managed by Domain C
```

**You are the guardian of this boundary.** The `.agent-rules.md` file you write enforces it for the AI agent.

## Display Types You Define

- `DisplayListing` — listing card/detail data
- `DisplaySearch` — search results + filters
- `DisplayQuote` — pricing breakdown
- `DisplayAvailability` — calendar data

See `docs/project-context.md` section 6 for full interfaces.

## Week 1 Target

Create the template repo with the three-layer structure. Booking module scaffolded with placeholder components. Boots in E2B. Renders with mock ZEPL data.

## Key Risks

- **Template drift** — once PMs heavily customize their sites, the update story (bump SDK, all sites inherit) may have edge cases. Define how far a site can drift before manual reconciliation.
- **E2B template image rebuilds** — adding Payload (Domain C) adds database dependency to the image. Coordinate with C.
- **Display type stability** — adding/changing Display type fields affects all presentation components. Be conservative with breaking changes.

## Tech Stack (Your Layer)

- Next.js 15 (App Router, Server Components)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui
- TanStack Query v5
- Bun (runtime + package manager)
- Zod (validation in transforms)
