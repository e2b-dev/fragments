# AI Website Builder — Agent Instructions

> Every team member's AI agent loads this file automatically. It is the single source of truth for project-wide rules.
>
> **This project runs on three layers of coordination:**
> - **Alignment** (shared, non-negotiable) — shared agent context, architecture rules, domain contracts, Display types, code conventions. This is the shared grammar. Everyone follows it. Not optional.
> - **Convergence** (shared, non-negotiable) — weekly cadence, sync sessions, Friday integration, Coherence Manager role. How the team stays aligned without micromanaging. See `docs/way-of-work.md`.
> - **Execution** (personal, autonomous) — how you build within your domain. Your agents, your methods (BMad, GSD, Obra, Cursor, whatever works). The team cares that your Monday intention becomes a working artifact by sync, not how you got there.
>
> The freedom to execute your own way is earned by the discipline of the first two layers.

## Project

AI-powered website generation platform for property managers. PMs sign up via Onseason, connect their PMS through ZEPL, and get a direct-booking website they customize through natural language prompts in a chat UI. Built on a fork of E2B Fragments.

## Architecture — The One Rule

Every feature module in the generated website template follows **three layers with strict boundaries**:

| Layer | Location | LLM Editable? |
|---|---|---|
| **Presentation** | `src/modules/*/components/`, `src/modules/*/pages/`, `src/components/` | YES |
| **Adapter** | `src/modules/*/engine/` (hooks, transforms, Display types) | NO — protected |
| **Data** | `@onseason/zepl-client` npm package, Payload CMS local API | NO — centrally managed |

If a change needs to cross from presentation into the adapter layer, it requires a human decision and domain-owner sync.

## Domain Map

| Domain | Scope | Key Output |
|---|---|---|
| **A: Builder Experience** | Fragments fork, chat UI, E2B lifecycle, Claude integration, git commit flow, session persistence | PM can prompt, preview, undo, publish |
| **B: Website Template + Booking** | Next.js 15 template, three-layer modules, booking components, E2B template image | Template boots in E2B, renders booking pages with ZEPL data |
| **C: CMS + Content** | Payload integration, blog module, cross-module blocks, media, per-customer DB | PM creates/edits posts, posts embed live booking components |
| **D: ZEPL Client + Onseason Integration** | `@onseason/zepl-client` npm package, auth bridge, config injection, provisioning | Typed SDK, PM login via Onseason, Publish triggers Vercel |

**If you're unsure whether something crosses a domain boundary, assume it crosses and check first.**

## Code Conventions

- TypeScript strict mode. No `any` types.
- Functional React components with hooks. No class components.
- Named exports for components. Default exports only for Next.js page files.
- File naming: kebab-case for files, PascalCase for components, camelCase for hooks/utils.
- Tailwind CSS for all styling. No CSS modules, styled-components, or inline styles.
- TanStack Query for all server state. No manual `fetch` + `useState`.
- Zod for runtime validation at API boundaries.
- shadcn/ui as the base component library.

## Git Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- AI-generated commits from the builder: `ai: [PM's original prompt]`
- Branch naming: `domain-a/feature-name`, `domain-b/feature-name`, etc.
- Within your domain: merge directly, CI must pass.
- Crossing a boundary: PR required, reviewed by affected domain owner + Coherence Manager.

## Technology Stack

### Builder UI (this repo — Fragments fork)
- Next.js 14 (App Router), Vercel AI SDK, Claude Sonnet, Morph, E2B SDK, Upstash KV

### Generated Website Template
- Next.js 15, React 19, Tailwind v4, shadcn/ui, TanStack Query v5, Bun, Payload CMS 3.x, Zod

### Infrastructure (per customer)
- E2B (preview sandboxes), GitHub (one repo per PM), Vercel (production hosting), MongoDB Atlas/Neon (Payload DB)

### Existing Ecosystem (not built here)
- **Onseason** — PM auth, reservations, payments
- **ZEPL** — Unified PMS API (search, listings, availability, quotes)

## Key Docs

- `docs/project-context.md` — Full shared context with architecture details and Display type interfaces
- `docs/domain-contracts.md` — Integration surfaces between all four domains
- `docs/way-of-work.md` — Team cadence, sync model, coherence process
- `docs/domains/` — Per-domain agent briefs
- `docs/agent-rules-template.md` — The `.agent-rules.md` that ships inside generated PM sites
- `docs/e2b-template-guide.md` — E2B sandbox template setup guide

## Error Handling Philosophy

- ZEPL API errors: catch at hook level, surface user-friendly messages.
- AI generation errors: never show a broken preview. Fall back to last working state.
- Payload errors: fail gracefully. Blog down should not break booking.
