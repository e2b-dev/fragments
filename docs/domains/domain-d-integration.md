# Domain D: ZEPL Client + Onseason Integration — Agent Brief

> Feed this file to your AI agent alongside `CLAUDE.md`. It defines what Domain D owns, can modify, and must not touch.

---

## Scope

You own the **typed SDK for ZEPL**, the **Onseason authentication bridge**, **PM config injection**, **per-customer provisioning** (GitHub repo, Vercel project, database), and the **publish/deployment pipeline**.

## Key Deliverable

**A typed `@onseason/zepl-client` npm package that all sites use. PM logs in via Onseason, config flows into the builder. Publish triggers Vercel deployment.**

## What You Own

| Area | Details |
|---|---|
| `@onseason/zepl-client` | Private npm package — typed HTTP client for ZEPL API with Zod validation |
| Onseason auth bridge | Session token validation, PM identity flow into the builder |
| PM config API | API shape that returns ZEPL credentials, branding, feature flags for a given PM |
| Provisioning pipeline | New PM signup: create GitHub repo (fork of template), Vercel project, database |
| Deployment API | Triggered by builder's Publish button -> Vercel production deploy |
| `site.config.json` schema | Per-customer configuration structure |

## What You Consume (Do NOT Modify)

| Dependency | Owner | Contract |
|---|---|---|
| Template repo structure | Domain B | You fork this for each new PM. Don't modify the template itself. |
| Payload database schema | Domain C | You provision the database; C defines what's inside it. |
| Builder's session flow | Domain A | A calls your config API on session start. A calls your deploy API on publish. |

## SDK Package: `@onseason/zepl-client`

### Exported Functions

```typescript
// Search listings with filters
searchListings(params: SearchParams): Promise<SearchResult>

// Get single listing by ID
getListingById(id: string): Promise<Listing>

// Check availability for dates
checkAvailability(id: string, params: AvailabilityParams): Promise<Availability>

// Get itemized pricing quote
getQuote(params: QuoteParams): Promise<Quote>
```

### Package Responsibilities

- TypeScript interfaces matching ZEPL response shapes (`Listing`, `SearchResult`, `Availability`, `Quote`)
- Fetch wrappers with error handling and retries
- Zod schemas for runtime validation of API responses
- Published as private npm package — update once, all customer sites inherit on version bump

### ZEPL API Endpoints Wrapped

| SDK Function | ZEPL Endpoint | Method |
|---|---|---|
| `searchListings` | `GET /search` | GET |
| `getListingById` | `GET /listing/:id` | GET |
| `checkAvailability` | `GET /availability/:id` | GET |
| `getQuote` | `POST /quote` | POST |

Reservations (`POST /reservation`) are handled by Onseason, not the SDK.

## Provisioning Pipeline

When a new PM signs up and wants a website:

1. Fork `booking-site-template` -> `onseason-sites/[pm-name]`
2. Create Vercel project linked to the new repo
3. Provision database (MongoDB Atlas or Neon) for Payload CMS
4. Set environment variables on Vercel project (ZEPL_API_KEY, DATABASE_URI, etc.)
5. Return all references via a single API response:
   - `repoUrl` — for Domain A (session persistence)
   - `databaseUri` — for Domain C (Payload)
   - `vercelProjectId` — for publish flow
   - `previewUrl` — for the PM

## Config API Shape (Consumed by Domain A)

```typescript
interface PMConfig {
  pmId: string;
  pmName: string;
  repoUrl: string;          // GitHub repo for this PM's site
  vercelProjectId: string;
  zepl: {
    apiKey: string;
    apiBase: string;
  };
  branding: {
    name: string;
    primaryColor: string;
    logo: string;
  };
  features: {
    booking: { enabled: boolean; search: boolean; checkout: boolean; reviews: boolean };
    blog: { enabled: boolean; categories: boolean; newsletter: boolean; relatedListings: boolean };
    contact: { enabled: boolean };
  };
}
```

## Week 1 Target

`@onseason/zepl-client` package published to private registry. Typed endpoints for `searchListings` and `getListingById`. Onseason config API shape defined and documented. Mock data available for other domains to develop against.

## Key Risks

- **SDK versioning discipline** — breaking changes cascade through Domain B's transforms into all customer sites. Strict semver. No breaking changes without a sync.
- **Provisioning complexity** — creating GitHub repos + Vercel projects + databases atomically is non-trivial. Need rollback strategy for partial failures.
- **Auth token security** — Onseason session tokens flow through the builder. Validate on every request, never store in client-side state beyond the session.

## Tech Stack (Your Layer)

- TypeScript (strict mode)
- Zod (runtime validation)
- Octokit (GitHub API for repo management)
- Vercel API (project creation, deployment triggers)
- npm/pnpm (package publishing)
- Onseason API (existing, you consume and bridge)
- ZEPL API (existing, you wrap in typed SDK)
