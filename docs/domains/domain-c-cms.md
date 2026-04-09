# Domain C: CMS + Content — Agent Brief

> Feed this file to your AI agent alongside `CLAUDE.md`. It defines what Domain C owns, can modify, and must not touch.

---

## Scope

You own the **Payload CMS integration** and the **blog module**: everything related to content management, blog posts, cross-module blocks that embed booking components inside blog content, media uploads, and per-customer database provisioning schema.

## Key Deliverable

**A PM can create/edit blog posts via Payload admin. Posts can embed live booking components (listing cards, availability widgets, CTAs). Blog design is LLM-editable through the builder.**

## What You Own

| Area | Details |
|---|---|
| Payload CMS config | `payload.config.ts` — collections, blocks, admin panel setup |
| Blog module — presentation | `src/modules/blog/components/` and `pages/` — PostCard, PostGrid, PostContent, CategoryFilter, etc. |
| Blog module — adapter | `src/modules/blog/engine/` — hooks (usePosts, usePost, useCategories), transforms, Display types |
| Cross-module blocks | `src/modules/blog/engine/blocks/` — listing-embed, availability-widget, booking-cta |
| Blog Display types | `DisplayPost`, `DisplayCategory` — defined in blog's `engine/types.ts` |
| Media handling | Image uploads, Vercel Blob storage integration |
| Payload admin route | `src/app/(admin)/admin/[[...segments]]/page.tsx` |

## What You Consume (Do NOT Modify)

| Dependency | Owner | Contract |
|---|---|---|
| Booking components | Domain B | Cross-module blocks render `ListingCard`, `AvailabilityCalendar`, etc. from Domain B's presentation layer. You must match their props (Display types). |
| `DisplayListing` type | Domain B | Your `listing-embed` block renders a `ListingCard` that accepts `DisplayListing`. If B changes this type, your block breaks. |
| Database URI provisioning | Domain D | Domain D provisions per-customer databases. You define the schema via Payload; D provides the connection string. |
| Template file structure | Domain B | Your blog module lives inside B's template. Follow the three-layer pattern. |

## Collections You Define

| Collection | Purpose |
|---|---|
| `posts` | Blog posts with rich text + custom blocks |
| `categories` | Blog categories for filtering |
| `media` | Image/file uploads (stored in Vercel Blob) |

## Cross-Module Blocks (Your Critical Contract)

These blocks bridge the blog and booking modules. They are defined in your engine layer but render components from Domain B's presentation layer.

| Block | Renders | Data Source |
|---|---|---|
| `listing-embed` | `ListingCard` component | ZEPL via `useListing` hook |
| `availability-widget` | `AvailabilityCalendar` component | ZEPL via `useAvailability` hook |
| `booking-cta` | Booking call-to-action | Static config from `site.config.json` |

**Each block schema must match both the Payload block definition (your side) and the booking component props (Domain B's side).** Display types are the firewall.

## Week 1 Target

Payload installed in the template. `posts` collection defined. Admin panel accessible at `/admin`. One sample post renders on `/blog`. Basic `DisplayPost` type and transforms working.

## Key Risks

- **Payload + Vercel serverless** — Payload's database connections and Vercel's serverless model create cold start issues. Validate early with a production-like test.
- **Cross-module block stability** — If Domain B changes booking component props, your block renderers break. Coordinate via Display type contracts.
- **Per-customer database provisioning** — Each PM needs their own database. MongoDB Atlas or Neon. Domain D handles provisioning, you handle schema migration.

## Tech Stack (Your Layer)

- Payload CMS 3.x (embedded in Next.js app)
- MongoDB Atlas or Neon (per-customer database)
- Vercel Blob (media storage)
- Rich text editor (Payload's default, potentially Lexical)
- TanStack Query (for blog data fetching hooks)
